// background.js - Simple Service Worker for Chrome Extension Auto-popup

let lastUrl = '';

// Simple function to trigger auto-popup
async function triggerAutoPopup(url, title) {
  try {
    console.log('Triggering auto-popup for:', url);

    // Store trigger data
    await chrome.storage.local.set({
      autoTrigger: true,
      triggerUrl: url,
      triggerTitle: title,
      triggerTime: Date.now()
    });

    // Just try to open popup directly
    try {
      await chrome.action.openPopup();
      console.log('Popup opened successfully');
    } catch (error) {
      console.log('Failed to open popup:', error.message);
    }
    
    lastUrl = url;
  } catch (error) {
    console.error('Error in triggerAutoPopup:', error);
  }
}

// Only listen for tab updates (URL changes, page loads)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only trigger on complete page loads with URL
  if (changeInfo.status === 'complete' && tab.url && tab.url !== lastUrl) {
    // Skip chrome:// and extension URLs
    if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
      console.log('Tab updated to new URL:', tab.url);
      await triggerAutoPopup(tab.url, tab.title);
    }
  }
});

// Track popup connection
let popupPort = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    popupPort = port;
    port.onDisconnect.addListener(() => {
      popupPort = null;
    });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.type);
  
  if (message.type === 'SHOW_REPORT_FORM') {
    // First trigger auto-popup, then forward the message
    triggerAutoPopup(message.reportData.url, message.reportData.title);
    
    // Forward message to popup after a short delay to ensure popup opens
    setTimeout(() => {
      if (popupPort) {
        try {
          chrome.runtime.sendMessage(message);
        } catch (error) {
          console.log('Failed to send message to popup:', error.message);
        }
      } else {
        console.log('Popup not connected yet, will receive message when it opens');
      }
    }, 100);
    
    sendResponse({ success: true });
  }
  
  return true;
});

console.log('Background script loaded');