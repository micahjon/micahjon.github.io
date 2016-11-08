!function()
{
	'use strict';

	// Add img-wrap class to <p>'s that contain squished images
	// so they can be larger
	var images = document.querySelectorAll('#post-body p > img');
	for (var i = 0; i < images.length; i++) {
		// Only apply to wide images
		if ( images[i].clientWidth >= 518 ) {
			var wrap = images[i].parentNode;
			if ( wrap.nodeName === 'P' ) {
				wrap.classList += ' img-wrap';
			}
		}
	}

	// Add class containing type of code to <code> so that
	// highlight.js doesn't have to guess (it guesses wrong on bash)
	var codes = document.querySelectorAll('.highlighter-rouge > .highlight > code');
	for (var i = 0; i < codes.length; i++) {
		var divClass = codes[i].parentElement.parentElement.className;
		try {
			var codeType = divClass.split('language-')[1].split(' ')[0]
			codes[i].className += ' ' + codeType;
		}
		catch (e) {
			continue;
		}
	}

}();