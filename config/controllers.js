'use strict';
var TAG = _TAG('config.controllers');

var path = require('path');

function config(app, next){
	var controllersDirectory = path.join(__dirname, '/../controllers');

  // Load All controllers
  app.controllers = {};
	app.helpers.loader.load(controllersDirectory, app.controllers);

  // Debug loaded controllers
	console.log(TAG, 'Controllers:', chalk.yellow(_.keys(app.controllers).join(',')));

	next();
}

module.exports = config;
