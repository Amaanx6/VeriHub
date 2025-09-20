// highlight-manager.js - Handles all highlighting and tooltip functionality for VeriHub
class HighlightManager {
  constructor() {
    this.highlightedElements = [];
    this.tooltipElement = null;
    this.stylesInjected = false;
  }

  // Create and inject tooltip styles
  injectStyles() {
    if (this.stylesInjected || document.getElementById("verihub-styles")) return;
    
    const style = document.createElement("style");
    style.id = "verihub-styles";
    style.textContent = `
      .verihub-highlight {
        background-color: rgba(239, 68, 68, 0.3) !important;
        border-bottom: 3px solid #000000 !important;
        cursor: help !important;
        position: relative !important;
        display: inline !important;
        padding: 0px !important;
        font-weight: normal !important;
        text-transform: none !important;
        letter-spacing: normal !important;
      }
     
      .verihub-highlight.severity-high {
        background-color: rgba(239, 68, 68, 0.3) !important;
        border-color: #ef4444 !important;
      }
     
      .verihub-highlight.severity-medium {
        background-color: rgba(239, 68, 68, 0.2) !important;
        border-color: #ef4444 !important;
      }
     
      .verihub-highlight.severity-low {
        background-color: rgba(107, 114, 128, 0.3) !important;
        border-color: #6b7280 !important;
      }
      
      .verihub-tooltip {
        position: absolute !important;
        z-index: 999999 !important;
        background: #000000 !important;
        color: white !important;
        padding: 16px !important;
        border: 4px solid #ef4444 !important;
        font-size: 14px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-weight: bold !important;
        text-transform: uppercase !important;
        letter-spacing: 1px !important;
        max-width: 400px !important;
        line-height: 1.4 !important;
        pointer-events: auto !important;
        opacity: 0 !important;
        transform: translateY(10px) !important;
        transition: opacity 0.3s ease, transform 0.3s ease !important;
      }
      
      .verihub-tooltip.show {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
      
      .verihub-tooltip-header {
        font-weight: 900 !important;
        margin-bottom: 8px !important;
        color: #ef4444 !important;
        font-size: 16px !important;
        border-bottom: 2px solid #ef4444 !important;
        padding-bottom: 4px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
      }
      
      .verihub-tooltip-content {
        background: #1f2937 !important;
        padding: 8px !important;
        border: 2px solid #ffffff !important;
        margin-bottom: 8px !important;
      }
      
      .verihub-tooltip-correction {
        background: #065f46 !important;
        color: #10b981 !important;
        padding: 8px !important;
        border: 2px solid #ffffff !important;
        margin-bottom: 8px !important;
      }
      
      .verihub-tooltip-report {
        text-align: center !important;
        border-top: 2px solid #ef4444 !important;
        padding-top: 8px !important;
      }
      
      .verihub-report-btn {
        background: #ef4444 !important;
        color: white !important;
        border: 4px solid #ffffff !important;
        padding: 8px 16px !important;
        font-size: 12px !important;
        font-weight: 900 !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
        text-transform: uppercase !important;
        letter-spacing: 1px !important;
        transform: scale(1) !important;
      }
      
      .verihub-report-btn:hover {
        background: #ffffff !important;
        color: #000000 !important;
        transform: scale(1.05) !important;
      }
      
      .verihub-tooltip-severity {
        display: inline-block !important;
        padding: 4px 8px !important;
        border: 2px solid #ffffff !important;
        font-size: 10px !important;
        font-weight: 900 !important;
        text-transform: uppercase !important;
        letter-spacing: 1px !important;
      }
      
      .verihub-tooltip-severity.high {
        background: #ef4444 !important;
        color: white !important;
      }
      
      .verihub-tooltip-severity.medium {
        background: #ef4444 !important;
        color: white !important;
      }
      
      .verihub-tooltip-severity.low {
        background: #6b7280 !important;
        color: white !important;
      }

      .verihub-tooltip-section-label {
        font-weight: 900 !important;
        color: #ffffff !important;
        font-size: 12px !important;
        margin-bottom: 4px !important;
        text-transform: uppercase !important;
        letter-spacing: 1px !important;
      }
    `;
    
    document.head.appendChild(style);
    this.stylesInjected = true;
  }

