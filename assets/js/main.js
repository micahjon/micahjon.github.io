!(function () {
  'use strict'

  // Increase width of images on large screens
  Array.from(document.querySelectorAll('.post__body p > img')).forEach(
    (image) => {
      if (image.naturalWidth) {
        testImage(image)
      } else {
        image.onload = () => testImage(image)
      }
    }
  )

  function testImage(image) {
    if (image.naturalWidth >= 760) {
      image.parentNode.classList.add('post__wide-image')
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
