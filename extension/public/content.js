// content.js - Enhanced DOM extraction for VeriHub extension
(() => {
  console.log('🔍 VeriHub content script loaded on:', window.location.href);

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
      
      // Important: return true to indicate we'll send a response asynchronously
      return true;
    }
    
    // Handle other message types if needed
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
        // Extension popup might not be open, that's okay
        console.log('📤 Could not signal ready (popup not open)');
      });
    } catch (error) {
      // Extension context might not be available
      console.log('📤 Extension context not available for ready signal');
    }
  };

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