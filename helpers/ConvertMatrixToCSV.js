const toCsv = require('csv-stringify')

module.exports = function (matrix, metadata, next) {
  metadata = metadata || {}

  // Copy array
  matrix = matrix.slice()

  // Add Metadata
  matrix.push([''])
  matrix.push(['--'])
  for (var key in metadata) {
    matrix.push([`${key}:`, metadata[key]])
  }
  
  // Generate CSV
  toCsv(matrix, next)
}