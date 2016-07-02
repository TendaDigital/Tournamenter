/*
	Default pageview module
*/
module.exports = {
	type: 'pageview',

  getAssets: function (app){
    return {
      js: [
        `${__dirname}/public/js/pageview.js`,
      ],

      jst: [
        `${__dirname}/public/templates/pageview.barView.html`,
        `${__dirname}/public/templates/pageview.itemView.html`,
        `${__dirname}/public/templates/pageview.view.html`,
      ],
    }
  },

	initialize: function(app){
	},

	process: function (page, next) {
		// Inject test attrib
		page.test = page.still*10;

		next(null, page);
	}
}
