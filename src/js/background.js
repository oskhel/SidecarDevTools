/*
 * Copyright (c) 2015 SugarCRM Inc. Licensed by SugarCRM under the Apache 2.0 license.
 */

//Handle request from devtools
chrome.runtime.onConnect.addListener(function(port) {
    // Listening to the extension page.
    port.onMessage.addListener(function(message) {
        // Sending to the content script.
        chrome.tabs.sendMessage(message.tabId, message);
    });

    // Listening to the content script messages.
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        // Sending to the extension page.
        port.postMessage(message);
    });
});

/**
 * Holds the state of debug mode. True means we should debug the page.
 */
let debug = false;
let hasAPIs = chrome.webRequest;

/**
 * Responds to clicks on the extension's icon. Toggles debug mode.
 */
chrome.action.onClicked.addListener((tab) => {
    debug = !debug;
    chrome.action.setTitle({
        title: debug ? 'Sidecar Debug: ON' : 'Sidecar Debug: OFF'
    });
    chrome.action.setBadgeText({
        text: debug ? 'ON' : ''
    });

    chrome.tabs.update(tab.id, {url: tab.url, active: true});
    chrome.tabs.reload();

    hasAPIs && chrome.webRequest.handlerBehaviorChanged();
});

hasAPIs && chrome.webRequest.onCompleted.addListener((details) => {

    // if we are in debug mode or the script is actually a sourcemap, skip
    // the attachment (was probably added already from `sidecar.min.js` or
    // `sidecar.js`)
    if (!debug || details.url.indexOf('sidecar.min.js.map') > 0) {
        return;
    }

    chrome.scripting.executeScript({
        target: {tabId: details.tabId},
        files: ['js/debug-mode-injector.js']
    });

}, {urls: ['*://*/*/sidecar.js*', '*://*/*/sidecar.min.js*']});
