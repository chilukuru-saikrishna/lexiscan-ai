chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "lexiscan-scan",
      title: "🔍 Analyze Clause with Lexiscan AI",
      contexts: ["selection"]
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "lexiscan-scan" && info.selectionText) {
    await chrome.storage.local.set({ 
      selectedClause: info.selectionText,
      autoTrigger: true 
    });
    chrome.action.openPopup();
  }
});