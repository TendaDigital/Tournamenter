/**
 * Team
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  identity: 'team',
  connection: 'default',

	attributes: {
		name: {
			type: 'string',
			defaultsTo: '[Team Name]'
		},
		country: {
			type: 'string',
			defaultsTo: null
		},

		/*
			This property can be used to sync data outside of this system.
			It's not required, and in fact, not used inside this system.

			The idea is that all teams will be stored in a internet database,
			and that each league will 'fetch' a single category from that
			database (let's say: 'junior.rescueb').
			This attribute will come with the team model, but will not be used.

			It's nice to keep it even not using...

		*/
		category: {
			type: 'string',
			defaultsTo: 'default'
		},
	},

	getTeamsAsList: function(query, next){

		app.models.Team.find(afterFind);

		function afterFind(err, data){
			var teamList = [];
			var query = (query || '').toLowerCase();

			for(k in data){
				team = data[k]
				var insert =
				{
					id: team.id,
					text: data[k].name
				};

				if((insert.text || '').toLowerCase().indexOf(query) >= 0)
					teamList.push(insert);
			}

			next(teamList);
		}
	}

};
