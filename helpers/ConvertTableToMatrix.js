module.exports = function (table) {
  if (!table)
    return null;

  var scores = table.scores
  var headers = table.headers
  var scoreColumns = parseInt(table.columns)
  var headerColumns = 3 // RANK, NAME and FINAL

  // Generate rows
  var rows = []

  // Push Header
  var header = _.flatten([headers.rank, headers.team, headers.scores, headers.final])
  console.log(header)
  rows.push(header)

  // Push data
  scores.forEach(function (line) {
    var row = [line.rank, line.team ? line.team.name : '?']
    
    // Add scores (Makes sure the size is fixed)
    _.times(scoreColumns, function (n) {
      row.push(n in line.scores ? line.scores[n].value : '-')
    })

    // Add final score
    row.push(line.final)

    // Add to rows
    rows.push(row)
  })

  return rows
}