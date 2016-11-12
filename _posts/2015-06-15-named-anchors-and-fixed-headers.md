---
title: Named Anchors and Fixed Headers
date: 2015-06-15 13:32:00 Z
description: Using pseudoelements to compensate for fixed headers when jumping to
  anchor targets
---

One of the issues with fixed header navigation, especially when it’s fairly tall (e.g. goshen.edu) is that when you use named anchors to scroll you to a particular page section, the top of the relevant section is covered by the header.

The solution I’ve found is simply to use an `<a>` tag with a tall pseudo-element whose height matches the height of the header but doesn’t actually affect the layout of the page (negative margin prevents it from taking up vertical-space and zero width makes the bottom of the previous section clickable).

For example:

```css
.anchor-target:before {
  content:"";
  display:block;
  width: 0;
  height:$fixed-header-anchor-offset; /* fixed header height*/
  margin:-$fixed-header-anchor-offset 0 0; /* negative fixed header height */
}
```

If this `<a class=”anchor-target”`> tag is before the relevant section, the browser will jump to it, leaving the appropriate amount of buffer so that the sections begins right underneath the fixed header.

This is also an issue for Gravity Forms confirmation messages. Simply apply the same styles to .gform_anchor:before and make sure to enable the `<a class=”gform_anchor”>` by using the gform_confirmation_anchor filter:

```php
// enable confirmation anchor (scrolls to the right place for the confirmation message)
add_filter( 'gform_confirmation_anchor', '__return_true' );
```