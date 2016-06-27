/*
	Simple Module
*/
module.exports = {
	type: 'pageview',

	initialize: function(sails){
		// Public js files to inject in templates
		// exports.jsFilesToInclude = ['client.js'];
	},

	process: function (page, next) {
		// Inject test attrib
		page.test = page.still*10;

		next(null, page);
	}
}