module.exports = {

  find: app.helpers.Restify(app.models.Team, 'find'),
  create: app.helpers.Restify(app.models.Team, 'create'),
  update: app.helpers.Restify(app.models.Team, 'update'),
  destroy: app.helpers.Restify(app.models.Team, 'destroy'),

  /*
  	This action is also routed for /teams under routes.js
  */
  manage: function(req, res, next){

  	// Find teams
  	app.models.Team.find().exec(finishRendering);

  	function finishRendering(err, collection){
  		if(err) return next('Failed to retrieve data');

  		return res.render('team/manage', {
  			path: req.route.path,
  			teams: collection
  		});
  	}
  },

  teamlist: function(req, res){
  	app.models.Team.getTeamsAsList(req.param('query'), function(teamList){
  		res.send(teamList);
  	});
	},

	post: function (req, res, next) {
		return app.helpers.XEditable.handle(app.helpers.Team)(req, res, next);
	},


	/**
	* Overrides for the settings in `config/controllers.js`
	* (specific to TeamsController)
	*/
	_config: {
		menus: [
			{name: 'Teams', path: '/teams/manage', order: 0}
		]
	}


};
