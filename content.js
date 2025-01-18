// Send a message to the background script to get cookies for the current domain
chrome.runtime.sendMessage({ action: "getCookiesForCurrentDomain" }, (response) => {
    if (response && response.success) {
      console.log("Cookies for the current", response.domain , response.cookies);
    } else {
      console.error("Failed to retrieve cookies.");
    }
  });
  