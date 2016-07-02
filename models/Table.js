/**
 * Table
 *
 * @module      :: Model
 * @description :: This model represents a table with scores in the database
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

var _ = require('lodash');

var Table = {

  identity: 'table',
  connection: 'default',

	types: {
		// Returns if the method exists (default), or works (function)
		oneOfMethods: function(val){
			var method = getMethodFor(val);
			return (method ? true : false);
		}
	},

	attributes: {
		name: {
			type: 'string',
			defaultsTo: '[Table Name]'
		},

		/*
			Scores data are inserted in another table, and linked with this
			with the tableId field.
			In order to compute the table data, it's needed to 'associate'
			this object with the found with 'Scores' model, and set on this object
			with key 'scores'.

			Ex:
			Scores.find({tableId: 'id'}).exec(function(collection){
				table.scores = collection;
			});

			var tableData = Scores.computeTable();
		*/

		/*
			Just to help views, disabling/enabling some actions
		*/
		locked: {
			type: 'string',
			in: ['yes', 'no'],
			defaultsTo: 'no',
		},


		/*
			Name for 'Rank' heading
		*/
		headerRank: {
			type: 'string',
			defaultsTo: 'Rank',
		},
		/*
			Name for 'Team' heading
		*/
		headerTeam: {
			type: 'string',
			defaultsTo: 'Team',
		},
		/*
			Prepended value for scores.
			in case this equals to 'Score', headers will be generated as follows:
				'Score 1', 'Score 2', 'Score 3'
		*/
		headerScore: {
			type: 'string',
			defaultsTo: 'Score',
		},
		/*
			Name for 'Final' score heading
		*/
		headerFinal: {
			type: 'string',
			defaultsTo: 'Final',
		},

		/*
			This field, represents 'how many' scores will a single
			Team in the row have.

			The minimum is one, since a table with no scores doesn't make sense
		*/
		columns: {
			type: 'int',
			defaultsTo: 1,
			min: 1,
			max: 20,
		},

		/*
			This affects how the 'Ranking' will be exposed.
			Wheater a 'lower' final score will be ranked better,
			or an 'higher' final score will be ranked better.
		*/
		sort: {
			type: 'string',
			in: ['asc', 'desc'],
			defaultsTo: 'desc',
		},


		/*
			EVALUATE METHODS LOGIC

			evaluateMethod is what actualy 'computes' the final score
			for each row (team) in the table. There are some 'default'
			function used to help. You can use nested default methods,
			or  you also can 'write' your JavaScript method for that.

			Available default methods:
			// Expects array, returns single value
			+ sum    - sum all scores
			+ max    - the maximum value within scores
			+ min    - the minimum value within scores
			+ avg    - the minimum value within scores

			// Expects single value, returns single value
			+ round:places?	- round a value. Default places is 1

			// Expects array, returns array
			remove:[worst|best]:N?	- Remove best/worst N scores. Default N is 1
			only:[n1][n2][..]		- Filter columns.

			If none of deafults matched, we will attempt to separate methods:
				This will sum worst 2 scores and round with 2 decimal places
					`sum:bot:2.round:2`, would execute:
						- Sum method with params ('bot', 2), and send result to:
						- Round with params (2);

				This would remove best score, and worst score, average and round
					`remove:best.remove:worst.avg.round`

			Anything else is threated as a literal function, with the following pattern:

			  	function(scores){
					// Literal method is inserted here
					// ...do calculation...
					// return final value
			  	}

			  	example:
			  	evaluateMethod =
			  	"var finalScore = 0;
				for(var k in scores){
					finalScore += scores[k]*1;
				}
				return finalScore;";

		*/
		evaluateMethod: {
			type: 'string',
			defaultsTo: 'sum',
			oneOfMethods: true // <- type of validation
		},

		/*
			This method will generate the table with all it's fields.

			return data will be on the following format:

			{
				headers: {'rank': 'Rank', 'team': 'Team', 'score.1': 'Score 1', 'final': 'Final'},
				data: [
					{'rank': 1, 'team':Team...'[,..] ],
					{'rank': 2, 'team':Team...'[,..] ],
					[...]
				],
			}

		*/
		calculate: generateTableDataInsideScores,
		headers: generateTableHeaders,

		toJSON: function(){
			var table = this.toObject();

			generateTableHeaders(table);
			return table;
		},

	},

	beforeUpdate: function(attrs, next){
		removeBadFields(attrs);
		next();
	},

	beforeCreate: function(attrs, next){
		removeBadFields(attrs);
		next();
	},

};

module.exports = Table;


/*
	Generate the table headers
*/
function generateTableHeaders(table){
	// Save to allow in function referencte
	table = table || this;
	var columns = table.columns*1;

	/*
		Create headers array
		Rank | Team | Score 1 | Score N | Final
	*/

	var headers = {};

	headers['rank'] = table.headerRank;
	headers['team'] = table.headerTeam;
	headers['scores'] = getScoreHeadersNames(table);

	// Add last header (Final score)
	headers['final'] = table.headerFinal;

	// Self assign headers and return
	table.headers = headers;
	return headers;
}

