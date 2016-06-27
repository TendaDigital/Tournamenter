/*
	=======================================
				PAGEVIEWS GROUP
	=======================================

	An extension of default PAGEVIEW.

	This will configure and show group data

*/
(function () {

	// Get default pageview module to extend
	defaultModule = _.clone(Modules.PageViews['pageview']);

	// Extend default pageview
	var module = _.extend(defaultModule, {
		name: 'Match Live View',
		module: 'pageview-live-match',
		disabled: false,

		/*
			Find groups in server. Return cached if exist, or callback later
			This is a helper method, for loading groups the first time it's called.
			When it is fetched, all the remaining callbacks will be executed.
			Afte that, calling this method will return instantly the groups.

			Also, when it fetches, it will update the GroupsKeys array.
		*/
		groups: new App.Collections.Groups(),
		GroupsKeys: [],
		MatchKeys: [],
		_callbacks: [],
		fetchComplete: false,
		getGroups: function(next){
			var self = this;
			// Register  callbacks

			// Fetches data
			if(!this.fetchComplete){
				this._callbacks.push(next);
				// Only fetches for the first time
				if(this._callbacks.length <= 1)
					this.groups.fetch({success: onFetchComplete});
				return null;
			}

			return this.groups;

			function onFetchComplete(){
				self.fetchComplete = true;
				processGroupsKeys();
				// Run callbacks
				while(self._callbacks.length > 0)
					self._callbacks.pop()(self.groups);
			}

			// When the table is synced, we shall update it's values
			function processGroupsKeys(){
				var GroupsKeys = [];
				var MatchKeys = [];

				module.groups.forEach(function(group){
					GroupsKeys.push({
						value: group.get('id'),
						text: group.get('name'),
					});

					group.get('matches').forEach(function(match){
						var title = group.get('name') + ': ';
						title += match.teamA ? match.teamA.name : '[?]';
						title += ' x ';
						title += match.teamB ? match.teamB.name : '[?]';

						MatchKeys.push({
							value: match.id,
							text: title,
						});
					});
				});

				module.GroupsKeys = GroupsKeys;
				module.MatchKeys = MatchKeys;
			}
		},
	});

	/*
		Public view Class that will render, update and animate
		Match
	*/
	module.view = defaultModule.view.extend({
		tableTemplate: JST['pageview-group.layout'],

		initialize: function(){
			// Call super constructor
			this._initialize();
			this.listenTo(this.model, 'change:options', this.render);
			this.listenTo(this.model, 'change:data', this.render);

			// this.on('show:before', this.updateTables, this);
			this.on('show:before show:skip', this.prepare, this);
			this.on('show:after', 	this.show, this);
			this.on('hide:before', 	this.hide, this);

			this.$el.addClass('pageview-live-match');
		},

		prepare: function(){
			// Render always before showing
			this.render();
		},

		/*
			Helper functions
		*/

		/*
			Return precomputed value
		*/
		estimateTime: function(){
			return this.stillTime || 5000;
		},


		render: function(){
			// Get Page options and data
			var options = this.model.get('options');
			var match 	= this.model.get('data');

			if(!match) return;

			if(!this.$el.html()){
				// Find out correct layout template for it
				var template = JST['pageview-live-match.layout'];

				var finalLayout = template({});

				this.$el.empty();
				this.$el.html(finalLayout);
			}

			// Render Match
			this.renderMatch(match, this.$el);
			this.updateScores(this.$el);
			this.setFlagsStates('show');

			
		},

		show: function(){
			this.setFlagsStates('show');
		},

		hide: function(){
			this.interval = clearInterval(this.interval);

			this.setFlagsStates('hide');
		},

		/*
			Module Responsible for rendering Match View
		*/

		renderMatch: function(match, $root){

			// Title bar
			$root.find('.timer').text(match.group.name);
			$root.find('.field-title').text('FIELD');
			$root.find('.field').text(match.field);

			// Content area
			var teamAName = match.teamA ? match.teamA.name : '-';
			$root.find('.team.left .team-name').text(teamAName);

			var teamBName = match.teamB ? match.teamB.name : '-';
			$root.find('.team.right .team-name').text(teamBName);
			
		},

		// Update both score values
		updateScores: function($root) {
			var match 	= this.model.get('data');

			this.updateScore(match.teamAScore, $root.find('.team.left .team-score'));
			this.updateScore(match.teamBScore, $root.find('.team.right .team-score'));
		},

		// Update/Animate a single score value
		updateScore: function(newScore, $scorePlace) {
			// Check if score has changed
			if($scorePlace.text() != newScore){
				// Start animating
				$scorePlace.slideUp(function () {
					// Change value
					$scorePlace.text(newScore);
					// Animate back
					$scorePlace.fadeIn();
				});
			}
		},

		// Animate both flags
		setFlagsStates: function(state){
			var match = this.model.get('data');

			var countryA = match.teamA ? match.teamA.country : null;
			this.setFlagsState(state, countryA, this.$('.flag-3d-left'));

			var countryB = match.teamB ? match.teamB.country : null;
			this.setFlagsState(state, countryB, this.$('.flag-3d-right'));
		},

		// Animates flag
		setFlagsState: function(state, country, $root){
			// Show only if requested to show, and country is set
			if(state == 'show' && country){

				// Skip changing flag if is the same
				if($root.data('country') == country){
					$root.removeClass('flag-hide');
					return;
				}

				// Save current flag
				$root.data('country', country);

				// Change flag animating it (Fade out, change, fade in)
				var imgPath = this.buildFlagPath(country);
				$root.addClass('flag-hide');
				setTimeout(function(){
					$root.find('.flag').attr('src', imgPath);
					$root.show();
					$root.removeClass('flag-hide');
				}, 800);
			}else{
				$root.addClass('flag-hide');
			}
		},

		// Returns an usable svg flag path
		buildFlagPath: function(country){
			return '/flags/4x3/'+country+'.svg';
		}


	});


	module.ConfigView = defaultModule.ConfigView.extend({

		template: JST['pageview-live-match.configView'],

		initialize: function(){
			// Setup model variables
			if(!this.model.has('options'))
				this.model.set('options', {});

			this.listenTo(this.model, 'change', this.render);
		},

		render: function(){
			var view = this;

			// If the fetch is not complete, return and call self render later
			var groups = module.getGroups(function(){
				view.render();
			});
			if(!groups) return this;

			// Render view
			this.$el.html(this.template());
			
			// Initialize edit fields
			this.configureEditFields();

			// Update the link to live-edit soccer match
			var matchId = this.model.get('id');
			this.$('.btn-live-edit').attr('href', '/matches/live/'+matchId);

			return this;
		},

		groupId: null,
		configureEditFields: function(){
			var self = this;

			var options = this.model.get('options');
			console.log(options);

			// Render the group editable fields
			var $match = this.$('.config-match');
			App.Mixins.editInPlaceCustom($match, {
				type: 'select2',
				// mode: 'popup',
				source: module.MatchKeys,
				// showbuttons: true,
				value: options.match,
				select2: {
					multiple: false,
					width: 400,
					placeholder: 'Select Match',
					allowClear: true,
				},
			}, this.createSaveWrapperForField('match'));
 
			return this;
		},

	});

	module.ItemView = defaultModule.ItemView.extend({
		ConfigView: module.ConfigView,
	});

	// Register in modules
	(Modules.PageViews = Modules.PageViews ? Modules.PageViews : {})[module.module] = module;

})();