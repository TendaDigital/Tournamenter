var GroupController = module.exports = {

  find: app.helpers.Restify(app.models.Group, 'find'),
  create: app.helpers.Restify(app.models.Group, 'create'),
  update: app.helpers.Restify(app.models.Group, 'update'),
  destroy: app.helpers.Restify(app.models.Group, 'destroy'),

	post: function (req, res, next) {
		return app.helpers.XEditable.handle(app.models.Group)(req, res, next);
	},

	manage: function (req, res) {
		return res.render('group/manage', {
			path: req.route.path
		});
	},

	// Mix in matches inside groups data
	associated: function(req, res, next){

		// Search for ID if requested
		var id = req.param('id');

		findAssociated(id, finishRendering);

		// Render JSON content
		function finishRendering(data){
			// If none object found with given id return error
			if(id && !data[0])
				return next();

			// If querying for id, then returns only the object
			if(id)
				data = data[0];

			// Render the json
			res.send(data);
		}
	},

	/**
	 * Overrides for the settings in `config/controllers.js`
	 * (specific to GroupsController)
	 */
	_config: {
		menus: [
			{name: 'Groups', path: '/groups/manage', order: 1}
		]
	},

	_findAssociated: findAssociated

};

/*
	The objective of this PRIVATE method is to create a full data
	of the Group, with it's matches, teams, and soccer-tables generated
*/
function findAssociated(id, next){

	// Data to be rendered
	var data = [];
	// Wait for parallel tasks to complete
	var completed = 0;
	var where = (id ? {id: id} : null);

	// Query Table model, and call afterFindTables when done.
	var finding = app.models.Group
		.find()
		.where(where)
		.exec(function afterFound(err, models) {
			if(!err)
				afterFindGroups(models);
		});


	// After finishing search
	function afterFindGroups(models){
		data = models;
		completed = 0;

		if(data.length <= 0)
			return next([]);

		// Load Matches for each Group and associates
		data.forEach(function(group){

			app.models.Match.find()
				.where({'groupId': group.id})
				.sort('state DESC')
				.sort('day ASC')
				.sort('hour ASC')
				.sort('id')
				.then(function(matches){
				// Associate matches with groups
				group.matches = matches;

				// Compute scoring table for each group
				// (must be computed AFTER associating matches with it)
				group.table = group.table();

				// Callback
				loadedModel();
			});
		});
	}

	// Function needed to wait for all queries to finish
	function loadedModel(){
		completed++;

		if(completed >= data.length)
			associateTeams();
	}

	// Load Teams
	function associateTeams(){
		app.models.Team.find(afterFindTeams);
	}

	// Associate keys with teams
	function afterFindTeams(err, teamData){
		var teamList = {};

		// Load teams and assing it's key as it's id
		teamData.forEach(function(team){
			teamList[team.id] = team;
		});

		// Includes team object in 'table' data
		data.forEach(function(group){

			// console.log(group);
			// Go trough all the table adding key 'team' with team data
			_.forEach(group.table, function(row){
				row.team = teamList[row.teamId];
			});
		});

		// Includes team object in 'match' data
		data.forEach(function(group){

			// console.log(group);
			// Go trough all the table adding key 'team' with team data
			_.forEach(group.matches, function(row){
				row.teamA = teamList[row.teamAId];
				row.teamB = teamList[row.teamBId];
			});
		});

		next(data);
	}
}
