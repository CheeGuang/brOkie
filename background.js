//service worker
chrome.cookies.getAll({}, function(cookies) {
    console.log(cookies);
});
