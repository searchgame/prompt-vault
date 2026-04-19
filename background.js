// Create the context menu item when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "saveAsPrompt",
      title: "Save as Prompt",
      contexts: ["selection"] // Only show when text is selected
    });
  });
  
  // Handle clicks on the context menu item
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "saveAsPrompt" && info.selectionText) {
      // Store the selected text temporarily so the popup can retrieve it
      chrome.storage.local.set({ newPromptFromSelection: info.selectionText }, () => {
        // Optional: open the popup immediately after saving.
        // This requires the "action" API in Manifest V3.
        // chrome.action.openPopup(); 
        // For now, the user can open the popup to see the prompt pre-filled.
      });
    }
  });