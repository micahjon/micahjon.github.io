!(function () {
  'use strict'

  // Increase width of images on large screens
  var images = document.querySelectorAll('.post__body p > img')
  for (var i = 0; i < images.length; i++) {
    // Only apply to wide images
    if (images[i].clientWidth >= 518) {
      var wrap = images[i].parentNode
      if (wrap.nodeName === 'P') {
        wrap.classList.add('post__wide-image')
      }
    }
  }

  // Don't cut off long lines of code
  var codes = document.querySelectorAll('.post__body pre[class^="language-"]')
  for (var i = 0; i < codes.length; i++) {
    var maxLineLength = codes[i].innerHTML
      .split('<br>')
      .map((line) =>
        line
          .replace(/<[^>]+>/g, '') // Remove invisible HTML tags
          .replace(/&[a-z0-9]{2,4};/g, '$') // Replace HTML entities w/ a single character
          .trim()
      )
      .filter(Boolean)
      .reduce((maxLength, line) => Math.max(maxLength, line.length), 0)
    if (maxLineLength > 62) {
      codes[i].classList.add('post__wide-pre')
    }
  }
})()
