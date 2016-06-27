module.exports = {

	post: function (req, res, next) {
		return XEditable.handle(Match)(req, res, next);
	},

	associated: function(req, res, next){
		var id = req.param('id');

		findAssociated(id, function(err, model){
			if(err) return next(err);
			res.send(model);
		});
	},

	live: function(req, res, next){
		var id = req.param('id');
		res.view({matchId: id});
	},

	/*
		Associate a match with it's Group and return
	*/
	_findAssociated: findAssociated,


	/**
	* Overrides for the settings in `config/controllers.js`
	* (specific to MatchesController)
	*/
	_config: {}

};

/*
	The objective of this PRIVATE method is to create a full data
	of the Match, with it's Group and Teams (A an B teams)
*/
function findAssociated(id, next){

	var model;
	var checked = 0;

	Match.findById(id).done(function afterFound(err, models) {
		if(!err) return afterFindMatch(models);
		next(err, null);
	});


	// Called after match is fetched. Associate with Group and Teams
	function afterFindMatch(models){
		if(models.length != 1) return next(404);

		model = models[0];

		// Fetch Both Teams
		Team.findById(model.teamAId).done(function(err, models){
			model.teamA = models.length ? models[0] : null;
			checkFetch();
		});

		Team.findById(model.teamBId).done(function(err, models){
			model.teamB = models.length ? models[0] : null;
			checkFetch();
		});

		// Fetch Group
		Group.findById(model.groupId).done(function(err, models){
			model.group = models.length ? models[0] : null;
			checkFetch();
		});
	}

	function checkFetch(){
		if(++checked == 3) return next(null, model);
	}
}
