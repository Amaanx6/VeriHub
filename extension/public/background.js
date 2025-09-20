// background.js - Service Worker for Chrome Extension Auto-popup

// Configuration
const CONFIG = {
  // Minimum time between auto-triggers (in milliseconds)
  DEBOUNCE_TIME: 2000,
  // Domains to exclude from auto-trigger
  EXCLUDED_DOMAINS: [
    'chrome://',
    'chrome-extension://',
    'moz-extension://',
    'about:',
    'file://',
    'localhost',
    '127.0.0.1'
  ],
  // URL patterns to exclude (can be regex patterns as strings)
  EXCLUDED_PATTERNS: [
    '/search\\?',
    '/login',
    '/signup',
    '/auth',
    '/checkout'
  ]
};

let lastTriggerTime = 0;
let lastUrl = '';
let isExtensionOpen = false;

// Track if extension popup is open
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    isExtensionOpen = true;
    port.onDisconnect.addListener(() => {
      isExtensionOpen = false;
    });
  }
});

// Function to check if URL should trigger auto-popup
function shouldTriggerAutoPopup(url, title) {
  try {
    // Don't trigger if extension is already open
    if (isExtensionOpen) {
      console.log('Extension already open, skipping auto-trigger');
      return false;
    }

    // Don't trigger too frequently
    const now = Date.now();
    if (now - lastTriggerTime < CONFIG.DEBOUNCE_TIME) {
      console.log('Debounce time not reached, skipping auto-trigger');
      return false;
    }

    // Don't trigger for the same URL
    if (url === lastUrl) {
      console.log('Same URL as last trigger, skipping auto-trigger');
      return false;
    }

    const urlObj = new URL(url);
    
    // Check excluded domains
    for (const domain of CONFIG.EXCLUDED_DOMAINS) {
      if (url.startsWith(domain) || urlObj.hostname.includes(domain)) {
        console.log(`Excluded domain: ${domain}`);
        return false;
      }
    }

    // Check excluded patterns
    for (const pattern of CONFIG.EXCLUDED_PATTERNS) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(url)) {
        console.log(`Excluded pattern: ${pattern}`);
        return false;
      }
    }

    // Only trigger for HTTP/HTTPS URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.log('Not HTTP/HTTPS URL, skipping auto-trigger');
      return false;
    }

    // Additional checks - you can customize these
    // Skip if URL looks like a search results page
    if (urlObj.search.includes('q=') || urlObj.search.includes('search=')) {
      console.log('Search page detected, skipping auto-trigger');
      return false;
    }

    // Skip if page title suggests it's a system page
    if (title && (title.includes('404') || title.includes('Error') || title.includes('Loading'))) {
      console.log('System/error page detected, skipping auto-trigger');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in shouldTriggerAutoPopup:', error);
    return false;
  }
}

// Function to trigger auto-popup
async function triggerAutoPopup(url, title) {
  try {
    console.log('🚀 Triggering auto-popup for:', url, title);

    // Store trigger data first
    await chrome.storage.local.set({
      autoTrigger: true,
      triggerUrl: url,
      triggerTitle: title,
      triggerTime: Date.now()
    });

    console.log('✅ Auto-trigger data stored');

    // Check if there's an active window first
    const windows = await chrome.windows.getAll({ windowTypes: ['normal'] });
    if (windows.length === 0) {
      console.log('❌ No active browser windows found, skipping popup trigger');
      return;
    }

    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      console.error('❌ No active tab found');
      return;
    }

    // Open the extension popup
    try {
      await chrome.action.openPopup();
      console.log('✅ Popup opened successfully');
    } catch (popupError) {
      console.error('❌ Failed to open popup:', popupError);
      
      // Alternative: Try to focus on the extension icon
      try {
        // Create a new tab pointing to the extension popup
        await chrome.tabs.create({
          url: chrome.runtime.getURL('index.html'),
          active: true
        });
        console.log('✅ Opened extension in new tab as fallback');
      } catch (tabError) {
        console.error('❌ Fallback tab creation also failed:', tabError);
      }
    }
    
    // Update tracking variables
    lastTriggerTime = Date.now();
    lastUrl = url;

    console.log('✅ Auto-popup process completed');
  } catch (error) {
    console.error('❌ Critical error in triggerAutoPopup:', error);
  }
}

// Get current tab ID
async function getCurrentTabId() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab.id;
  } catch (error) {
    console.error('Error getting current tab ID:', error);
    return null;
  }
}

