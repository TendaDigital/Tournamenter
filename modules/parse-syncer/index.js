/*
	This module serves the purpose of RoboCup, to sync View's data to Parse.com server.

*/
var _ = require('lodash');
var sails = require('sails');
var argv = require('optimist').argv;
var Parse = require('parse').Parse;

var TAG = 'ParseSyncer ::'.cyan;

var ParseSyncer = {

	/*
		Defaults
	*/
	config: {
		// Parse configuration
		APP_ID: null,
		API_ID: null,

		// Category (like 'rescue.a.primary') to save to in Parse.com
		category: null,

		// For Login
		username: null,
		password: null,

		// false to force login every time, or a number (in secconds) to expirte
		loginExpiration: 60 * 60, // 1h
		
		// Update interval (in seconds)
		interval: 60 * 2,
		initializeDelay: 5000,

		/*
			Team sync configurations
	
			merge = false: will delete all data before saving
			merge = true: will save without deleting

			if teamSync === true, will sync once when starts
			if teamSync === false, will not sync.
		*/
		teamsMerge: false,
		teamsSync: true,
	},

	/*
		Checks passed args and
	*/
	initialize: function (sails, config) {
		var self = this;


		// Overrides configs with enviroment passed args
		_.extend(self.config, argv.ParseSyncer, config);

		// Skip this module. It's not initialized
		if(!self.config.APP_ID || !self.config.API_ID) return;

		console.log('\n');
		console.log(TAG, 'Settings'.grey, self.config);
		// console.log(TAG, 'Init with category:'.grey, self.config.category.green);

		// Give some time to app. Let's delay a bit to initialize and start syncing
		setTimeout(function(){
			self.postInitialize();
		}, self.config.initializeDelay);
	},

	/*
		What it does:
			+ Initialize Parse
			+ Start interval to sync data
	*/
	parse: null,
	interval: null,
	postInitialize: function(next){
		var self = this;

		console.log(TAG, 'postInitialize'.grey);

		// Create Parse object
		// if(!self.parse) self.parse = new Parse(self.config.APP_ID, self.config.API_ID);
		Parse.initialize(self.config.APP_ID, self.config.API_ID);

		// Start interval for sync
		// Clear and re-set interval
		self.interval = clearInterval(self.interval);
		self.interval = setInterval(doSync, self.config.interval * 1000);
		setTimeout(doSync, 0);
		function doSync(){
			self.sync();
		}
	},

	/*
		Logins and runs callback
	*/
	lastLogin: 0,
	login: function(next){
		var self = this;

		// If not expired and a sessionToken is set, then skip login
		var expired = self.lastLogin + self.config.loginExpiration*1000 < (new Date()).getTime();
		if(!expired){
			// console.log(TAG, 'Login skiped. Already logged in'.grey);
			return next(null);
		}

		// Logs in and waits for callback
		Parse.User.logIn(self.config.username, self.config.password, {
			success: function(user) {
				if(!user) next('Could not login');

				// Save lastLogin timestamp as current time
				self.lastLogin = (new Date()).getTime();
				console.log(TAG, 'Logged in'.green);
				next(null);
			},
			error: function(user, error) {
				next(error);
			}
		});
	},

	/*
		Fetches data, login (if needed), and save to parse
	*/
	_teamsSynced: false,
	sync: function(){
		var self = this;

		// Start process to save views
		self.syncViews();

		// Start process to fetch teams and save to local, only once
		if(self.config.teamsSync){// && !self._teamsSynced){
			self.syncTeams();
			// self._teamsSynced = true;
		}
		
	},

	/*
		Save data to parse field and run callback
	*/
	League: Parse.Object.extend('League'),
	save: function(data, next){
		var self = this;

		if(!_.isArray(data)) return next('Data to be saved must be an array');

		// Make query to find a league that has a category equal to the env. process name
		var category = self.config.category;
		var query = new Parse.Query(self.League);
		query.equalTo('category', category);
		
		// Execute query
		query.first({
			success: function(object) {
				if(object)
					finishSaving(object);
				else
					next('Could not find a object model with the specified category');
			},
			error: function(error) {
				console.log(TAG, 'Error while saving Views:'.red, error);
				next(error);
			}
		});

		function finishSaving(league){
			league.set('views', data);

			league.save(null, {
				success: function(league) {
					next(null);
				},
				error: function(err){
					console.log(TAG, 'Error while saving Views:'.red, err);
					next(err);
				}
			});
		}
	},

	/*
		Get data to be saved
	*/
	getViews: function(next){
		sails.controllers['view']._associated(null, afterAssociate);

		function afterAssociate(err, data){
			if(err) return next(err);
			next(null, data);
		}
	},

	/*
		Save processed app views to Parse.com
	*/
	syncViews: function(next){
		var self = this;

		self.login(function(err){
			if(err){
				console.error(TAG, 'Failed to Login'.red, err.grey);
				return next && next(err);
			}

			self.getViews(afterGetViews);
		});

		function afterGetViews(err, views){
			if(err){
				console.log(TAG, 'Failed to get views'.red, err.grey);
				return next && next(err);
			}

			self.save(views, finishedSaving);
		}

		function finishedSaving(err){
			console.log(TAG, 'Views saved'.green);
			next && next(null);
		}
	},

	/*
		Fetches teams from Parse.com and saves to local db
	*/
	Team: Parse.Object.extend('Team'),
	syncTeams: function(next){
		var self = this;

		var query = new Parse.Query(self.Team);
		var category = self.config.category;
		query.equalTo('category', category);
		
		// Execute query
		query.find({
			success: function(teams){
				destroyIfNeeded(teams);
			},
			error: function(err){
				console.error(TAG, 'Could not sync teams'.red, err.grey);
				next && next(err);
			}
		});

		// Destroy if needed (clean prior to save) then save
		var SailsTeam = null;
		function destroyIfNeeded(teams){
			SailsTeam = sails.models.team;

			// Destroy first, if merge is set to false
			if(!self.config.teamsMerge){
				SailsTeam.destroy({}).done(function(err){
					if(err){
						console.error(TAG, 'Could not delete teams'.red, err.grey);
						return next && next(err);
					}

					// Actually save data
					saveToLocal(teams);
				});

				return;
			}

			saveToLocal(teams);
		}

		// Save to local db
		var teams = [];
		function saveToLocal(_teams){ 
			// Convert Parse objects to array
			for(var k in _teams)
				teams.push(_teams[k].toJSON());

			// Set id var as objecId
			for(var k in teams){
				teams[k].id = teams[k].objectId+'';
				delete teams[k].League;
			}

			// Insert all items from the fixture in the model (in parallel using async)
			async.each(teams, function(item, nextModel) {
				SailsTeam.create(item, function(err) {
					if(err) console.log(err);
					if (err) return next && next(err);
					nextModel();
				});
			}, finishedSaving);

		}

		// Returns error and logs status
		function finishedSaving(err){
			if(err){
				console.error(TAG, 'Could not create teams'.red, err.grey);
				return next && next(err);
			}
			console.log(TAG, 'Imported teams from parse!'.green, teams.length);
			next && next(null);
		}
	},
}

module.exports = ParseSyncer;