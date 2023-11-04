// background.js

function encodeToBase64(value) {
    return btoa(unescape(encodeURIComponent(value)));
}

function decodeFromBase64(encodedValue) {
    return decodeURIComponent(escape(atob(encodedValue)));
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "setCookie") {
        const encodedValue = encodeToBase64(request.value);
        chrome.cookies.set({ url: request.url, name: request.name, value: encodedValue }, function (cookie) {
            sendResponse(cookie);
        });
    } else if (request.action === "getCookie") {
        chrome.cookies.get({ url: request.url, name: request.name }, function (cookie) {
            if (cookie && cookie.value) {
                const decodedValue = decodeFromBase64(cookie.value);
                cookie.value = decodedValue;
            }
            sendResponse(cookie);
        });
    } else if (request.action === "deleteCookie") {
        chrome.cookies.delete({ url: request.url, name: request.name }, function (cookie) {
            sendResponse("done");
        });
    }
    return true;
});

chrome.tabs.onUpdated.addListener(
    function (tabId, changeInfo, tab) {
        // read changeInfo data and do something with it
        // like send the new url to contentscripts.js
        if (changeInfo.url) {
            chrome.tabs.sendMessage(tabId, {
                message: 'change',
                url: changeInfo.url
            })
        }
    }
);