// Listen for tab updates (URL changes, page loads)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only trigger on complete page loads with URL
  if (changeInfo.status === 'complete' && tab.url && tab.title) {
    console.log('Tab updated:', tab.url, tab.title);
    
    if (shouldTriggerAutoPopup(tab.url, tab.title)) {
      await triggerAutoPopup(tab.url, tab.title);
    }
  }
});

// Listen for tab activation (switching between tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && tab.title) {
      console.log('Tab activated:', tab.url, tab.title);
      
      if (shouldTriggerAutoPopup(tab.url, tab.title)) {
        await triggerAutoPopup(tab.url, tab.title);
      }
    }
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});

// Listen for navigation events (for single-page applications)
chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  if (details.frameId === 0) { // Main frame only
    try {
      const tab = await chrome.tabs.get(details.tabId);
      if (tab.url && tab.title) {
        console.log('History state updated:', tab.url, tab.title);
        
        // Add a small delay to let the page update its title
        setTimeout(async () => {
          const updatedTab = await chrome.tabs.get(details.tabId);
          if (shouldTriggerAutoPopup(updatedTab.url, updatedTab.title)) {
            await triggerAutoPopup(updatedTab.url, updatedTab.title);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error handling history state update:', error);
    }
  }
});

// Optional: Listen for window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, windowId: windowId });
      if (tab && tab.url && tab.title) {
        console.log('Window focused with tab:', tab.url, tab.title);
        
        if (shouldTriggerAutoPopup(tab.url, tab.title)) {
          await triggerAutoPopup(tab.url, tab.title);
        }
      }
    } catch (error) {
      console.error('Error handling window focus change:', error);
    }
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started');
  lastTriggerTime = 0;
  lastUrl = '';
  isExtensionOpen = false;
});

// Handle extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);
  
  // Clear any existing auto-trigger data on install
  chrome.storage.local.remove(['autoTrigger', 'triggerUrl', 'triggerTitle', 'triggerTime']);
  
  lastTriggerTime = 0;
  lastUrl = '';
  isExtensionOpen = false;
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background received message:', message);
  
  switch (message.type) {
    case 'PAGE_READY':
      console.log('📄 Page ready message received:', message.url);
      if (shouldTriggerAutoPopup(message.url, message.title)) {
        triggerAutoPopup(message.url, message.title);
      }
      sendResponse({ success: true });
      break;
      
    case 'OPEN_EXTENSION_FOR_ANALYSIS':
      console.log('🔍 Extension open requested from report button');
      // Force open extension regardless of debounce/checks for user-initiated requests
      if (message.url && message.title) {
        triggerAutoPopup(message.url, message.title);
      }
      sendResponse({ success: true });
      break;
      
    case 'DISABLE_AUTO_TRIGGER':
      // Temporarily disable auto-trigger
      lastTriggerTime = Date.now();
      console.log('🚫 Auto-trigger disabled temporarily');
      sendResponse({ success: true });
      break;
      
    case 'GET_AUTO_TRIGGER_STATUS':
      sendResponse({ 
        isExtensionOpen,
        lastTriggerTime,
        lastUrl 
      });
      break;
      
    case 'MANUAL_TRIGGER':
      // Allow manual triggering from content script
      console.log('👆 Manual trigger requested');
      if (message.url && message.title) {
        triggerAutoPopup(message.url, message.title);
      }
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
  
  return true; // Keep message channel open for async response
});

// Cleanup old auto-trigger data periodically
setInterval(async () => {
  try {
    const result = await chrome.storage.local.get(['triggerTime']);
    if (result.triggerTime) {
      const age = Date.now() - result.triggerTime;
      // Remove auto-trigger data older than 5 minutes
      if (age > 5 * 60 * 1000) {
        await chrome.storage.local.remove(['autoTrigger', 'triggerUrl', 'triggerTitle', 'triggerTime']);
        console.log('Cleaned up old auto-trigger data');
      }
    }
  } catch (error) {
    console.error('Error cleaning up auto-trigger data:', error);
  }
}, 60000); // Check every minute

console.log('🎯 Background script loaded and ready');

// Test the auto-popup functionality after 3 seconds
setTimeout(async () => {
  try {
    console.log('🧪 Running test auto-popup...');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.title) {
      // Temporarily bypass shouldTriggerAutoPopup for testing
      console.log('🧪 Test triggering for:', tab.url, tab.title);
      await triggerAutoPopup(tab.url, tab.title);
    } else {
      console.log('🧪 No suitable tab found for testing');
    }
  } catch (error) {
    console.error('🧪 Test auto-popup failed:', error);
  }
}, 3000); // Test after 3 seconds