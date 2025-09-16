// content.js - Enhanced DOM extraction and highlighting for VeriHub extension
(() => {
  console.log('🔍 VeriHub content script loaded on:', window.location.href);

  // Store highlighted elements for cleanup
  let highlightedElements = [];
  let tooltipElement = null;

  // Function to get clean, formatted DOM
  const getDomString = () => {
    try {
      // Create a clean copy of the document
      const docClone = document.cloneNode(true);
      
      // Remove script tags, style tags, and comments for cleaner output
      const elementsToRemove = docClone.querySelectorAll('script, style, noscript');
      elementsToRemove.forEach(el => el.remove());
      
      // Remove comments
      const walker = document.createTreeWalker(
        docClone,
        NodeFilter.SHOW_COMMENT,
        null,
        false
      );
      
      const comments = [];
      let node;
      while (node = walker.nextNode()) {
        comments.push(node);
      }
      comments.forEach(comment => comment.remove());
      
      // Get the HTML string
      let htmlString = docClone.documentElement.outerHTML;
      
      // Basic formatting - add line breaks after closing tags
      htmlString = htmlString
        .replace(/></g, '>\n<')
        .replace(/^\s+|\s+$/gm, '') // Remove leading/trailing whitespace from lines
        .split('\n')
        .filter(line => line.trim().length > 0) // Remove empty lines
        .join('\n');
      
      return htmlString;
    } catch (error) {
      console.error('❌ Error processing DOM:', error);
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
      domain: window.location.hostname
    };
  };

  // Create and inject tooltip styles
  const injectStyles = () => {
    if (document.getElementById('verihub-styles')) return;

    const style = document.createElement('style');
    style.id = 'verihub-styles';
    style.textContent = `
      .verihub-highlight {
        background-color: rgba(255, 193, 7, 0.3) !important;
        border-bottom: 2px wavy #dc3545 !important;
        cursor: help !important;
        position: relative !important;
      }
      
      .verihub-highlight.severity-high {
        background-color: rgba(220, 53, 69, 0.2) !important;
        border-bottom-color: #dc3545 !important;
      }
      
      .verihub-highlight.severity-medium {
        background-color: rgba(255, 193, 7, 0.2) !important;
        border-bottom-color: #ffc107 !important;
      }
      
      .verihub-highlight.severity-low {
        background-color: rgba(13, 202, 240, 0.2) !important;
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
        pointer-events: none !important;
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

  // Create tooltip element
  const createTooltip = (issue) => {
    if (tooltipElement) {
      tooltipElement.remove();
    }

    tooltipElement = document.createElement('div');
    tooltipElement.className = 'verihub-tooltip';
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

    document.body.appendChild(tooltipElement);
    return tooltipElement;
  };

  // Position tooltip relative to element
  const positionTooltip = (tooltip, element) => {
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
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

  // Find and highlight text in the DOM
  const highlightText = (searchText, issue) => {
    // Clean up previous highlights first
    cleanupHighlights();

    // Create a more flexible search pattern
    const searchWords = searchText.toLowerCase().trim().split(/\s+/);
    const minWordMatch = Math.max(2, Math.floor(searchWords.length * 0.6)); // Match at least 60% of words

    // Find all text nodes
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip script, style, and already highlighted elements
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          if (parent.classList.contains('verihub-highlight') || 
              parent.classList.contains('verihub-tooltip')) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Only consider nodes with substantial text
          const text = node.textContent.trim();
          return text.length > 10 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    // Search for matches
    for (const textNode of textNodes) {
      const text = textNode.textContent.toLowerCase();
      
      // Count matching words
      const matchingWords = searchWords.filter(word => text.includes(word));
      
      if (matchingWords.length >= minWordMatch) {
        // Create highlight wrapper
        const highlight = document.createElement('span');
        highlight.className = `verihub-highlight severity-${issue.severity}`;
        highlight.setAttribute('data-verihub-issue', JSON.stringify(issue));
        
        // Wrap the text node
        const parent = textNode.parentNode;
        parent.insertBefore(highlight, textNode);
        highlight.appendChild(textNode);
        
        highlightedElements.push(highlight);

        // Add hover events
        let hideTimeout;

        highlight.addEventListener('mouseenter', (e) => {
          clearTimeout(hideTimeout);
          const tooltip = createTooltip(issue);
          positionTooltip(tooltip, highlight);
          
          // Small delay to show tooltip
          setTimeout(() => {
            if (tooltip && tooltip.parentNode) {
              tooltip.classList.add('show');
            }
          }, 50);
        });

        highlight.addEventListener('mouseleave', () => {
          if (tooltipElement) {
            tooltipElement.classList.remove('show');
            hideTimeout = setTimeout(() => {
              if (tooltipElement) {
                tooltipElement.remove();
                tooltipElement = null;
              }
            }, 200);
          }
        });

        console.log(`✅ Highlighted: "${searchText.substring(0, 50)}..." with ${matchingWords.length} matching words`);
        break; // Only highlight first match to avoid duplicates
      }
    }
  };

  // Clean up all highlights
  const cleanupHighlights = () => {
    highlightedElements.forEach(element => {
      if (element && element.parentNode) {
        // Move text back to parent and remove highlight wrapper
        const parent = element.parentNode;
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
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
    console.log('🎯 Starting to highlight false claims:', data.issues.length);
    
    // Inject styles
    injectStyles();
    
    // Clean up any existing highlights
    cleanupHighlights();
    
    // Highlight each issue
    data.issues.forEach((issue, index) => {
      console.log(`📍 Highlighting claim ${index + 1}:`, issue.claim.substring(0, 100) + '...');
      highlightText(issue.claim, issue);
    });

    console.log(`✅ Highlighting complete. ${highlightedElements.length} elements highlighted.`);
  };

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Content script received message:', request.type);
    
    if (request.type === "GET_DOM") {
      try {
        const domString = getDomString();
        const pageInfo = getPageInfo();
        
        const response = {
          dom: domString,
          ...pageInfo,
          success: true,
          length: domString.length
        };
        
        console.log('✅ Sending DOM response:', {
          length: response.length,
          domain: response.domain,
          title: response.title?.substring(0, 50) + '...'
        });
        
        sendResponse(response);
      } catch (error) {
        console.error('❌ Error in GET_DOM handler:', error);
        sendResponse({
          success: false,
          error: error.message,
          dom: ''
        });
      }
      
      return true;
    }
    
    if (request.type === "HIGHLIGHT_FALSE_CLAIMS") {
      try {
        handleHighlightFalseClaims(request.data);
        sendResponse({ success: true });
      } catch (error) {
        console.error('❌ Error highlighting claims:', error);
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

  // Signal that content script is ready
  const signalReady = () => {
    try {
      chrome.runtime.sendMessage({
        type: 'CONTENT_SCRIPT_READY',
        url: window.location.href,
        title: document.title
      }).catch(err => {
        console.log('📤 Could not signal ready (popup not open)');
      });
    } catch (error) {
      console.log('📤 Extension context not available for ready signal');
    }
  };

  // Cleanup on page navigation
  window.addEventListener('beforeunload', () => {
    cleanupHighlights();
  });

  // Wait for page to be fully loaded before signaling ready
  if (document.readyState === 'complete') {
    signalReady();
  } else {
    window.addEventListener('load', signalReady);
  }

  // Also handle DOM content loaded for faster response
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('📄 DOM content loaded');
    });
  }

  console.log('🚀 VeriHub content script fully initialized');
})();