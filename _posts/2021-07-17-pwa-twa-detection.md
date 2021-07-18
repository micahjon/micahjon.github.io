---
title: Bulletproof PWA and TWA Detection
date: 2021-07-17 22:02:00 -08:00
description: How to differentiate normal browser sessions from installed PWAs & TWAs
tags: post
---

## Detecting an Installed PWA

The simplest way to tell between a standard browser session and an installed PWA session is by checking `display-mode`. Assuming your PWA runs in "standalone" mode (defined in your web app manifest file, [learn more about display modes here](https://web.dev/display-override/)), you can simply check the `display-mode` property.

```js
/**
 * Is the page currently in standalone display mode (used by PWA)?
 * @return {boolean}
 */
function isInStandaloneMode() {
  return Boolean(
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
    || window.navigator.standalone, // Fallback for iOS
  );
}
```

There is one gotcha: users can change the display mode of your PWA by making it fullscreen. In this case, your best bet is to *detect standalone mode initially*, store a flag in SessionStorage, and then check that flag for every page view in your session. 

```js
// Run this code as soon as possible (before user has a chance to change display mode)
let hasBeenInStandaloneMode;
if (isInStandaloneMode()) {
  hasBeenInStandaloneMode = true;
  sessionStorage.setItem('is_standalone_mode', 'yes');
} else {
  hasBeenInStandaloneMode = sessionStorage.getItem('is_standalone_mode') === 'yes';
}

/**
 * Is this an installed PWA?
 * @return {boolean}
 */
export function isInstalledPwaSession() {
  return hasBeenInStandaloneMode;
}
```

**Note:** It's important to use SessionStorage instead of LocalStorage b/c LocalStorage is shared with the browser, and you don't want to mark tabs in the browser as part of a PWA session just because at some point in the past a user opened your PWA.

## Detecting a TWA (Trusted Web Activity)

Packaging your PWA as a TWA is required for listing it in the Play Store. Essentially, you generate tiny Android app that references your PWA start URL, key asset URLs, and a version number. 

Most of this data should already be in your web app manifest, so the process is relatively painless using a tool like the Bubblewrap CLI.

When a TWA is opened on Android, the TWA app ID is exposed to the start URL page via the referrer. We can use a similar technique to detect the Android TWA as we did the PWA above:

```js
// Read more about this solution here: https://stackoverflow.com/a/54580415/1546808
let isAndroidTwaSession;
if (document.referrer.includes('android-app://<your.twa.package.name>')) {
  isAndroidTwaSession = true;
  sessionStorage.setItem('has_android_twa_referrer', 'yes');
} else {
  isAndroidTwaSession = sessionStorage.getItem('has_android_twa_referrer') === 'yes';
}
```

Unfortunately, this doesn't work on ChromeOS (`document.referrer` is empty). Hopefully it does at some point in the future, but for the time being, if you're releasing a TWA on Chromebook, you'll need to customize the start URL in the `twa-manifest.json` file created by Bubblewrap. In my case, I kept using the same start URL as the PWA, but added a `#play-store-twa` hash:

```json
// manifest.json (for PWA)
"startUrl": "/pwa-start-url/"

// twa-manifest.json (just for TWA, used by Bubblewrap CLI)
"startUrl": "/pwa-start-url/#play-store-twa"
```

Then check for this hash as soon as possible on the start URL page:

```js
// Check for #play-store-twa hash in start URL to identify TWA
let hasPlayStoreTwaHash;
if (window.location.pathname === '/pwa-start-url/' && window.location.hash === '#play-store-twa') {
    hasPlayStoreTwaHash = true;
    sessionStorage.setItem('is_play_store_twa', 'yes');
} else {
    hasPlayStoreTwaHash = sessionStorage.getItem('is_play_store_twa') === 'yes';
}

export function isTwaSession() {
  return hasPlayStoreTwaHash && isInstalledPwaSession();
}
```

