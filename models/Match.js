/**
 * Match
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  identity: 'match',
  connection: 'default',

	attributes: {
		// id: {type: 'int'},

		groupId: {
			type: 'string',
			required: true,
		},

		teamAId: {
			type: 'string',
			defaultsTo: null,
		},
		teamAScore: {
			type: 'integer',
			defaultsTo: 0,
		},
		teamBId: {
			type: 'string',
			defaultsTo: null,
		},
		teamBScore: {
			type: 'integer',
			defaultsTo: 0,
		},

		state: {
			type: 'string',
			defaultsTo: 'scheduled',
			// Can be one of: (scheduled|playing|ended)
		},

		day:  {
			type: 'integer',
			defaultsTo: '1',
		},
		hour:  {
			type: 'string',
			defaultsTo: '12:00',
		},
		field:  {
			type: 'string',
			defaultsTo: 'Ç',
		},
	}

};
