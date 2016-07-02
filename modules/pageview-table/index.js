/*
	This pageview module will be responsible for
	showing Table data.

	Process method will find the corresponding table
	data and fetch from it.
*/
module.exports = {
	type: 'pageview',

  getAssets: function (app){
    return {
      css: [
        `${__dirname}/public/css/pageview-table.css`,
      ],

      js: [
        `${__dirname}/public/js/pageview-table.js`,
      ],

      jst: [
        `${__dirname}/public/templates/pageview-table.configView.html`,
        `${__dirname}/public/templates/pageview-table.layout-1.html`,
        `${__dirname}/public/templates/pageview-table.layout-2.html`,
        `${__dirname}/public/templates/pageview-table.table.html`,
      ],
    }
  },

	initialize: function(sails){

	},

	process: function (page, next) {
		// page.data = {};
		// next(null, page);
		app.controllers.Table._findAssociated(page.options.tables || null, afterAssociate);

		function afterAssociate(data){
			page.data = data;
			next(null, page);
		}
	},

	beforeValidation: function(page){
		_.defaults(page.options, {
			tables: [],
			rows: '',
			still: '',
		});

		// Filter numbers
		page.options.rows *= 1;
		page.options.rows = (page.options.rows ? page.options.rows : '');
		page.options.still *= 1;
		page.options.still = (page.options.still ? page.options.still : '');

		return newPage;
	}
}
