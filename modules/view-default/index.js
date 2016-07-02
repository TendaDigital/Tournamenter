/*
	Default view module
*/
var _ = require('lodash');
var path = require('path');

module.exports = {
	type: 'view',

  getAssets: function (app){
    return {
      css: [
        `${__dirname}/public/css/page-transitions.css`,
        `${__dirname}/public/css/view-default.css`,
      ],

      js: [
        `${__dirname}/public/js/page-indicator.js`,
        `${__dirname}/public/js/page-transitions.js`,
      ],

      jst: [],

      serve: [
        `${__dirname}/public`,
      ]
    }
  },

	initialize: function(sails){

	},

	render: function(req, res, next, locals){
		var viewPath = __dirname+'/index';

		var relViewPath = path.relative(path.resolve(__dirname+'/../../views'), viewPath);

		res.render(relViewPath, _.extend(locals, {
			layout: path.join(__dirname, 'layout.ejs'),
		}));
	},
}
