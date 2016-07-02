/*
	Creates Bracket style views
*/
module.exports = {
	type: 'pageview',

  getAssets: function (app){
    return {
      css: [
        `${__dirname}/public/css/jquery.bracket.min.css`,
        `${__dirname}/public/css/pageview-bracket.css`,
      ],

      js: [
        `${__dirname}/public/js/jquery.bracket.min.js`,
        `${__dirname}/public/js/pageview-bracket.js`,
      ],

      jst: [
        `${__dirname}/public/templates/pageview-bracket.configView.html`,
        `${__dirname}/public/templates/pageview-bracket.layout.html`,
      ],
    }
  },

	initialize: function(app){

	},

	process: function (bracket, next) {
		next(null, bracket);
	},

	beforeValidation: function(page){
		return page;
	}
}
