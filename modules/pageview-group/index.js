/*
	This pageview module will be responsible for
	showing Group data.

	Process method will find the corresponding group
	data and fetch from it.
*/
module.exports = {
	type: 'pageview',

	initialize: function(sails){

	},

	process: function (group, next) {
		sails.controllers.group._findAssociated(group.options.tables || null, afterAssociate);

		function afterAssociate(data){
			group.data = data;
			next(null, group);
		}
	},

	beforeValidation: function(page){
		_.defaults(page.options, {
			group: null,
			rows: null,
			still: null,
		});

		// Filter numbers
		page.options.rows *= 1;
		page.options.rows = (page.options.rows ? page.options.rows : null);
		page.options.still *= 1;
		page.options.still = (page.options.still ? page.options.still : null);

		return newPage;
	}
}