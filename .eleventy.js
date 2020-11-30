const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')

module.exports = function (eleventyConfig) {
  // Enable syntax highlighting
  eleventyConfig.addPlugin(syntaxHighlight)

  // Copy `assets/` to `_site/assets`
  eleventyConfig.addPassthroughCopy('assets/fonts')
  eleventyConfig.addPassthroughCopy('assets/images')
  eleventyConfig.addPassthroughCopy('assets/js')

  // Copy compiled CSS to _site/assets/css
  eleventyConfig.addWatchTarget('./_tmp/style.css')
  eleventyConfig.addPassthroughCopy({
    './_tmp/style.css': './assets/css/style.css',
  })

  // Copy Prism syntax highlighting theme
  eleventyConfig.addPassthroughCopy({
    './assets/css/prism-material-oceanic.css':
      './assets/css/prism-material-oceanic.css',
  })

  // Add Nunjucks filter for getting unix timestamp
  eleventyConfig.addNunjucksFilter('toDateString', function (date, context) {
    const isThisYear = date.getFullYear() === new Date().getFullYear()

    if (context === 'post-page') {
      // March 23, 2020
      return (dateString = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(date))
    }

    // Display past year, but not current year
    const options = {
      month: 'short',
      day: 'numeric',
      year: isThisYear ? undefined : 'numeric',
    }

    return new Intl.DateTimeFormat('en-US', options)
      .format(date)
      .replace(/20(\d{2})/, '‘$1')
  })

  // Add Nunjucks filter for removing widowed word
  eleventyConfig.addNunjucksFilter('removeWidows', function (text) {
    const words = text.split(' ')
    const lastTwoWords = words.slice(-2)
    if (!lastTwoWords.every((w) => typeof w === 'string')) return text

    if (
      lastTwoWords.every((w) => w.length < 8) ||
      (lastTwoWords[0].length < 12 && lastTwoWords[1].length < 8)
    ) {
      return words
        .reduce((acc, word, index) => {
          return acc + (index === words.length - 1 ? ' ' : ' ') + word
        }, '')
        .trim()
    }

    return text
  })

  return {
    dir: {
      layouts: '_layouts',
    },
  }
}
