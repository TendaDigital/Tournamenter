/*
	Default view module
*/
var _ = require('lodash');
var path = require('path');

module.exports = {
	type: 'view',

	initialize: function(sails){
		
	},

	render: function(req, res, next, locals){
		var viewPath = __dirname+'/index';

		var relViewPath = path.relative(path.resolve(__dirname+'/../../views'), viewPath);

		res.view(relViewPath, _.extend(locals, {
			_layoutFile: 'layout.ejs',
		}));
	},
}