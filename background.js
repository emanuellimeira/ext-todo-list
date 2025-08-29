// Background script for My Todo Lists extension

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('My Todo Lists extension installed');
});

// Handle action button click to open side panel
chrome.action.onClicked.addListener(async (tab) => {
    try {
        // Open side panel for the current window
        await chrome.sidePanel.open({ windowId: tab.windowId });
        console.log('Side panel opened successfully');
    } catch (error) {
        console.error('Error opening side panel:', error);
    }
});

// Enable side panel on extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Extension started');
});

// Keep service worker alive
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'keepAlive') {
        sendResponse({ status: 'alive' });
    }
    return true;
});