---
title: How to Track Audio/Video File Loading Progress with Workbox
date: 2022-05-22 23:00:00 -08:00
description: Sharing the strategy used by my podcast app
tags: post
---

When working on my [Adblock Podcast side project](https://tally.so/r/3yPXL0), I had to figure out how to download and cache audio files using a service worker, and show the download progress in the UI. You'll run into the same problem for video and other large files that need to be downloaded for offline viewing.

Workbox is a fantastic library for this, and has [great documentation](https://developer.chrome.com/docs/workbox/using-plugins/#methods-for-custom-plugins) on how to write a plugin to hook into particular parts of the fetching & caching lifecycle. I'd also recommend their article on the nuances of [serving cached audio & video](https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video/).

Fortunately, there's an excellent Github repo ([AnthumChris/fetch-progress-indicators](https://github.com/AnthumChris/fetch-progress-indicators)) with a service worker example of tracking download progess using a `ReadableStream`, which we can adapt as a Workbox plugin.

First off, register a `CacheFirst` route that deals exclusively with the files you'd like to track (in my case, audio files).

```js
// service-worker.js
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { RangeRequestsPlugin } from 'workbox-range-requests';
import { TrackFileProgressPlugin } from './lib/track-file-progress-plugin'; // to-do

registerRoute(
  ({ request }) => {
    // Match all relevant audio files here...
    return request.url.startsWith('https://your-domain.com/audio/') 
      && /\.(mp3|m4a|wav)$/.test(request.url)
  },
  new CacheFirst({
    cacheName: 'audio-files',
    plugins: [
      // We must store full files in ServiceWorker cache, but this plugin allows
      // requests with range: header (e.g. from <audio> or <video> elements) to
      // be served only a portion of the cached file instead of the whole thing
      new RangeRequestsPlugin(), 
      // Our custom plugin!
      new TrackFileProgressPlugin(),
    ],
  })
);

// Pre-cache other files *after* defining the above
```

Then define a `TrackFileProgressPlugin` that tracks download progress as it saves the file. 

*Note: the following file is written in TypeScript. To convert it to plain JavaScript you can just paste it in on this website: [www.typescriptlang.org/play](https://www.typescriptlang.org/play)*

```ts
// track-file-progress-plugin.ts
import { WorkboxPlugin } from 'workbox-core';

export class TrackFileProgressPlugin implements WorkboxPlugin {
  broadcast: BroadcastChannel;

  constructor() {
    // Setup broadcast channel for communicating download progress
    this.broadcast = new BroadcastChannel('audio-downloads');
  }

  /**
   * Called before a Response is used to update a cache
   * @return {Response|null} - Return null to avoid caching
   */
  cacheWillUpdate: WorkboxPlugin['cacheWillUpdate'] = async ({
    response,
    request,
    state,
  }) => {
    if (!shouldCacheResponse(response)) return null;

    // Helper function for sending progress to client
    // Added to state object so cacheDidUpdate method can access it
    state.reportProgress = (progressPercent: number) => {
      this.broadcast.postMessage({
        type: 'DOWNLOAD_PROGRESS',
        url: request.url,
        progress: progressPercent,
      });
    }

    // Clone response b/c stream can only be used once (either for tracking download
    // or for saving to cache, not both)
    const clonedResponse = await response.clone();
    trackDownloadProgress(clonedResponse, state.reportProgress);

    // Convert response from 206 -> 200 to make it cacheable
    // ONLY do this if 206 response actually contains entire file
    return response.status === 200
      ? response
      : new Response(response.body, { status: 200, headers: response.headers });
  };

  /**
   * Called after Response is successfully saved to cache
   */
  cacheDidUpdate: WorkboxPlugin['cacheDidUpdate'] = async ({ state }) => {
    // Optional: guarantee that file is marked as fully downloaded in the event
    // that progress tracking fails
    if (state.reportProgress) state.reportProgress(1);
  };
}

// Helper function for tracking download progress
// Adapted from: https://github.com/AnthumChris/fetch-progress-indicators/blob/master/sw-basic/sw-simple.js#L41
function trackDownloadProgress(response: Response, reportProgress: Function) {
  // Start tracking
  reportProgress(0);

  let totalBytes: number;
  try {
    // Ensure that the browser supports ReadableStream and we know total file size
    if (!response.body) throw 'response.body missing';
    totalBytes = getFileSize(response);
  } catch (error) {
    console.error('Failed to track download progress', error);
    return;
  }

  let loadedBytes = 0;
  const reader = response.body.getReader();

  new ReadableStream({
    async start(controller) {
      read();

      function read() {
        reader
          .read()
          .then(({ done, value }: { done: boolean; value: Uint8Array }) => {
            if (done) {
              controller.close();
              return;
            }

            controller.enqueue(value);
            loadedBytes += value.byteLength;
            reportProgress(loaded / totalBytes);
            read();
          })
          .catch((error: any) => {
            // Error only typically occurs if network fails mid-download
            console.error('error in read()', error);
            controller.error(error);
          });
      }
    },

    // Firefox excutes this on page stop, Chrome does not
    cancel(reason) {
      console.log('cancel()', reason);
    },
  });
}

/**
 * Get total file size in bytes
 */
function getFileSize(response: Response) {
  // If content is encoded, then content-length will not be accurate
  if (response.headers.get('content-encoding')) throw 'content-encoding header';
  
  // We use content-length header to get total file size
  const contentLength = response.headers.get('content-length');
  if (contentLength === null) throw 'content-length missing';

  return parseInt(contentLength);
}

/**
 * Only cache file if the full file is provided. Don't cache
 * partial 206 responses  
 */
function shouldCacheResponse(response: Response) {
  if (response.status === 200) return true;

  if (response.status === 206) {
    try {
      // Did 206 response include entire file?
      const contentLength = getFileSize(response);
      return (
        `bytes 0-${contentLength - 1}/${contentLength}` ===
        response.headers.get('content-range')
      );
    } catch (err) {}
  }

  return false;
}
```

The only remaining item is to setup and listen to the broadcast channel on your page:

```js
// app.js
const broadcast = new BroadcastChannel('audio-downloads');
broadcast.onmessage = (event) => {
  if (event.data && event.data.type === 'DOWNLOAD_PROGRESS') {
    const { url, progress } = event.data;
    // Handle progress...
  }
};

```

`BroadcastChannel` is a super simple API, but is [only supported by Safari 15.4+](https://caniuse.com/broadcastchannel), so you may want to use a different way of communicating with the client to support older browsers. There's actually [quite a few options](https://felixgerschau.com/how-to-communicate-with-service-workers/). 

Also, if you're explicitly downloading files with `fetch()` requests instead of `<audio>` or `<video>` elements, then you can omit the `RangeRequestsPlugin` and my [conditions for 206 responses](https://github.com/GoogleChrome/workbox/issues/1644#issuecomment-1126871851).

And if you run into any snags or have suggestions for improvement, don't hesitate to leave a comment! I simplied some of this code for this post, so apologies in advance if there are any typos.