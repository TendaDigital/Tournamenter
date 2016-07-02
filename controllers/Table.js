module.exports = {

  find: app.helpers.Restify(app.models.Table, 'find'),
  create: app.helpers.Restify(app.models.Table, 'create'),
  update: app.helpers.Restify(app.models.Table, 'update'),
  destroy: app.helpers.Restify(app.models.Table, 'destroy'),

	manage: function(req, res, next){
		var id = req.param.id || null;
		// Find tables
		findAssociated(id, function(tables){

			app.models.Team.getTeamsAsList(null, function (teamList){
				// Render view
				return res.render('table/manage', {
					path: req.route.path,
					tables: tables,
					teamList: teamList,
					evaluateMethodsNames: app.models.Table.evaluateMethodsNames,

					title: (id && tables[0] ? tables[0].name : 'Tables'),
				});
			});

		});
	},


	associated: function(req, res, next){
		// Get id
		var id = req.params.id || null;

		// Get collection associated
		findAssociated(id, finishRender);

		function finishRender(data){
			// If none object found with given id return error
			if(id && !data[0])
				return next();

			// If querying for id, then returns only the object
			if(id)
				data = data[0];

			// Render as JSON
			res.send(data);
		}
	},


	/**
	* Overrides for the settings in `config/controllers.js`
	* (specific to TableController)
	*/
	_config: {
		menus: [
			{name: 'Tables', path: '/tables/manage', order: 3},
		]
	},

	_findAssociated: findAssociated

};


/*
	The objective of this PRIVATE method is to create a full data
	of the table, with it's table data processed, ranked, [...]

	Associations with 'Scores' model will be done before computing
	the table contents, since Sails do not associate models together.

	Also, to associate every row with an existing team, so that
	we can use it's information in data.
*/
function findAssociated(id, next){
	var where = (id ? {id: id} : null);

	// Query Table model, and call afterFindTables when done.
	var finding = app.models.Table
		.find()
		.where(where)
		.exec(associateScores)


	/*
		Associate Scores data with Table data in key 'scores'
	*/
	var data;
	function associateScores(err, models){
		// Empy array (adjusts variable scope)
		data = [];

		if(err)
			next('Failed to retrieve data');

		// Create parallel tasks to associate each table with it's scores
		var findTasks = [];
		models.forEach(function(table){

			// Create and add parallel task to array
			var task = function(cb){
				// Creates another wrapper function to return null on first param
				// (it's required, since async work this way)
				associateTable(table, function returnToAsync(associated){
					cb(null, associated);
				});
			};
			findTasks.push(task);

		});

		// Execute parallel tasks
		async.parallel(findTasks, afterAssociateScores);
	}

	/*
		This function is called after all associations finished
	*/
	function afterAssociateScores(err, results){
		// Get response from callbacks and set as data array
		data = results;

		// Call next step
		processTables();
	}

	/*
		After scores are associated with the table, we can process it
	*/
	function processTables(){
		// Now we go through all Tables and call the method table on it
		_.invoke(data, 'calculate');
		_.invoke(data, 'headers');

		// Now we associate team's data
		associateTeams();
	}

	/*
		Associate every Scores in table, inserting a 'team' hash with team data
		(but first, we need to get a list of the teams)
	*/
	var teams;
	function associateTeams(){

		// Reset teams
		teams = {};

		// Helper method used to save team data inside each table row
		function associateWithTeams(teams, tableModel){
			// Go through all team rows inside the table's data, and add's team object
			// _.forEach(tableModel.table, function(teamRow){
			// 	teamRow['team'] = teams[teamRow.teamId] || {};
			// });

			// Go through all team rows inside scores, and add's a team object
			_.forEach(tableModel.scores, function(teamRow){
				teamRow['team'] = teams[teamRow.teamId] || {};
			});
		}

		// Find teams
		app.models.Team.find().exec(function(err, collection){
			// Turns the id as the key to access it
			// ( o(1) when accessing it )
			for(var k in collection){
				var team = collection[k];
				teams[team.id] = team;
			}

			afterFindTeams();
		});

		function afterFindTeams(){
			// Go through all tables and call association method
			_.forEach(data, function(tableModel){
				associateWithTeams(teams, tableModel);
			});

			// Return data
			returnData();
		}
	}


	/*
		Return data
	*/
	function returnData(){
		// Return data
		next(data);
	}

}

/*
	This method receives one 'Table' object and
	insert key 'scores' inside it.
*/
function associateTable(model, next){
	// Perform search in Scores, where tableId equals to model.id and callback
	_findAssociated(app.models.Scores, 'tableId', model.id, afterFind);

	function afterFind(models){
		model.scores = models;
		return next(model);
	}
}

/*
	Find in Model, where 'key' is equal to id
*/
function _findAssociated(Model, key, id, cb){
	// Create where clause
	var options = {
		where: {}
	};
	options.where[key] = id;

	var finding = Model.find(options);

	finding.exec(function afterFound(err, models) {
		if(cb)
			cb(models);
	});
}
