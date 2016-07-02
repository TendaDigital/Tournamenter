/*
	This pageview module will be responsible for
	showing Images
*/
module.exports = {
	type: 'pageview',

  getAssets: function (app){
    return {
      css: [],

      js: [
        `${__dirname}/public/js/pageview-image.js`,
      ],

      jst: [
        `${__dirname}/public/templates/pageview-image.configView.html`,
      ],
    }
  },

	initialize: function(sails){

	},

	process: function (page, next) {
		next(null, page);
	},

	beforeValidation: function(page){

		return page;
	}
}
