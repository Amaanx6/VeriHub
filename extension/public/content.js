// Modified content.js (changes: changed message type to 'TRIGGER_ANALYSIS_FROM_CONTENT' for direct communication to popup; removed background dependency)
(() => {
  console.log("VeriHub content script loaded on:", window.location.href);
  // Store highlighted elements for cleanup
  let highlightedElements = [];
  let tooltipElement = null;
  let verificationPopup = null;
  // Function to get clean, formatted DOM
  const getDomString = () => {
    try {
      // Create a clean copy of the document
      const docClone = document.cloneNode(true);

      // Remove script tags, style tags, and comments for cleaner output
      const elementsToRemove = docClone.querySelectorAll(
        "script, style, noscript"
      );
      elementsToRemove.forEach((el) => el.remove());

      // Remove comments
      const walker = document.createTreeWalker(
        docClone,
        NodeFilter.SHOW_COMMENT,
        null,
        false
      );

      const comments = [];
      let node;
      while ((node = walker.nextNode())) {
        comments.push(node);
      }
      comments.forEach((comment) => comment.remove());

      // Get the HTML string
      let htmlString = docClone.documentElement.outerHTML;

      // Basic formatting - add line breaks after closing tags
      htmlString = htmlString
        .replace(/></g, ">\n<")
        .replace(/^\s+|\s+$/gm, "") // Remove leading/trailing whitespace from lines
        .split("\n")
        .filter((line) => line.trim().length > 0) // Remove empty lines
        .join("\n");

      return htmlString;
    } catch (error) {
      console.error("Error processing DOM:", error);
      // Fallback to simple extraction
      return document.documentElement.outerHTML;
    }
  };
  // Get page metadata
  const getPageInfo = () => {
    return {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
      domain: window.location.hostname,
    };
  };

  const triggerExtensionOpen = () => {
  // Send message to background to open extension
  chrome.runtime.sendMessage({
    type: 'OPEN_EXTENSION_FOR_ANALYSIS',
    url: window.location.href,
    title: document.title
  });
};

  // NEW: Create and show verification popup on webpage
  const showVerificationPopup = () => {
    // Remove existing popup if any
    if (verificationPopup) {
      verificationPopup.remove();
    }
    // Create popup HTML
    verificationPopup = document.createElement("div");
    verificationPopup.id = "verihub-popup";
    verificationPopup.innerHTML = `
      <div id="verihub-popup-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 400px;
          margin: 20px;
          padding: 24px;
          animation: verihubFadeIn 0.3s ease-out;
        ">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <div style="
              width: 32px;
              height: 32px;
              background: #3b82f6;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              margin-right: 12px;
            ">V</div>
            <h2 style="
              font-size: 18px;
              font-weight: 600;
              color: #1f2937;
              margin: 0;
            ">VeriHub Fact Checker</h2>
          </div>
         
          <div style="margin-bottom: 20px;">
            <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">New page detected:</p>
            <div style="
              background: #f9fafb;
              border-radius: 6px;
              padding: 12px;
              border: 1px solid #e5e7eb;
            ">
              <p style="
                font-weight: 500;
                font-size: 14px;
                margin: 0 0 4px 0;
                color: #374151;
                word-break: break-word;
              ">${document.title || "Untitled Page"}</p>
              <p style="
                font-size: 12px;
                color: #6b7280;
                margin: 0;
                word-break: break-all;
              ">${window.location.hostname}</p>
            </div>
          </div>
          <p style="
            font-size: 14px;
            color: #6b7280;
            margin: 0 0 20px 0;
            line-height: 1.4;
          ">Would you like to analyze this page for misinformation and false claims?</p>
          <div style="display: flex; gap: 12px;">
            <button id="verihub-verify-btn" style="
              flex: 1;
              background: #ef4444;
              color: white;
              padding: 10px 16px;
              border: none;
              border-radius: 6px;
              font-weight: 500;
              font-size: 14px;
              cursor: pointer;
              transition: background-color 0.2s;
            ">Check for False Claims</button>
            <button id="verihub-skip-btn" style="
              padding: 10px 16px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              background: white;
              color: #6b7280;
              font-size: 14px;
              cursor: pointer;
              transition: background-color 0.2s;
            ">Skip</button>
          </div>
        </div>
      </div>
    `;
    // Add CSS animation keyframes if not already added
    if (!document.getElementById("verihub-popup-styles")) {
      const style = document.createElement("style");
      style.id = "verihub-popup-styles";
      style.textContent = `
        @keyframes verihubFadeIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
    // Add event listeners
    const verifyBtn = verificationPopup.querySelector("#verihub-verify-btn");
    const skipBtn = verificationPopup.querySelector("#verihub-skip-btn");
    const overlay = verificationPopup.querySelector("#verihub-popup-overlay");
    verifyBtn.addEventListener("click", () => {
      console.log("User clicked verify - triggering analysis...");

      // Change button text to show loading
      verifyBtn.textContent = "Analyzing...";
      verifyBtn.disabled = true;
      verifyBtn.style.opacity = "0.7";

      // Directly trigger analysis without using storage
      chrome.runtime
        .sendMessage({
          type: "DIRECT_ANALYSIS_TRIGGER",
          url: window.location.href,
          title: document.title,
        })
        .catch((err) =>
          console.log("Extension popup not open, this is normal")
        );

      // Hide popup after 2 seconds
      setTimeout(() => {
        hideVerificationPopup();
      }, 2000);
    });
    skipBtn.addEventListener("click", hideVerificationPopup);

    // Close on overlay click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        hideVerificationPopup();
      }
    });
    // Add to page
    document.body.appendChild(verificationPopup);

    console.log("VeriHub popup displayed on webpage");
  };
  // Hide verification popup
  const hideVerificationPopup = () => {
    if (verificationPopup) {
      verificationPopup.remove();
      verificationPopup = null;
    }
  };
  // Create and inject tooltip styles
  const injectStyles = () => {
    if (document.getElementById("verihub-styles")) return;
    const style = document.createElement("style");
    style.id = "verihub-styles";
    style.textContent = `
      .verihub-highlight {
        background-color: rgba(255, 193, 7, 0.3) !important;
        border-bottom: 2px wavy #dc3545 !important;
        cursor: help !important;
        position: relative !important;
        display: inline !important;
        padding: 1px 2px !important;
        border-radius: 2px !important;
      }
     
      .verihub-highlight.severity-high {
        background-color: rgba(220, 53, 69, 0.3) !important;
        border-bottom-color: #dc3545 !important;
      }
     
      .verihub-highlight.severity-medium {
        background-color: rgba(255, 193, 7, 0.3) !important;
        border-bottom-color: #ffc107 !important;
      }
     
      .verihub-highlight.severity-low {
        background-color: rgba(13, 202, 240, 0.3) !important;
        border-bottom-color: #0dcaf0 !important;
      }
      .verihub-tooltip {
        position: absolute !important;
        z-index: 999999 !important;
        background: #333 !important;
        color: white !important;
        padding: 12px !important;
        border-radius: 8px !important;
        font-size: 14px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        max-width: 300px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        line-height: 1.4 !important;
        pointer-events: auto !important;
        opacity: 0 !important;
        transform: translateY(10px) !important;
        transition: opacity 0.2s ease, transform 0.2s ease !important;
      }
      .verihub-tooltip.show {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
      .verihub-tooltip::before {
        content: '' !important;
        position: absolute !important;
        top: -5px !important;
        left: 20px !important;
        border: 5px solid transparent !important;
        border-bottom-color: #333 !important;
      }
      .verihub-tooltip-header {
        font-weight: bold !important;
        margin-bottom: 8px !important;
        color: #ff6b6b !important;
      }
      .verihub-tooltip-correction {
        margin-top: 8px !important;
        padding-top: 8px !important;
        border-top: 1px solid #555 !important;
        color: #90ee90 !important;
      }
      .verihub-tooltip-severity {
        display: inline-block !important;
        padding: 2px 6px !important;
        border-radius: 12px !important;
        font-size: 11px !important;
        font-weight: bold !important;
        text-transform: uppercase !important;
        margin-left: 8px !important;
      }
      .verihub-tooltip-severity.high {
        background: #dc3545 !important;
        color: white !important;
      }
      .verihub-tooltip-severity.medium {
        background: #ffc107 !important;
        color: #333 !important;
      }
      .verihub-tooltip-severity.low {
        background: #0dcaf0 !important;
        color: #333 !important;
      }
    `;
    document.head.appendChild(style);
  };
  // Create tooltip element with hover events
  const createTooltip = (issue) => {
    if (tooltipElement) {
      tooltipElement.remove();
    }
    tooltipElement = document.createElement("div");
    tooltipElement.className = "verihub-tooltip";
    tooltipElement.innerHTML = `
      <div class="verihub-tooltip-header">
        False Claim Detected
        <span class="verihub-tooltip-severity ${issue.severity}">${issue.severity}</span>
      </div>
      <div><strong>Reason:</strong> ${issue.reason}</div>
      <div class="verihub-tooltip-correction">
        <strong>Correction:</strong> ${issue.correction}
      </div>
    `;
    // Add hover events to tooltip itself
    let hideTimeout;

    tooltipElement.addEventListener("mouseenter", () => {
      clearTimeout(hideTimeout);
    });
    tooltipElement.addEventListener("mouseleave", () => {
      if (tooltipElement) {
        tooltipElement.classList.remove("show");
        setTimeout(() => {
          if (tooltipElement) {
            tooltipElement.remove();
            tooltipElement = null;
          }
        }, 200);
      }
    });
    document.body.appendChild(tooltipElement);
    return tooltipElement;
  };
  // Position tooltip relative to element
  const positionTooltip = (tooltip, element) => {
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.bottom + 10 + window.scrollY;
    // Adjust if tooltip would go off screen
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    // If tooltip would go below fold, show above element
    if (top + tooltipRect.height > window.innerHeight + window.scrollY - 10) {
      top = rect.top + window.scrollY - tooltipRect.height - 10;
    }
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };
  // IMPROVED: More flexible text matching and highlighting
  const highlightText = (searchText, issue) => {
    console.log(
      `Attempting to highlight: "${searchText.substring(0, 100)}..."`
    );

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
        acceptNode: function (node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          const tagName = parent.tagName.toLowerCase();
          if (
            ["script", "style", "noscript", "nav", "header", "footer"].includes(
              tagName
            )
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
              highlight.setAttribute(
                "data-verihub-issue",
                JSON.stringify(issue)
              );

              // Wrap the text node
              const parent = textNode.parentNode;
              parent.insertBefore(highlight, textNode);
              highlight.appendChild(textNode);

              highlightedElements.push(highlight);
              // Add hover events
              let showTimeout;
              let hideTimeout;
              const showTooltip = () => {
                clearTimeout(hideTimeout);
                const tooltip = createTooltip(issue);
                positionTooltip(tooltip, highlight);

                showTimeout = setTimeout(() => {
                  if (tooltip && tooltip.parentNode) {
                    tooltip.classList.add("show");
                  }
                }, 100);
              };
              const hideTooltip = () => {
                clearTimeout(showTimeout);
                if (tooltipElement) {
                  tooltipElement.classList.remove("show");
                  hideTimeout = setTimeout(() => {
                    if (tooltipElement && !tooltipElement.matches(":hover")) {
                      tooltipElement.remove();
                      tooltipElement = null;
                    }
                  }, 300);
                }
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
              para.style.backgroundColor = "rgba(255, 193, 7, 0.2)";
              para.style.borderLeft = "4px solid #ffc107";
              para.style.paddingLeft = "8px";
              para.style.cursor = "help";
              para.setAttribute("data-verihub-fallback", JSON.stringify(issue));

              para.addEventListener("click", () => {
                alert(
                  `False Claim Detected (${issue.severity})\n\nReason: ${issue.reason}\n\nCorrection: ${issue.correction}`
                );
              });

              highlightedElements.push(para);
              console.log(`Fallback highlight applied to paragraph`);
              break;
            } catch (error) {
              console.error("Error applying fallback highlight:", error);
            }
          }
        }
      }
    }
  };
  // Clean up all highlights
  const cleanupHighlights = () => {
    highlightedElements.forEach((element) => {
      if (element && element.parentNode) {
        // Check if it's a fallback highlight
        if (element.hasAttribute("data-verihub-fallback")) {
          // Remove fallback styles
          element.style.backgroundColor = "";
          element.style.borderLeft = "";
          element.style.paddingLeft = "";
          element.style.cursor = "";
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
    highlightedElements = [];
    if (tooltipElement) {
      tooltipElement.remove();
      tooltipElement = null;
    }
  };
  // Handle highlighting false claims
  const handleHighlightFalseClaims = (data) => {
    console.log("Starting to highlight false claims:", data.issues.length);

    // Inject styles
    injectStyles();

    // Clean up any existing highlights
    cleanupHighlights();

    // Small delay to ensure page is ready
    setTimeout(() => {
      // Highlight each issue
      data.issues.forEach((issue, index) => {
        console.log(
          `Processing claim ${index + 1}:`,
          issue.claim.substring(0, 50) + "..."
        );
        highlightText(issue.claim, issue);
      });
      console.log(
        `Highlighting complete. ${highlightedElements.length} elements highlighted.`
      );

      // Show notification if highlights were added
      if (highlightedElements.length > 0) {
        console.log(
          `VeriHub found ${highlightedElements.length} potentially false claims on this page!`
        );
      }
    }, 500);
  };
  // Listen for messages from the popup/extension
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Content script received message:", request.type);

    if (request.type === "GET_DOM") {
      try {
        const domString = getDomString();
        const pageInfo = getPageInfo();

        const response = {
          dom: domString,
          ...pageInfo,
          success: true,
          length: domString.length,
        };

        console.log("Sending DOM response:", {
          length: response.length,
          domain: response.domain,
          title: response.title?.substring(0, 50) + "...",
        });

        sendResponse(response);
      } catch (error) {
        console.error("Error in GET_DOM handler:", error);
        sendResponse({
          success: false,
          error: error.message,
          dom: "",
        });
      }

      return true;
    }

    if (request.type === "HIGHLIGHT_FALSE_CLAIMS") {
      try {
        handleHighlightFalseClaims(request.data);
        sendResponse({ success: true });
      } catch (error) {
        console.error("Error highlighting claims:", error);
        sendResponse({ success: false, error: error.message });
      }

      return true;
    }
    if (request.type === "CLEANUP_HIGHLIGHTS") {
      cleanupHighlights();
      sendResponse({ success: true });
      return true;
    }

    return false;
  });

  // In content.js - fixed notification bar
const showAnalysisBar = () => {
  if (document.getElementById('verihub-bar')) return;
  
  const bar = document.createElement('div');
  bar.id = 'verihub-bar';
  bar.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; right: 0; background: #dc2626; color: white; padding: 12px; z-index: 999999; text-align: center; font-family: system-ui;">
      <span>VeriHub: Check this page for false claims? </span>
      <button id="verihub-check-btn" 
              style="background: white; color: #dc2626; border: none; padding: 4px 12px; margin-left: 8px; border-radius: 4px; cursor: pointer;">
        Check Now
      </button>
      <button id="verihub-dismiss-btn" 
              style="background: transparent; color: white; border: 1px solid white; padding: 4px 12px; margin-left: 4px; border-radius: 4px; cursor: pointer;">
        Dismiss
      </button>
    </div>
  `;
  
  document.body.appendChild(bar);
  
  // Add event listeners (these work in content script context)
  document.getElementById('verihub-check-btn').addEventListener('click', () => {
    console.log('Setting trigger flag...');
    chrome.storage.local.set({ triggerAnalysis: true }, () => {
      console.log('Trigger flag set to true');
    });
    bar.remove();
  });
  
  document.getElementById('verihub-dismiss-btn').addEventListener('click', () => {
    bar.remove();
  });
};

// Show bar when page loads
if (document.readyState === 'complete') {
  showAnalysisBar();
} else {
  window.addEventListener('load', showAnalysisBar);
}
  // NEW: Show popup when page loads/changes
  const showPopupOnPageLoad = () => {
  setTimeout(() => {
    console.log("Opening VeriHub extension for analysis...");
    triggerExtensionOpen();
  }, 2000);
};
  // Cleanup on page navigation
  window.addEventListener("beforeunload", () => {
    cleanupHighlights();
    hideVerificationPopup();
  });
  // Show popup when page is ready
  if (document.readyState === "complete") {
    showPopupOnPageLoad();
  } else {
    window.addEventListener("load", showPopupOnPageLoad);
  }
  console.log(
    "VeriHub content script fully initialized with direct popup trigger"
  );
})();
