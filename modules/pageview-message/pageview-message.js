/*
	This pageview module will be responsible
	for showing Messages
*/
module.exports = {
	type: 'pageview',

  getAssets: function (app){
    return {
      css: [
        `${__dirname}/public/css/bootstrap-markdown.min.css`,
      ],

      js: [
        `${__dirname}/public/js/bootstrap-markdown.js`,
        `${__dirname}/public/js/marked.js`,
        `${__dirname}/public/js/pageview-message.js`,
      ],

      jst: [
        `${__dirname}/public/templates/pageview-message.configView.html`,
        `${__dirname}/public/templates/pageview-message.view.html`,
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
