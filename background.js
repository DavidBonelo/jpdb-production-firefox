const serverUrl = "https://jpdb.manabe.es";

function encodeToBase64(value) {
  return btoa(unescape(encodeURIComponent(value)));
}

function decodeFromBase64(encodedValue) {
  return decodeURIComponent(escape(atob(encodedValue)));
}

async function getLeaderboard(sendResponse) {
  const rawRes = await fetch(serverUrl + "/leaderboard");
  const res = await rawRes.json();
  sendResponse(res);
}

async function addPoints(username, pin, points) {
  const body = {
    username: username,
    pin: pin,
    points: points,
  };
  const res = await fetch(serverUrl + "/add_points", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "setCookie") {
    const encodedValue = encodeToBase64(request.value);
    browser.cookies
      .set({
        url: request.url,
        name: request.name,
        value: encodedValue,
        expirationDate: request.expire
          ? parseInt(request.expire)
          : new Date().getTime() / 1000 + 3600,
      })
      .then((cookie) => {
        sendResponse(cookie);
      });
  } else if (request.action === "getCookie") {
    browser.cookies
      .get({ url: request.url, name: request.name })
      .then((cookie) => {
        if (cookie && cookie.value) {
          const decodedValue = decodeFromBase64(cookie.value);
          cookie.value = decodedValue;
        }
        sendResponse(cookie);
      });
  } else if (request.action === "deleteCookie") {
    browser.cookies
      .remove({ url: request.url, name: request.name })
      .then((cookie) => {
        sendResponse("done");
      });
  } else if (request.action === "getLeaderboard") {
    getLeaderboard(sendResponse);
  } else if (request.action === "addPoints") {
    browser.storage.sync.get(["settings"]).then((result) => {
      const settings = JSON.parse(result.settings);

      if (!settings.username || !settings.userpin) return;

      addPoints(settings.username, settings.userpin, request.points);
    });
  }
  return true;
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // read changeInfo data and do something with it
  // like send the new url to contentscripts.js
  if (changeInfo.url) {
    browser.tabs.sendMessage(tabId, {
      message: "change",
      url: changeInfo.url,
    });
  }
});
