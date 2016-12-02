---
title: Solving the Anchor Link :target behind Fixed Header Bug with JavaScript
date: 2016-12-02 17:12:00 -05:00
description: A lightweight JS fix for a common UI bug
---

Fixed headers that stick to the top of the screen and scroll with you down the page are a staple on many websites. This can be problematic when you have "anchor" links to content further up or down the page. When the browser jumps to a new "target" content, it will stick the top of the content right up against the top of the screen, which means your fixed header now covers up the top of the content you wanted to see!

There are a [wide range of CSS tricks, meticulously documented by Nicolas Gallagher](http://nicolasgallagher.com/jump-links-and-viewport-positioning/) that can be used to prevent this bug, generally by adding additional spacing above the target with a pseudoelement or padding. 

His pure CSS approach comes highly recommended. However, I do run into cases where my "anchor targets" (content that is linked to with a hash, e.g. #contact) have unpredicatable (or simply complex) CSS: pseudoelements, top padding, etc. Thus, I've written an extremely lightweight Javascript workaround for this issue. It listens for the *hashchange* event and scrolls the user up just enough to compensate for the fixed header if necessary.

```javascript
/**
 * Issue: When users click on an anchor link that scrolls them up/down the page,
 * the top of the section/heading they're going to is covered by a fixed header.
 *
 * This can be fixed on a case-by-case basis in CSS, but there are many gotchas!
 * In particular, if you add a pseudoelement offset above the anchor target, it might
 * make the text above the target unselectable (b/c it covers the text up)
 *
 * This JS solution simply scrolls the user up right after they click on the anchor,
 * just enough to compensate for the fixed header. It also compensates for the initial
 * page load of a url with an anchor already in it (listen for first scroll).
 */
!function (window) 
{
	'use strict';

	// Update this function so it returns the with the height of your fixed headers
	function fixedHeaderOffset( screenWidth ) 
	{
		if ( screenWidth < 525 ) {
			return 120;
		}
		else if ( screenWidth < 1024 ) {
			return 88;
		}
		else {
			return 40;	
		}
	}

	// Run on first scroll (in case the user loaded a page with a hash in the url)
	window.addEventListener('scroll', onScroll);
	function onScroll()
	{
		window.removeEventListener('scroll', onScroll);
		scrollUpToCompensateForFixedHeader();
	}

	// Run on hash change (user clicked on anchor link)
	if ( 'onhashchange' in window ) {
		window.addEventListener('hashchange', scrollUpToCompensateForFixedHeader);
	}

	function scrollUpToCompensateForFixedHeader()
	{
		var width = window.innerWidth,
			hash, 
			target, 
			offset;

		// Get hash, e.g. #mathematics
		hash = window.location.hash;
		if ( hash.length < 2 ) { return; }

		// Get :target, e.g. <h2 id="mathematics">...</h2>
		target = document.getElementById( hash.slice(1) );
		if ( target === null ) { return; }

		// Get distance of :target from top of viewport. If it's near zero, we assume
		// that the user was just scrolled to the :target.
		if ( target.getBoundingClientRect().top < 2 ) {
			window.scrollBy(0, -fixedHeaderOffset());
		}
	}

}(window);
````

It's currently being used on [goshen.edu](https://www.goshen.edu) and I'm very much open to bug reports and suggestions!