  // Create tooltip element with hover events
  createTooltip(issue) {
    if (this.tooltipElement) {
      this.tooltipElement.remove();
    }
    
    this.tooltipElement = document.createElement("div");
    this.tooltipElement.className = "verihub-tooltip";
    this.tooltipElement.innerHTML = `
      <div class="verihub-tooltip-header">
        MISINFORMATION DETECTED
        <span class="verihub-tooltip-severity ${issue.severity}">${issue.severity}</span>
      </div>
      <div class="verihub-tooltip-content">
        <div class="verihub-tooltip-section-label">WHY IT'S FALSE</div>
        <div>${issue.reason}</div>
      </div>
      <div class="verihub-tooltip-correction">
        <div class="verihub-tooltip-section-label">CORRECT INFORMATION</div>
        <div>${issue.correction}</div>
      </div>
      <div class="verihub-tooltip-report">
        <button class="verihub-report-btn">REPORT CONTENT</button>
      </div>
    `;
    
    // Add click event for report button
    const reportBtn = this.tooltipElement.querySelector('.verihub-report-btn');
    reportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Send message to background script (not directly to extension)
      chrome.runtime.sendMessage({
        type: 'SHOW_REPORT_FORM',
        reportData: {
          url: window.location.href,
          title: document.title,
          flaggedContent: issue.claim,
          reason: issue.reason,
          correction: issue.correction,
          severity: issue.severity
        }
      });
      
      // Hide tooltip after clicking
      if (this.tooltipElement) {
        this.tooltipElement.remove();
        this.tooltipElement = null;
      }
    });
    
    // Add hover events to tooltip itself
    let hideTimeout;

    this.tooltipElement.addEventListener("mouseenter", () => {
      clearTimeout(hideTimeout);
    });
    
    this.tooltipElement.addEventListener("mouseleave", () => {
      if (this.tooltipElement) {
        this.tooltipElement.classList.remove("show");
        setTimeout(() => {
          if (this.tooltipElement) {
            this.tooltipElement.remove();
            this.tooltipElement = null;
          }
        }, 200);
      }
    });
    
    document.body.appendChild(this.tooltipElement);
    return this.tooltipElement;
  }

  // Position tooltip relative to element
  positionTooltip(tooltip, element) {
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.bottom + 15 + window.scrollY;
    
    // Adjust if tooltip would go off screen horizontally
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    
    // Check if there's enough space below
    const spaceBelow = window.innerHeight - (rect.bottom + 15);
    const spaceAbove = rect.top - 15;
    
    // Only show above if there's significantly more space above AND not enough space below
    if (spaceBelow < tooltipRect.height && spaceAbove > spaceBelow + 50) {
      top = rect.top + window.scrollY - tooltipRect.height - 15;
    }
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  // More flexible text matching and highlighting
  highlightText(searchText, issue) {
    console.log(`Attempting to highlight: "${searchText.substring(0, 100)}..."`);

    // Multiple matching strategies
    const strategies = [
      // Strategy 1: Exact phrase match (case insensitive)
      (text) => text.toLowerCase().includes(searchText.toLowerCase()),

      // Strategy 2: Most words match (60% threshold)
      (text) => {
        const searchWords = searchText
          .toLowerCase()
          .trim()
          .split(/\s+/)
          .filter((w) => w.length > 2);
        const textWords = text.toLowerCase().split(/\s+/);
        const matches = searchWords.filter((word) =>
          textWords.some((tw) => tw.includes(word) || word.includes(tw))
        );
        return (
          matches.length >= Math.max(2, Math.floor(searchWords.length * 0.6))
        );
      },

      // Strategy 3: Key words match (fuzzy)
      (text) => {
        const keyWords = searchText.toLowerCase().match(/\b\w{4,}\b/g) || [];
        if (keyWords.length === 0) return false;
        const matches = keyWords.filter((word) =>
          text.toLowerCase().includes(word)
        );
        return matches.length >= Math.max(1, Math.floor(keyWords.length * 0.5));
      },
    ];
    
    // Get all text nodes from main content areas first
    const contentAreas = [
      ...document.querySelectorAll(
        'article, main, .content, .post, .article-body, .story-body, [role="main"]'
      ),
      document.body,
    ];
    
    let highlighted = false;
    
    for (const area of contentAreas) {
      if (highlighted) break;
      
      const walker = document.createTreeWalker(area, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          const tagName = parent.tagName.toLowerCase();
          if (
            ["script", "style", "noscript", "nav", "header", "footer"].includes(tagName)
          ) {
            return NodeFilter.FILTER_REJECT;
          }

          if (
            parent.classList.contains("verihub-highlight") ||
            parent.classList.contains("verihub-tooltip") ||
            parent.closest(".verihub-highlight, .verihub-tooltip") ||
            parent.closest("#verihub-popup")
          ) {
            return NodeFilter.FILTER_REJECT;
          }

          const text = node.textContent.trim();
          return text.length > 15
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      });
      
      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node);
      }
      
      // Try each strategy
      for (
        let strategyIndex = 0;
        strategyIndex < strategies.length && !highlighted;
        strategyIndex++
      ) {
        const strategy = strategies[strategyIndex];

        for (const textNode of textNodes) {
          const text = textNode.textContent;

          if (strategy(text)) {
            try {
              // Create highlight wrapper
              const highlight = document.createElement("span");
              highlight.className = `verihub-highlight severity-${issue.severity}`;
              highlight.setAttribute("data-verihub-issue", JSON.stringify(issue));

              // Wrap the text node
              const parent = textNode.parentNode;
              parent.insertBefore(highlight, textNode);
              highlight.appendChild(textNode);

              this.highlightedElements.push(highlight);
              
              // Add hover events
              let showTimeout;
              let hideTimeout;
              
              const showTooltip = () => {
                clearTimeout(hideTimeout);
                const tooltip = this.createTooltip(issue);
                this.positionTooltip(tooltip, highlight);

                showTimeout = setTimeout(() => {
                  if (tooltip && tooltip.parentNode) {
                    tooltip.classList.add("show");
                  }
                }, 100);
              };
              
              const hideTooltip = () => {
                clearTimeout(showTimeout);
                hideTimeout = setTimeout(() => {
                  if (this.tooltipElement) {
                    this.tooltipElement.classList.remove("show");
                    setTimeout(() => {
                      if (this.tooltipElement) {
                        this.tooltipElement.remove();
                        this.tooltipElement = null;
                      }
                    }, 200);
                  }
                }, 2000); // 2 second delay before hiding
              };
              
              highlight.addEventListener("mouseenter", showTooltip);
              highlight.addEventListener("mouseleave", hideTooltip);
              
              console.log(
                `Successfully highlighted with strategy ${
                  strategyIndex + 1
                }: "${text.substring(0, 50)}..."`
              );
              highlighted = true;
              break;
            } catch (error) {
              console.error("Error highlighting text:", error);
            }
          }
        }
      }
    }
    
    if (!highlighted) {
      console.warn(`Could not highlight: "${searchText.substring(0, 50)}..."`);

      // Fallback: Try to highlight any paragraph containing key words
      const keyWords = searchText.toLowerCase().match(/\b\w{4,}\b/g) || [];
      if (keyWords.length > 0) {
        const paragraphs = document.querySelectorAll("p, div, span");
        for (const para of paragraphs) {
          const text = para.textContent || "";
          if (
            text.length > 50 &&
            keyWords.some((word) => text.toLowerCase().includes(word))
          ) {
            try {
              para.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
              para.style.borderLeft = "6px solid #ef4444";
              para.style.paddingLeft = "12px";
              para.style.cursor = "help";
              para.style.fontWeight = "bold";
              para.setAttribute("data-verihub-fallback", JSON.stringify(issue));

              para.addEventListener("click", () => {
                alert(
                  `MISINFORMATION DETECTED (${issue.severity.toUpperCase()})\n\nREASON: ${issue.reason.toUpperCase()}\n\nCORRECTION: ${issue.correction.toUpperCase()}`
                );
              });

              this.highlightedElements.push(para);
              console.log(`Fallback highlight applied to paragraph`);
              break;
            } catch (error) {
              console.error("Error applying fallback highlight:", error);
            }
          }
        }
      }
    }
  }

  // Handle highlighting false claims
  handleHighlightFalseClaims(data) {
    console.log("Starting to highlight false claims:", data.issues.length);

    // Inject styles
    this.injectStyles();

    // Clean up any existing highlights
    this.cleanupHighlights();

    // Small delay to ensure page is ready
    setTimeout(() => {
      // Highlight each issue
      data.issues.forEach((issue, index) => {
        console.log(
          `Processing claim ${index + 1}:`,
          issue.claim.substring(0, 50) + "..."
        );
        this.highlightText(issue.claim, issue);
      });
      
      console.log(
        `Highlighting complete. ${this.highlightedElements.length} elements highlighted.`
      );

      // Show notification if highlights were added
      if (this.highlightedElements.length > 0) {
        console.log(
          `VeriHub found ${this.highlightedElements.length} potentially false claims on this page!`
        );
      }
    }, 500);
  }

  // Clean up all highlights
  cleanupHighlights() {
    this.highlightedElements.forEach((element) => {
      if (element && element.parentNode) {
        // Check if it's a fallback highlight
        if (element.hasAttribute("data-verihub-fallback")) {
          // Remove fallback styles
          element.style.backgroundColor = "";
          element.style.borderLeft = "";
          element.style.paddingLeft = "";
          element.style.cursor = "";
          element.style.fontWeight = "";
          element.removeAttribute("data-verihub-fallback");
        } else {
          // Move text back to parent and remove highlight wrapper
          const parent = element.parentNode;
          while (element.firstChild) {
            parent.insertBefore(element.firstChild, element);
          }
          parent.removeChild(element);
        }
      }
    });
    
    this.highlightedElements = [];
    
    if (this.tooltipElement) {
      this.tooltipElement.remove();
      this.tooltipElement = null;
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HighlightManager;
} else {
  // Ensure it's available globally in browser context
  window.HighlightManager = HighlightManager;
}

// Also make it available immediately
if (typeof window !== 'undefined') {
  window.HighlightManager = HighlightManager;
}