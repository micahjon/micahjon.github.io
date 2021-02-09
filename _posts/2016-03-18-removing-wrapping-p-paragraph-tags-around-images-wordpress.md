---
title:
  "One Regex to Rule them all: Removing wrapping <p> tags around images
  in WordPress while preserving links"
date: 2016-03-18 17:40:00 -04:00
description: A Wordpress the_content filter that makes styling linked-images sane
redirect_from: '/removing-wrapping-p-tags-around-images-in-wordpress/'
tags: post
---

Wordpress has the unfortunate tendency of wrapping nearly everything in `<p>` tags. While this is often helpful for blocks of text in a post, it limits our ability to succinctly and consistently style images regardless of their containing `<a>` tag, `<p>` tag, or both. In other words, you rarely want `<a>` tag styles (e.g. border-bottom & :hover) or `<p>` styles (e.g. margin-bottom & max-width) to affect the styling of their child images.

The cleanest solution I've found is to write a Regular Expression that filters post*content and removes wrapping `<p>` tags around `<img>`'s while preserving surrounding text and it's styling (e.g. **bold**, \_italic*).  For instance, in the Wordpress editor I'll add some bold text, a right-aligned image, and then some more text:

### Visual editor:

![visual](/assets/images/visual.png)

### Text editor:

![Screenshot from 2016-03-20 13-41-50](/assets/images/Screenshot-from-2016-03-20-13-41-50.png)

### On the page:

![Screenshot from 2016-03-20 13-43-36](/assets/images/Screenshot-from-2016-03-20-13-43-36.png)
![Screenshot from 2016-03-20 13-47-04](/assets/images/Screenshot-from-2016-03-20-13-47-04.png)

_You'll notice the above example is contrived: I manually added a nasty 400px max-width to the paragraph in Chrome Dev Tools. The point is that the image, even though it's right-aligned, it subject to the constraints of it's containing paragraph._

The goal now is to take the image and move it outside of the wrapping paragraph. We also need to preserve any wrapping link around the image and move it outside as well. Here's the current code:

<script src="https://gist.github.com/micahjon/e47aff47bfa093091563.js"></script>

---

I've iterated on this regex quite a few times, but would appreciate your feedback and improvements. In terms of performance, it's clocking in around .5ms for most posts.
