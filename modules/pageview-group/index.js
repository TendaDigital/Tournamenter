/*
	This pageview module will be responsible for
	showing Group data.

	Process method will find the corresponding group
	data and fetch from it.
*/
module.exports = {
	type: 'pageview',

  getAssets: function (app){
    return {
      css: [
        `${__dirname}/public/css/pageview-group.css`,
      ],

      js: [
        `${__dirname}/public/js/pageview-group.js`,
      ],

      jst: [
        `${__dirname}/public/templates/pageview-group.configView.html`,
        `${__dirname}/public/templates/pageview-group.layout.html`,
        `${__dirname}/public/templates/pageview-group.match.ended.html`,
        `${__dirname}/public/templates/pageview-group.match.playing.html`,
        `${__dirname}/public/templates/pageview-group.match.scheduled.html`,
      ],
    }
  },

	initialize: function(sails){

	},

	process: function (group, next) {
		app.controllers.Group._findAssociated(group.options.tables || null, afterAssociate);

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
