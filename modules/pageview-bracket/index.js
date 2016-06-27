/*
	Creates Bracket style views
*/
module.exports = {
	type: 'pageview',

	initialize: function(sails){

	},

	process: function (bracket, next) {
		next(null, bracket);
	},

	beforeValidation: function(page){
		return page;
	}
}