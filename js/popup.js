let settings = {

}

const skipGoods = document.querySelector("#skipgoods");
const hideonfail = document.querySelector("#hideonfail");
const maxTime = document.querySelector("#maxtime");
const username = document.querySelector("#username");
const userpin = document.querySelector("#userpin");

document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.sync.get(['settings'], function (result) {
        settings = JSON.parse(result["settings"]);

        skipGoods.checked = settings.skipGoods;
        hideonfail.checked = settings.hideonfail;
        maxTime.value = settings.maxtime;
        username.value = settings.username;
        userpin.value = settings.userpin;
    });

})

skipGoods.addEventListener("change", (e) => {
    settings.skipGoods = e.target.checked;

    chrome.storage.sync.set({ settings: JSON.stringify(settings) }).then(() => {
        console.log("Value is set");
    });
})

hideonfail.addEventListener("change", (e) => {
    settings.hideonfail = e.target.checked;

    chrome.storage.sync.set({ settings: JSON.stringify(settings) }).then(() => {
        console.log("Value is set");
    });
})

maxTime.addEventListener("change", (e) => {
    settings.maxtime = e.target.value;

    chrome.storage.sync.set({ settings: JSON.stringify(settings) }).then(() => {
        console.log("Value is set");
    });
})

username.addEventListener("change", (e) => {
    settings.username = e.target.value;

    chrome.storage.sync.set({ settings: JSON.stringify(settings) }).then(() => {
        console.log("Value is set");
    });
})

userpin.addEventListener("change", (e) => {
    settings.userpin = e.target.value;

    chrome.storage.sync.set({ settings: JSON.stringify(settings) }).then(() => {
        console.log("Value is set");
    });
})