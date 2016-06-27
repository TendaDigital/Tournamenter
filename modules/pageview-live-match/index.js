/*
	This pageview module will be responsible for
	showing Live Match data.

	Process method will find the corresponding group
	data and fetch from it.
*/
module.exports = {
	type: 'pageview',

	initialize: function(sails){

	},

	process: function (match, next) {

		// Match data inside match key, can be either:
		if(_.isObject(match.options.match)){
			// OBJECT: We are dealing with a custom Game.
			match.data = match.options.match;
			next(null, match);
		}else{
			// INT/STRING: We are dealing with a match on the database
			sails.controllers.match._findAssociated(match.options.match || null, afterAssociate);
			// console.log('&&', match);
			// sails.controllers.match._findAssociated(20, afterAssociate);

			function afterAssociate(err, data){
				match.data = data;
				next(null, match);
			}
		}

	},

	beforeValidation: function(page){
		_.defaults(page.options, {
			match: null,
		});

		return page;
	}
}