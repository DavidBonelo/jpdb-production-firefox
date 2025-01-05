let settings = {};

const skipGoods = document.querySelector("#skipgoods");
const hideonfail = document.querySelector("#hideonfail");
const maxTime = document.querySelector("#maxtime");
const username = document.querySelector("#username");
const userpin = document.querySelector("#userpin");
const ankify = document.querySelector("#ankify");
const pendingreviews = document.querySelector("#pendingreviews");
const limits = document.querySelector("#limits");
const save = document.querySelector("#savechanges");
const ankifyOptions = document.querySelector("#ankifyoptions");

document.addEventListener("DOMContentLoaded", () => {
  browser.storage.sync.get(["settings"], function (result) {
    settings = JSON.parse(result["settings"]);

    skipGoods.checked = settings.skipGoods;
    hideonfail.checked = settings.hideonfail;
    maxTime.value = settings.maxtime;
    username.value = settings.username;
    userpin.value = settings.userpin;
    ankify.checked = settings.ankify;
    pendingreviews.checked = settings.pendingreviews;
    limits.checked = settings.limits;

    if (settings.ankify) {
      ankifyOptions.hidden = false;
    }
  });
});

skipGoods.addEventListener("change", (e) => {
  settings.skipGoods = e.target.checked;

  browser.storage.sync.set({ settings: JSON.stringify(settings) }).then(() => {
    console.log("Value is set");
  });
});

hideonfail.addEventListener("change", (e) => {
  settings.hideonfail = e.target.checked;

  browser.storage.sync.set({ settings: JSON.stringify(settings) }).then(() => {
    console.log("Value is set");
  });
});

maxTime.addEventListener("change", (e) => {
  settings.maxtime = e.target.value;

  browser.storage.sync.set({ settings: JSON.stringify(settings) }).then(() => {
    console.log("Value is set");
  });
});

username.addEventListener("change", (e) => {
  settings.username = e.target.value;

  browser.storage.sync.set({ settings: JSON.stringify(settings) }).then(() => {
    console.log("Value is set");
  });
});

userpin.addEventListener("change", (e) => {
  settings.userpin = e.target.value;

  browser.storage.sync.set({ settings: JSON.stringify(settings) }).then(() => {
    console.log("Value is set");
  });
});

ankify.addEventListener("change", (e) => {
  settings.ankify = e.target.checked;

  if (e.target.checked) {
    ankifyOptions.hidden = false;

    settings.pendingreviews = true;
    settings.limits = true;

    pendingreviews.checked = true;
    limits.checked = true;
  } else {
    ankifyOptions.hidden = true;

    settings.pendingreviews = false;
    settings.limits = false;

    pendingreviews.checked = false;
    limits.checked = false;
  }

  browser.storage.sync.set({ settings: JSON.stringify(settings) }).then(() => {
    console.log("Value is set");
  });

  // Enable save button
  save.hidden = false;
});

pendingreviews.addEventListener("change", (e) => {
  settings.pendingreviews = e.target.checked;

  browser.storage.sync.set({ settings: JSON.stringify(settings) }).then(() => {
    console.log("Value is set");
  });

  // Enable save button
  save.hidden = false;
});

limits.addEventListener("change", (e) => {
  settings.limits = e.target.checked;

  browser.storage.sync.set({ settings: JSON.stringify(settings) }).then(() => {
    console.log("Value is set");
  });

  // Enable save button
  save.hidden = false;
});

save.addEventListener("click", () => {
  // Reload the page the user is on
  browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    browser.tabs.reload(tabs[0].id);
  });

  // Disable save button
  save.hidden = true;
});
