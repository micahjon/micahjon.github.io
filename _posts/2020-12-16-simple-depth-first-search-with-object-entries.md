---
title: Simple Depth-First Search with Object.entries()
date: 2020-12-16 21:30:00 -08:00
description: A tiny function for traversing JSON data
tags: post
---

Sometimes at work I need to find a particular type of object in a large JSON file whose hierarchy is bound to change over time.

For instance, imagine we're trying to grab all image URLs in a JSON response from our headless CMS, so we can upload them to an S3 bucket. Image objects could be top level (e.g. for SEO metadata) or deeply nested in a content hierarchy. Regardless, there are probably a couple properties that all image objects share, e.g.

```js
function isImageObject(value) {
  return value 
    && value.url 
    && (value.dimensions || value.kind === 'image');
}
```

It turns out this is really easy to do using a "depth-first search" algorithm, which traverses a graph (the JSON file) and calls a function on each key-value pair using `Object.entries`. The wonderful thing is `Object.entries` will even work on arrays, where the "keys" are just indices.

```js
/**
 * Traverse an object, calling filter on each key/value
 * pair to know whether to continue
 * @param  {object} obj
 * @param  {function} filter
 */
function traverse(obj, filter) {
    if (typeof obj !== 'object' || obj === null) return;

    Object.entries(obj).forEach(([key, value]) => {
        // Key is either an array index or object key
        if (filter(key, value)) traverse(value, filter);
    });
};
```

Essentially you call this function on the top level object (JSON file) and then just return a truthy value to continue traversing down the tree. Once you've found your object, you can return falsy to avoid going any deeper. Here's an example:

```js
// Find all image URLs in the JSON file
const imageUrls = [];

traverse(jsonObject, (key, value) => {
  if (isImageObject(value)) {
    // Found an image, 
    imageUrls.push(value.url);
    // No need to go any deeper (b/c we don't have nested images)
    return false; 
  }
  // Keep looking for image
  return true; 
})
```

*Thanks to David Housman's Algorithmic Graph Theory course at [Goshen College](https://www.goshen.edu/academics/computer-science/). Without it I wouldn't have thought to try to approach the problem this way.*
 
