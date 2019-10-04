---
title: Working with Images
date: 2019-05-24 00:26:00 -04:00
description: Slides from 30-minute talk at JSAdmirers
---

A couple days ago I gave a polyglot talk at [JS Admirers](http://pdxjs.com/) about working with images in the browser.

A brief outline:

- **Blobs (aka binary files)**<br>
  What are they, how to store them, and how to render them in `<img>` tags using base64/object URLs.
- **Image performance**<br>
  Images aren't in the critical path, and are intentionally loaded late using HTTP/2 prioritization.
- **Serving the right image**<br>
  Use Webp and srcset+sizes. The `<picture>` tag is rarely needed.
- **Lazy loading**<br>
  Use IntersectionObserver or passive scroll listener. To preserve aspect ratio, use padding-bottom trick or inline SVG as src.
- **Critical image pre-rendering**<br>
  Demo of `<canvas>` blur technique.
- **Animated SVG cursors**<br>
  Most browsers support SVGs as cursors. You can even update the SVG to animate the cursor.

If any of that sounds interesting, [check out the slides](https://docs.google.com/presentation/d/1CfaHXlYyHDqcoHqyJVTWoBoE64y2EmLtjfU9OCnxhlg/edit?usp=sharing)!
