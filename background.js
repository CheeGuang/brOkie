//service worker
chrome.cookies.getAll({}, function(cookies) {
  console.log(cookies);
});


// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getCookiesForCurrentDomain") {
      // Get the current tab's URL
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          sendResponse({ success: false, error: "No active tab found." });
          return;
        }
  
        const url = new URL(tabs[0].url);
        let domain = url.hostname;
  
        // Remove "www." prefix if it exists
        if (domain.startsWith("www.")) {
          domain = domain.substring(4);
        }
  
        // Retrieve cookies for the normalized domain
        chrome.cookies.getAll({ domain }, (cookies) => {
          sendResponse({ success: true, cookies });
        });
      });
  
      // Indicate that the response will be sent asynchronously
      return true;
    }
  });
  