/*
	Returns an array of headers computed acordingly to the Table name

	Table can use two ways to indicate names:
		If table.headerScore contains `,`:
			It will be splited, and the rest will be filled with a number only
			ex: `Round 1, Round 2, Test 1, Extra` in a 5 columns table:
				Round 1 | Round 2 | Test 1 | Extra | 5

		If no `,` is contained in the headerScore
			It will be used to generate others headers like this:
			ex: `Round ` in a 4 columns table:
				Round 1 | Round 2 | Round 3 | Round 3 | Round 4
*/
function getScoreHeadersNames(table){
	var tableHeaders = [];
	var columns = table.columns*1;

	// Way one, array of strings
	if(table.headerScore.indexOf(',') >= 0){

		// Explode string
		tableHeaders = table.headerScore.split(',');

		// Remove extra columns
		for(var i = tableHeaders.length; i > columns ; i--)
			tableHeaders.pop();

		// Add missing fields automatically
		for(var i = tableHeaders.length; i < columns; i++)
			tableHeaders.push((i + 1) + '');

		// Trim values
		for(var k in tableHeaders)
			tableHeaders[k] = tableHeaders[k].trim();
	}else{

		// Generate headers
		var prepend = table.headerScore + ' ';
		for(var i = 0; i < columns; i++)
			tableHeaders.push(prepend + (i + 1));
	}

	return tableHeaders
}

/*
	Generates the table data inside scores objects
*/
function generateTableDataInsideScores(){
	// Save to allow in function referencte
	var table = this;
	var columns = table.columns*1;

	/*
		Create data table
	*/
	var scores = table.scores;

	// Just warn (DEBUG mode...)
	if(!scores)
		console.log('Table is empty!');

	// Get evaluation method ('min', 'max', custom...)
	var evalMethod = getMethodFor(table.evaluateMethod);

	// List of all the keys to sort
	var keysToSort = ['final'];

	// Go through all scores, creating a unique row
	_(scores).forEach(function(score){
		/*
			Notice score structure:

			{
				tableId: [this table id]
				teamId: xxx,
				scores: {
					  0: {value: xxx, data: {}},
					'1': {value: xxx, data: {}},
					  2: {value: xxx, data: {}}
					  [...],
				}
			}
		*/

		// This will be the object inserted in the table's data array
		// var scoreData = {};

		// Add simple attributes
		// scoreData['id'] = score.id || null;
		// scoreData['teamId'] = score.teamId || null;
		// scoreData['tableId'] = score.tableId || null;
		// scoreData['team'] = score.teamId || null;
		// scoreData.team: score.team.name
		// scoreData.country: score.team.country

		// Add scores data
		var scoreValues = [];
		for(var i = 0; i < columns; i++){

			// Get value and add to scoreValues
			var value = null;
			if(score.scores[i])
				value = score.scores[i].value;

			scoreValues.push(value);

			// Generate field key and saves
			// var field = 'score.'+(i+1);
			// score[field] = score.scores.value || null;
		}

		// Compute final score and adds to scoreData
		var finalScores = evalMethod(scoreValues) || 0;
		var showScore = finalScores;

		if(_.isArray(finalScores)){
			showScore = finalScores[0];

			for(var i = 1; i < finalScores.length; i++){
				var fieldKey = 'final'+(i+1); // Like: final2, final3, ...
				score[fieldKey] = finalScores[i];

				if(keysToSort.length <= i)
					keysToSort.push(fieldKey);
			}
		}

		score['final'] = showScore;

		// Add to table data
		// tableRows.push(score)
	});

	// Sort by 'final' field and reverse if needed
	var finalData = _.sortBy(scores, keysToSort);

	if(table.sort == 'desc')
		finalData = finalData.reverse();

	// Rank Table
	var pos = 0;
	var lastRow = null;

	_.forEach(finalData, function(row){
		pos++;

		var sameRanking = (lastRow ? true : false);
		for(var k in keysToSort){
			var key = keysToSort[k];
			if(lastRow && lastRow[key] != row[key]){
				sameRanking = false;
				break;
			}
		}

		if(sameRanking){
			// Keeps the same ranking if scores are the same
			return row.rank = lastRow.rank;
		}else{
			// Set rank as current position
			row.rank = pos;

		}
		// Save current row as last one
		lastRow = row;
	});

	// Self assign the table
	this.scores = finalData;

	// Return the table
	return this.scores;
}


/*
	Evaluate methods calculators (Defaults)

	All methods should return a function.
	Each method can accept params on it's creation.
	Every function returned, should have a single param named 'scores'
*/
// Save methods in this object
Table.evaluateMethods = {};

// Max method
Table.evaluateMethods.max = function(){
	return function(scores){
		return _.max(scores, function(val) {
			return val*1;
		});
	}

};

