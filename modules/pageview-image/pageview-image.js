/*
	This pageview module will be responsible for
	showing Images
*/
module.exports = {
	type: 'pageview',

	initialize: function(sails){

	},

	process: function (page, next) {
		next(null, page);
	},

	beforeValidation: function(page){

		return page;
	}
}