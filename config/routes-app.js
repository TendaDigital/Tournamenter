var TAG = _TAG('config.routes-app');

var express = require('express');

function config(app, next){
  console.log(TAG, 'Configuring app routes');

  var server = app.server;

	/*
	 * Base route
	 */
	function restify(ctrl, path = ctrl){
		var controller = app.controllers[ctrl];
		path = '/' + path.toLowerCase();

    // * GET      /boat/:id?      -> BoatController.find
    // * POST     /boat           -> BoatController.create
    // * PUT      /boat/:id       -> BoatController.update
    // * DELETE   /boat/:id       -> BoatController.destroy

    // Shortcuts
    console.log(TAG, `restify ${ctrl} [as ${path}]`)
		server.get(path+'/create', controller.create);
		server.post(path+'/create', controller.create);
		server.get(path+'/update/:id', controller.update);
		server.get(path+'/destroy/:id', controller.destroy);

    // REST
		server.get(path+'/:id?', controller.associated || controller.find);
		server.post(path, controller.create);
		server.put(path+'/:id', controller.update);
		server.delete(path+'/:id', controller.destroy);
	}

  server.get('/', app.controllers.Team.manage);
  server.get('/teams/teamlist', app.controllers.Team.teamlist);

  server.get('/',                  app.controllers.Team.manage);
  server.get('/login',             app.controllers.User.login);
  server.get('/logout',            app.controllers.User.logout);

  server.get('/teams/manage',      app.controllers.Team.manage);
  server.post('/teams/post',       app.controllers.Team.post);
  server.patch('/teams/:id',       app.controllers.Team.update);
  restify('Team', 'teams');

  server.get('/groups/manage',     app.controllers.Group.manage);
  server.get('/groups/find/:id?',  app.controllers.Group.associated);
  server.post('/groups/post',      app.controllers.Group.post);
  server.patch('/groups/:id',      app.controllers.Group.update);
  restify('Group', 'groups');

  server.get('/matches',           app.controllers.Match.find);
  server.post('/matches/post',     app.controllers.Match.post);
  server.patch('/matches/:id',     app.controllers.Match.update);
  restify('Match', 'matches');

  server.get('/tables/manage/:id?',app.controllers.Table.manage);
  server.get('/tables/find/:id?',  app.controllers.Table.associated);
  server.patch('/tables/:id',      app.controllers.Table.update);
  restify('Table', 'tables');

  server.get('/scores/:id/:number',app.controllers.Scores.updateScore);
  server.patch('/scores/:id',      app.controllers.Scores.update);
  restify('Scores', 'scores');

  server.get('/views/manage/:id?', app.controllers.View.manage);
  server.get('/views/view/:id?',   app.controllers.View.view);
  server.get('/views/find/:id?',   app.controllers.View.associated);
  server.get('/views/:id',         app.controllers.View.associated);
  server.patch('/views/:id',       app.controllers.View.update);
  restify('View', 'views');

	next();
}

module.exports = config;
