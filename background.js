// Background script for My Todo Lists extension

// On installation, set the side panel to open on action click.
// This is a more modern and robust approach than using action.onClicked.
chrome.runtime.onInstalled.addListener(() => {
    console.log('My Todo Lists extension installed');
    // Set the side panel to open automatically when the user clicks the action icon.
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error('Failed to set panel behavior:', error));
});

// The chrome.action.onClicked listener is no longer needed.

// Keep the service worker alive by responding to messages from the side panel.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'keepAlive') {
        // This response is sent back to the side panel.
        sendResponse({ status: 'alive' });
    }
    // Return true to indicate that the response will be sent asynchronously.
    // This is crucial for onMessage listeners in service workers.
    return true;
});