---
title: A More Reliable FileReader
date: 2021-01-28 20:58:00 -08:00
description: Promise-based FileReader wrapper + timeout period
tags: post
---

[`FileReader`](https://developer.mozilla.org/en-US/docs/Web/API/FileReader) is not a web API you bump into on most websites, but at [BeFunky](https://www.befunky.com/) we use it all the time for transforming image files (aka "Blobs") from our users.

- `FileReader.readAsArrayBuffer()` is the fastest way to know if a `Blob` can be read at all.

- `FileReader.readAsDataURL()` converts a `Blob` to a `base64` string that can be used as an `<img>` src. 

- `FileReader.readAsText()` is great for reading text-based files (e.g. JSON) that a user drags into your website.

The problem is that `FileReader` has an old event-driven API that relies on `load` and `error` events, so it's a bit icky to work with. Fortunately, it's trivial to wrap in a Promise.

```js
const result = new Promise((resolve, reject) => {
  const fileReader = new FileReader();
  fileReader.onload = () => {
    resolve(fileReader.result);
  };
  fileReader.onerror = (error) => {
    fileReader.abort();
    reject(error);
  };
  fileReader.readAsDataURL(yourFile);
});
result.then(...)
```

Given that reading a file can fail unexpectedly, we've encountered situations where neither `onload` or `onerror` are called. To avoid leaving users in infinite loading states, we've introduced a timeout period (varies by task) to ensure that our app remains responsive no matter what.

```js
setTimeout(() => {
  reject(new Error('FileReader timed out after 15s');
}), 15000);
```

*When FileReader calls `onload`/`onerror` after our timeout period is up, we log the result and duration in Sentry we can adjust it over time.*

---

I went ahead and wrote a [tiny 1kb library](https://github.com/micahjon/reliable-filereader) for this on Github. 

```js
import reliableFileReader from 'reliable-filereader';

reliableFileReader('readAsDataURL', blob)
    .then((base64String) => {
        // Do something with base64 string
    })
    .catch((error) => {
        if (/timed out/.test(error)) {
            // FileReader has not responded within 15 seconds
        } else {
            // FileReader fired an error event.
            const errorEvent = error;
        }
    });
```

In addition to wrapping FileReader in a Promise and allowing you to set the timeout period...

1. It notifies you of the result/error if your timeout period was too short.

2. You can customize the timer function. One use case would be [pausing the timer if the user changes tabs](https://github.com/micahjon/while-tab-visible-setTimeout), which may also slow down FileReader. Full disclosure: I haven't tried this code in production yet, but I'm looking forward to sometime this spring!

If you use [reliable-filereader](https://github.com/micahjon/reliable-filereader) or have other suggestions, let me know! 