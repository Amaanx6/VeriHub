// Modified content.js (changes: extracted highlighting logic to separate file)
(() => {
  console.log("VeriHub content script loaded on:", window.location.href);
  
  // Initialize highlight manager
  let highlightManager;
  let verificationPopup = null;

  // Initialize highlight manager when needed
  const initializeHighlightManager = () => {
    if (!highlightManager) {
      // Check if HighlightManager is available
      if (typeof HighlightManager !== 'undefined') {
        highlightManager = new HighlightManager();
      } else {
        console.error("HighlightManager class not found. Make sure highlight-manager.js is loaded first.");
        return null;
      }
    }
    return highlightManager;
  };

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

  // Create and show verification popup on webpage
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
        const manager = initializeHighlightManager();
        if (manager) {
          manager.handleHighlightFalseClaims(request.data);
          sendResponse({ success: true });
        } else {
          throw new Error("Failed to initialize HighlightManager");
        }
      } catch (error) {
        console.error("Error highlighting claims:", error);
        sendResponse({ success: false, error: error.message });
      }

      return true;
    }
    
    if (request.type === "CLEANUP_HIGHLIGHTS") {
      if (highlightManager) {
        highlightManager.cleanupHighlights();
      }
      sendResponse({ success: true });
      return true;
    }

    return false;
  });

  // Fixed notification bar
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

  // Show popup when page loads/changes
  const showPopupOnPageLoad = () => {
    setTimeout(() => {
      console.log("Opening VeriHub extension for analysis...");
      triggerExtensionOpen();
    }, 2000);
  };

  // Cleanup on page navigation
  window.addEventListener("beforeunload", () => {
    if (highlightManager) {
      highlightManager.cleanupHighlights();
    }
    hideVerificationPopup();
  });

  // Show popup when page is ready
  if (document.readyState === "complete") {
    showPopupOnPageLoad();
  } else {
    window.addEventListener("load", showPopupOnPageLoad);
  }

  console.log("VeriHub content script fully initialized with separate highlight manager");
})();