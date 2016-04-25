var express = require('express');

function config(app, next){
	var server = app.server;
  console.log('Configuring api routes');

	/*
	 * Create new App
	 */
	var api = app.api = express();

	/*
	 * Base route
	 */
	server.use('/api/', api);

	// Used to ping Server
	api.get('/ping', app.controllers.Api.ping);

	function restify(ctrl){
		var controller = app.controllers[ctrl];
		var path = '/'+ctrl.toLowerCase();

		if(app.config.env != 'production'){
			api.get(path+'/create', controller.create);
			api.get(path+'/:id/update', controller.update);
			api.get(path+'/:id/delete', controller.delete);
		}

		api.get(path, controller.find);
		api.post(path, controller.create);

		api.post(path+'/:id', controller.update);
		api.delete(path+'/:id', controller.delete);
		api.get(path+'/:id', controller.get);
	}

	/*
	 * REST
	 */
	restify('Pets');

	next();
}

module.exports = config;
