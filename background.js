chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTabs") {
    chrome.tabs.query({}, (tabs) => {
      sendResponse(tabs);
    });
    return true;
  }

  if (request.action === "getTabContent") {
    chrome.scripting.executeScript({
      target: { tabId: request.tabId },
      function: () => document.documentElement.outerHTML
    }, (results) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else if (results && results[0]) {
        sendResponse({ html: results[0].result });
      } else {
        sendResponse({ error: "Could not get tab content" });
      }
    });
    return true;
  }
});