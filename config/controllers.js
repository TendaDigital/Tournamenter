var TAG = 'config.controllers';
var fs = require('fs');
var path = require('path');

function config(app, next){
	app.controllers = {};

	var controllersDirectory = __dirname + '/..' + '/controllers/';

	fs.readdirSync(controllersDirectory).forEach(function (file) {
		if (file.indexOf('.js') < 0)
			return;

		var controller = require(controllersDirectory + file);
		var name = path.basename(file, '.js');

		app.controllers[name] = controller;
	});

	app.debug(TAG, 'Installed Controllers:', _.keys(app.controllers).join(','));

	next();
}

module.exports = config;