// Min method
Table.evaluateMethods.min = function(scores){
	return function(scores){
		return _.min(scores, function(val) {
			return val*1;
		});
	}
};

// Sum method
Table.evaluateMethods.sum = function(scores){
	return function(scores){
		return _.reduce(scores, function(sum, num) {
			return sum*1 + num*1;
		});
	}
};

// Average method
Table.evaluateMethods.avg = function(scores){
	return function(scores){
		if(scores.length <= 0) return 0;
		return _.reduce(scores, function(sum, num) {
			return sum + num*1;
		})/scores.length;
	}
};

/*
	Round method

	Input:  VALUE
	Output: VALUE
*/
Table.evaluateMethods.round = function(places){
	places = places*1 ? places*1 : 0;
	return function(score){
		return (score*1).toFixed(places);
	}
};

/*
	Remove worst and best scores
	Examples:
		remove:best:2
		remove:top:2
		remove:max
		remove:worst:3
		remove:bad:4

	Input:  ARRAY
	Output: ARRAY
*/
Table.evaluateMethods.remove = function(type, number){

	// Filter params
	var invert = false;
	if(type == 'best' || type == 'top' || type == 'max')
		invert = true;
	number = number ? parseFloat(number) : 1;

	return function(scores){
		var val = scores.sort(function(a, b){return a-b});
		if(invert) val = val.reverse();
		val = val.slice(number);
		return val;
	}
}

/*
	Filter array fields. Start is 1, not 0
	Examples:
		only:1:2:3:4
		only:1,2,3,4
		only:1

	Input:  ARRAY
	Output: ARRAY
*/
Table.evaluateMethods.only = function(){

	// Filter params
	if(arguments.length > 1)
		var rawIndexes = arguments;
	else
		var rawIndexes = (arguments[0] || '').split(',');

	// Convert to object
	var indexesToStay = {};
	for(var k in rawIndexes)
		indexesToStay[rawIndexes[k]*1-1] = true;

	return function(scores){
		return _.filter(scores, function (num, index) {
			return indexesToStay[index];
		});
	}
}

/*
	This is helpfull to send to views, allowing them to know
	defined methods.
*/
Table.evaluateMethodsNames = {
	// Methods that returns a single value
	'max': 'Maximum',
	'min': 'Minimum',
	'sum': 'Sum',
	'avg': 'Average',
	'round': 'Round',
};

/*
	Returns an function for the given method as string given.

	Read on top (EVALUATE METHODS LOGIC) to know more about what
	this is doing.
*/
function getMethodFor(methodRaw){

	// Split method in dots
	var methods = methodRaw.split('.');

	/*
		Try to parse as separate functions.
		We expect at least two methods separated by `.` (dots)

		If not, we will thread it right after, as a default function
		or a custom one
	*/
	if(methods.length > 1){

		// Default function to resolve methods
		function resolveMethod(wrapedMethod, methodRaw){

			// Get method string and `methodify` it recursivelly
			var method = getMethodFor(methodRaw);

			// Check if method is ok to continue, or, return null
			if(!method) throw Exception('Could not parse method: '+methodRaw);

			// Create a wrapped method of the current one, with this one
			return function(scores){
				return wrapedMethod(method(scores));
			}
		}

		// Go trough array, wraping methods
		var finalMethod = _.reduceRight(
			methods,
			// Called for every function
			resolveMethod,
			// Define initial method. Just returns value
			function(scores){
				return scores;
			}
		);

		// Return serie methods
		return finalMethod;
	}

	/*
		If only one method, resolves it like a simple function
	*/
	// Get methodName, and params
	var explodedMethod = methodRaw.split(':');
	var methodName = explodedMethod[0].trim();
	var methodParams = Array.prototype.slice.call(explodedMethod, 1);

	// Try to find in defaults
	if(Table.evaluateMethods[methodName])
		return Table.evaluateMethods[methodName].apply(null, methodParams);

	// Else, try to return a new function with it
	try{
		var method = Function('scores', methodRaw);
		method([]);
		return method;
	}catch(err){
		console.log('getMethodFor parsing error: '+err);
	}



	return null;
}

/*
	Method used to remove fields that are not supposed to
	be there, on create and update.
*/
function removeBadFields(attrs){
	var badList = ['scores', 'table', 'headers'];
	for(var k in badList){
		if(attrs[badList[k]])
			delete attrs[badList[k]];
	}
}


/*
	Tests
*/
// var testCase = {0: 100, 1: 213, '2':'5'};

// var methods = [
// 	'sum',
// 	'min',
// 	'max',
// 	"var finalScore = 0;"+
// 	"for(var k in scores){"+
// 		"finalScore += scores[k]*1;"+
// 	"}"+
// 	"return finalScore;"
// ];

// for(var m in methods)
// 	console.log(getMethodFor(methods[m])(testCase) + ' : '+ methods[m]);
// console.log(evaluateMethodGet('max')
