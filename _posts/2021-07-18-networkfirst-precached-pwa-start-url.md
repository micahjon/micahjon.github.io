---
title: Network-first Pre-cached PWA Start URLs with Workbox
date: 2021-07-17 23:18:00 -08:00
description: How to serve an always-fresh Start URL with an offline fallback
tags: post
---

When deploying [BeFunky](https://www.befunky.com/) as a PWA, the trickiest problem I ran into was how to pre-cache the Start URL using a *Network-First Strategy*. In other words, how to meet these simple requirements:

### #1. If the user is online, fetch the latest Start URL page from the network

This is important for a variety of reasons:
- Hashed asset URLs may be hard-coded in the page's HTML. Serving a stale page means serving an outdated release.
- The Start URL page may contain dynamic server-rendered content.

### #2. If the user is offline, serve a pre-cached Start URL from the cache.

- Offline support makes your PWA feel like any other app on the user's device. It should at least open when offline.
- An offline Start URL is now a [requirement for Chrome to show the native PWA install prompt](https://web.dev/works-offline/).

<br>

This is called a "Network-first" caching strategy. It ensures your users are only served stale content when necessary, instead of by default while the service worker checks for and caches new assets. 

Pre-caching assets is very easy with Workbox's `precacheAndRoute` method, but it uses a Cache-first strategy. 

To pre-cache a PWA Start URL with a Network-First strategy, we must do the following:

1. Setup a Network-First caching strategy

2. Match Navigation routes (used when navigating to new pages), not standard subresource requests (used for fetching assets). 

3. Limit the cache to only the PWA Start URL, so each time you have a new release, the old entry is replaced

```js
// service-worker.js

// Load Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.1.2/workbox-sw.js');
workbox.setConfig({ debug: false });

// Load Expiration plugin (optional)
workbox.loadModule('workbox-expiration');

// Setup logging & versioning (used for debugging a particular service-worker version)
const version = '3508937123';
const log = (...args) => { console.log(`SW ${version} -`, ...args); };

// Pre-cache assets
workbox.precaching.precacheAndRoute([...]);

// Setup Network-First caching strategy
workbox.routing.registerRoute(
  // Match Navigation Routes
  new workbox.routing.NavigationRoute(
    new workbox.strategies.NetworkFirst({
      cacheName: 'pwa-start-url',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 1,
          maxAgeSeconds: YEAR_IN_SECONDS,
        }),
      ],
      matchOptions: {/* Optional, see note below */},
    }),
    // Limit cache to only PWA Start URL
    { allowlist: [/^\/start-url\/$/] },
  ),
);

// Cache Start URL during installation
self.addEventListener('install', (event) => event.waitUntil(() => {
  const startUrl = 'https://www.your-domain.com/start-url/';
  return caches.open('pwa-start-url')
      .then(cache => cache.add(startUrl))
      .then(() => {
        log('Pre-cached NetworkFirst Start url:', startUrl);
      })
      .catch((error) => {
        // If pre-caching fails, continue with installation & activation 
        // since it's a nice to have, not a hard requirement
        log('Failed to pre-cache NetworkFirst Start url:', startUrl, error);
      });
  }));
);
```

### matchOptions

In some cases, the pre-cached Start URL will still fail to match the requested Start URL when the PWA user is offline, and Chrome will give you a warning about the Start URL not being available offline.

In these scenarios, [CacheQueryOptions](https://w3c.github.io/ServiceWorker/#dictdef-cachequeryoptions) can be helpful. It's not particularly well documented, but you can pass flags to `matchOptions` that tell the service worker to use the pre-cached page even if...

- `ignoreSearch`: it has different query params (e.g. `?utm_medium=pwa`) than the requested page
- `ignoreMethod`: the method (e.g. GET/POST) differs between requests (probably irrelevant for PWA Start URLs)
- `ignoreVary`: the cached page has a `Vary` header

I had to use `ignoreVary` b/c we set `Vary` headers to differentiate between browsers for polyfilling purposes.

## Good luck!

If this technique works for you, or if I missed something, I'd love to hear about it in the comments.

