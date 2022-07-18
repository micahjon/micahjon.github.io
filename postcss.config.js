// postcss.config.js
const postcssImport = require('postcss-import')
const postcssSass = require('@csstools/postcss-sass')

module.exports = {
  parser: 'postcss-comment',
  plugins: [postcssImport(), postcssSass()],
}
