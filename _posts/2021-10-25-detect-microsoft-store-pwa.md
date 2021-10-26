---
title: Detecting a PWA on the Microsoft Store
date: 2021-10-25 21:40:00 -08:00
description: How to track a  installed from the Microsoft Store
tags: post
---

A few weeks ago we submitted the [BeFunky PWA on the Microsoft Store](https://www.microsoft.com/en-us/p/photo-editor-by-befunky/9pjtxn8csrck?cid=msft_web_chart#activetab=pivot:overviewtab), after packaging it up with [pwabuilder.com](https://www.pwabuilder.com/).

After launching, we realized we had no way of distinguishing it from our PWA that users could install from their Edge or Chrome browser on Windows.

It turns out that Edge Chromium sets a special `document.referrer` when first opening your Microsoft Store PWA's start URL:

```js
// Microsoft Store PWA (first page load only)
document.referrer === 'app-info://platform/microsoft-store';
```

However, when users navigate to subsequent pages (or refresh the start URL), this special referrer will no longer be set. To accurately track additional page views, you'll need to use SessionStorage.

```js
/**
 * If the PWA's referrer is "app-info://platform/microsoft-store", we know that it 
 * was installed from the Microsoft Store
 * Save flag in SessionStorage for tracking future page views
 * @return {boolean}
 */
function isMicrosoftStorePWA() {
  // Check referrer when PWA is first opened
  if (document.referrer === 'app-info://platform/microsoft-store') {
    sessionStorage.setItem('is_ms_store_pwa', 'yes');
    return true;
  }

  // Subsequent navigations
  return sessionStorage.getItem('is_ms_store_pwa') === 'yes';
}
```

A couple minor notes:

- `sessionStorage` is used instead of `localStorage` so tracking is limited to the installed PWA session. `localStorage` is shared between all installed PWAs and website tabs in a given browser engine (in this case Edge Chromium).

- For simplicity I'm using `sessionStorage` directly, but keep in mind that in some rare instances it is not available due to privacy settings. At BeFunky, we wrap `sessionStorage` and `localStorage` calls in helper functions with `try-catch`, e.g.

```js
/**
 * Attempt to get value from SessionStorage
 * @return {string|null|undefined}
 */
function getSessionStorageValue(key) {
  try {
    return sessionStorage.getItem(key);
  } catch (err) {}
}

/**
 * Attempt to set value to SessionStorage
 * @return {boolean}
 */
function setSessionStorageValue(key, value) {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (err) {
    return false;
  }
}
```

This has worked for us thus far, but if you have any feedback or other ideas for improving this code, please leave a comment below.