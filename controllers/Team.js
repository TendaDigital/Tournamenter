module.exports = {

    /*
    	This action is also routed for /teams under routes.js
    */
    manage: function(req, res, next){

    	// Find teams
    	Team.find().done(finishRendering);

    	function finishRendering(err, collection){
    		if(err) return next('Failet to retrieve data');

			return res.view({
				path: req.route.path,
				teams: collection
			});
    	}
    },

    teamlist: function(req, res){
    	Team.getTeamsAsList(req.param('query'), function(teamList){
    		res.send(teamList);
    	});
	},

	post: function (req, res, next) {
		return XEditable.handle(Team)(req, res, next);
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
