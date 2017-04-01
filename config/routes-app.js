var TAG = _TAG('config.routes-app');

var express = require('express');

function config(app, next){
  console.log(TAG, 'Configuring app routes');

  const server = app.server;
  const ctrls = app.controllers;
  const auth = app.helpers.isAuthenticated;

	/*
	 * Base route
	 */
	function restify(ctrl, path = ctrl){
		var Ctrl = app.controllers[ctrl];
		path = '/' + path.toLowerCase();

    // * GET      /boat/:id?      -> BoatController.find
    // * POST     /boat           -> BoatController.create
    // * PUT      /boat/:id       -> BoatController.update
    // * DELETE   /boat/:id       -> BoatController.destroy

    // Shortcuts
    console.log(TAG, `restify ${ctrl} [as ${path}]`)
		server.get(path+'/create',            auth, Ctrl.create);
		server.post(path+'/create',           auth, Ctrl.create);
		server.get(path+'/update/:id',        auth, Ctrl.update);
		server.get(path+'/destroy/:id',       auth, Ctrl.destroy);

    // REST
		server.get(path+'/:id?',              auth, Ctrl.associated || Ctrl.find);
		server.post(path,                     auth, Ctrl.create);
  	server.put(path+'/:id',               auth, Ctrl.update);
		server.delete(path+'/:id',            auth, Ctrl.destroy);
	}

  server.get('/teams/teamlist',                 ctrls.Team.teamlist);

  server.get('/login',                          ctrls.User.login);
  server.post('/login',                         ctrls.User.login);
  server.get('/logout',                         ctrls.User.logout);

  server.get('/teams/manage',             auth, ctrls.Team.manage);
  server.get('/teams/find',               auth, ctrls.Team.teamlist);
  server.post('/teams/post',              auth, ctrls.Team.post);
  server.patch('/teams/:id',              auth, ctrls.Team.update);
  restify('Team', 'teams');

  server.get('/groups/manage',            auth, ctrls.Group.manage);
  server.get('/groups/find/:id?',         auth, ctrls.Group.associated);
  server.post('/groups/post',             auth, ctrls.Group.post);
  server.patch('/groups/:id',             auth, ctrls.Group.update);
  restify('Group', 'groups');

  server.get('/matches',                  auth, ctrls.Match.find);
  server.post('/matches/post',            auth, ctrls.Match.post);
  server.patch('/matches/:id',            auth, ctrls.Match.update);
  restify('Match', 'matches');

  server.get('/tables/manage/:id?',       auth, ctrls.Table.manage);
  server.get('/tables/find/:id?',         auth, ctrls.Table.associated);
  server.get('/tables/:id.csv',           auth, ctrls.Table.csv);
  server.patch('/tables/:id',             auth, ctrls.Table.update);
  restify('Table', 'tables');

  server.get('/scores/:id/:number',       auth, ctrls.Scores.updateScore);
  server.patch('/scores/:id',             auth, ctrls.Scores.update);
  restify('Scores', 'scores');

  server.get('/views/manage/:id?',        auth, ctrls.View.manage);
  server.get('/views/view/:id?',                ctrls.View.view);
  server.get('/views/find/:id?',                ctrls.View.associated);
  server.get('/views/:id',                      ctrls.View.associated);
  server.patch('/views/:id',              auth, ctrls.View.update);
  restify('View', 'views');

  restify('Config', 'configs');

	next();
}

module.exports = config;
