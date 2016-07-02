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
		name: 'Group View',
		module: 'pageview-group',
		disabled: false,

		/*
			Find groups in server. Return cached if exist, or callback later
			This is a helper method, for loading groups the first time it's called.
			When it is fetched, all the remaining callbacks will be executed.
			Afte that, calling this method will return instantly the groups.

			Also, when it fetches, it will update the GroupsKeys array.
		*/
		groups: new App.Collections.Groups(),
		groupsKeys: [],
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

				module.groups.forEach(function(table){
					GroupsKeys.push({
						value: table.get('id'),
						text: table.get('name'),
					});
				});

				module.GroupsKeys = GroupsKeys;
			}
		},
	});


	/*
		Public view Class that will render, update and animate
		groups
	*/
	module.view = defaultModule.view.extend({
		tableTemplate: JST['pageview-group.layout'],

		initialize: function(){
			// Call super constructor
			this._initialize();
			this.listenTo(this.model, 'change:options', this.render);

			// this.on('show:before', this.updateTables, this);
			this.on('show:before show:skip', this.prepare, this);
			this.on('show:after', 	this.show, this);
			this.on('hide', 		this.hide, this);
			// this.listenTo(this.model, 'change:data', this.verifyChange);
			// this.listenTo(this.model, 'change:data', this.updateTables);

			this.$el.addClass('pageview-group');
		},

		stillTime: null,
		_timePerRowInTable: 400,
		_timePerMatchInTable: 500,
		tableStillTime: 1000,
		matchesStillTime: 1000,
		prepare: function(){
			// Render always before showing
			this.render();

			/*
				In order to estimate time, we must know if:
				
				+still time was set?
					Then we will calculate the tableStillTime

				+still time not set?
					Calculate/get tableStillTime, and set still time
			*/
			var still = this.model.get('still')*1000 || null;
			var options = this.model.get('options');
			// Count pages
			var tableCount = this.countPages();
			var matchesCount = this.countSchedulePages();

			if(still){

				this.stillTime = still;
				this.tableStillTime = still/tableCount;
				this.matchesStillTime = still/matchesCount;
			}else{
				var expectedTableStill = options.still*1000 || null;
				if(!expectedTableStill)
					expectedTableStill = this.calculateRowsNumber() * this._timePerRowInTable;

				var expectedMatchesStill = options.stillMatches*1000 || null;
				if(!expectedMatchesStill)
					expectedMatchesStill =
						this.calculateScheduleRowsNumber() * this._timePerMatchInTable;

				this.stillTime =
					Math.max(tableCount*expectedTableStill, matchesCount*expectedMatchesStill);
				this.tableStillTime = expectedTableStill;
				this.matchesStillTime = expectedMatchesStill;
			}
		},

		/*
			Helper functions
		*/

		// Count how many tables exist
		countPages: function(){
			return this.getTableContainer().children().length;
		},

		// Get current table
		currentPage: function(){
			return this.getTableContainer().transitionGetCurrent();
		},

		// Return the container
		getTableContainer: function(){
			return $(this.$el.find('.table-pages'));
		},

		// Return the expected MAXIMUM number of rows for every table
		calculateRowsNumber: function(){
			var rows = this.model.get('options').rows*1 || null;
			if(rows) return Math.max(5, rows);

			var cellHeight = 30 || (this.$el.find('tr:first').height() || 30);
			var height = this.$el.parent().height() - this.$el.children(':first').height();
			rows = Math.round(height / cellHeight) - 2;
			return Math.max(8, rows);
		},

		// Only for Schedule
		countSchedulePages: function(){
			return this.getScheduleContainer().children().length;
		},

		// Get current table
		currentSchedulePage: function(){
			return this.getScheduleContainer().transitionGetCurrent();
		},

		// Return the container
		getScheduleContainer: function(){
			return $(this.$el.find('.matches-pages'));
		},

		// Return the expected MAXIMUM number of rows for every table
		calculateScheduleRowsNumber: function(){
			var rows = this.model.get('options').rows*1 || null;
			if(rows) return Math.max(3, rows/2);

			var cellHeight = 70;
			var height = this.$el.parent().height() - this.$el.children(':first').height();

			// Less the maximum required by the tags (Scheduled, Playing, Ended...)
			height -= 180;

			rows = Math.round(height / cellHeight - 0.5);
			console.log(height);
			return Math.max(3, rows);
		},

		/*
			Return precomputed value
		*/
		estimateTime: function(){
			return this.stillTime;
		},


		render: function(){
			// Get Page options and data
			// var options = this.model.get('options');
			// var groups 	= this.model.get('data');

			if(!this.$el.html()){
				// Find out correct layout template for it
				var template = JST['pageview-group.layout'];

				var finalLayout = template({});

				this.$el.empty();
				this.$el.html(finalLayout);
			}

			this.updateGroups();
			this.updatePageIndicators();

			this.updateMatches();
			this.updateMatchesPageIndicators();
		},

		/*
			This method will force the re-rendering of the table,
			trying to recycle it's tables. It will render all tables
			assigned to this Page.
		*/
		updateGroups: function(){
			var tables = this.model.get('data');
			var tableData = tables[0];
			var $tableSpots = this.$el;

			this.updateGroup(tableData, $tableSpots);
			return this;
		},

		/*
			Create HTML-tables with the given table data, in $tableSpot (to recycle)
		*/
		updateGroup: function(table, $tableView){
			// var $tableSpot = $($tableSpots[t]);
			// var table = tables[t];
			var $tableSpot = $tableView.find('.table-pages');
			var $tables = $tableSpot.find('table');
			var tables = [];
			var header = this.makeTableHeader(table);
			// Split data into rows
			var datas = this.splitTableData(this.makeTableContent(table));

			// Update title
			$tableView.find('.table-title').text(table.name);

			// Create a table for each existent 
			for(var d in datas){
				// Try to recycle table
				var $newTable = $tables[d];
				if(!$newTable){
					$newTable = $('<table class="pt-page table-bordered table-pretty table-orange"></table>');
					$tableSpot.append($newTable);
				}
				App.Mixins.createTable(header, datas[d], $newTable);
			}
			// Remove rest of tables (trash from previous render)
			$($tables[datas.length-1]).nextAll().remove();
		},

		updateMatches: function(){
			var data = this.model.get('data')[0];
			var matches = data ? data.matches : null;
			if(!matches) return console.log('ops... skiping');

			// var $tableSpot = $($tableSpots[t]);
			// var table = tables[t];
			var $tableSpot = this.$el.find('.matches-pages');
			var $tables = $tableSpot.find('.matches-inner');
			var tables = [];
			// Split data into rows
			var datas = this.splitMatchesData(matches);

			// Create a table for each existent 
			for(var d in datas){
				// Try to recycle table
				var $newTable = $tables[d];
				if(!$newTable){
					$newTable = $('<div class="pt-page matches-inner"></div>');
					$tableSpot.append($newTable);
				}
				// App.Mixins.createTable(header, datas[d], $newTable);
				this.renderMatches(datas[d], $($newTable));
			}
			// Remove rest of tables (trash from previous render)
			$($tables[datas.length-1]).nextAll().remove();


			// var tables = this.model.get('data');
			// var $tableSpots = this.$('');

			// this.updateMatch(tableData, $tableSpots);

			// // Render Matches (if exist)
			// if(groups[0])
				

			return this;
		},


			


		interval: null,
		intervalMatches: null,
		show: function(){
			this.setupTimer();
			this.setupTimerMatches();

			// Set current page
			$tablePages = this.getTableContainer();
			$tablePages.transitionSetup({
				outClass: 'pt-page-flipOutRight',
				inClass: 'pt-page-flipInLeft pt-page-delay500',
			});
			$tablePages.transitionTo(0);
			this.updatePageIndicators();

			// Set current page
			$schedulePages = this.getScheduleContainer();
			$schedulePages.transitionSetup({
				outClass: 'pt-page-flipOutRight',
				inClass: 'pt-page-flipInLeft pt-page-delay500',
			});
			$schedulePages.transitionTo(0);
			this.updateMatchesPageIndicators();
			// self.cycle();
		},

		setupTimer: function(){
			var self = this;
			this.interval = clearInterval(this.interval);
			this.interval = setInterval(function(){
				self.cycle();
			}, this.tableStillTime);
		},

		setupTimerMatches: function(){
			var self = this;
			this.intervalMatches = clearInterval(this.intervalMatches);
			this.intervalMatches = setInterval(function(){
				self.cycleMatches();
			}, this.matchesStillTime);
		},

		hide: function(){
			this.interval = clearInterval(this.interval);
			this.intervalMatches = clearInterval(this.intervalMatches);
		},

		cycle: function(){
			$tablesRoots = this.$el.find('.table-pages').first();
			// Transition
			$tablesRoots.transitionNext({
				outClass: 'pt-page-flipOutRight',
				inClass: 'pt-page-flipInLeft pt-page-delay500',
				// animate: false,
			});
			this.updatePageIndicators();
		},

		cycleMatches: function(){
			$tablesRoots = this.$el.find('.matches-pages').first();
			// Transition
			$tablesRoots.transitionNext({
				outClass: 'pt-page-flipOutRight',
				inClass: 'pt-page-flipInLeft pt-page-delay500',
				// animate: false,
			});
			this.updateMatchesPageIndicators();
		},

		updatePageIndicators: function(){
			// Page indicator
			var view = this;
			$pageInd = this.$el.find('.page-indicator-tables');
			$pageInd.indicate(
				this.countPages(),
				this.currentPage().index());

			$pageInd.off('indicator.selectpage');
			$pageInd.bind('indicator.selectpage', function(e, i){
				view.getTableContainer().transitionTo(i);
				view.setupTimer();
				view.updatePageIndicators();
			});
		},

		updateMatchesPageIndicators: function(){
			// Page indicator
			var view = this;
			$pageInd = this.$el.find('.page-indicator-matches');
			$pageInd.indicate(
				this.countSchedulePages(),
				this.currentSchedulePage().index());

			$pageInd.off('indicator.selectpage');
			$pageInd.bind('indicator.selectpage', function(e, i){
				view.getScheduleContainer().transitionTo(i);
				view.setupTimerMatches();
				view.updateMatchesPageIndicators();
			});
		},

		/*
			Takes a data field, and split it in N fields to
			match the requirement.
		*/
		splitTableData: function(data){
			var rows = this.calculateRowsNumber();
			var datas = [];
			for(var i = 0; i < data.length; i += rows){
				datas.push(data.slice(i, i+rows));
			}
			return datas;
		},

		/*
			Takes a data field, and split it in N fields to
			match the requirement.
		*/
		splitMatchesData: function(data){
			var rows = this.calculateScheduleRowsNumber();
			var datas = [];
			for(var i = 0; i < data.length; i += rows){
				datas.push(data.slice(i, i+rows));
			}
			return datas;
		},

		makeTableHeader: function(table){
			var alignRight = 'text-right';
			var headers = {
				'rank': {
					value: 'Rank',
					class: alignRight,
					style: 'width: 5%;',
				},
				'teamName': {
					value: 'Team',
					style: 'width: 35%;',
				},
				'score': {
					value: 'Points',
					class: alignRight,
					style: 'width: 10%;',
				},
				'P': {
					value: 'Plays',
					class: alignRight,
					style: 'width: 8%;',
				},
				'W': {
					value: 'W',
					class: alignRight,
					style: 'width: 8%;',
				},
				'D': {
					value: 'D',
					class: alignRight,
					style: 'width: 8%;',
				},
				'L': {
					value: 'L',
					class: alignRight,
					style: 'width: 8%;',
				},
				'goalsMade': {
					value: 'Goals',
					class: alignRight,
					style: 'width: 8%;',
				},
				'GD': {
					value: 'GD',
					class: alignRight,
					style: 'width: 8%;',
				},
			};

			return headers;
		},

		/*
		Associated Group Data Example:
			name: "GRUPO A",
			createdAt: "2014-07-03T23:30:58.049Z",
			updatedAt: "2014-07-04T00:53:13.454Z",
			id: 3,
			matches: [
				{
					groupId: 3,
					teamAId: "1",
					teamAScore: 0,
					teamBId: "3",
					teamBScore: 0,
					state: "scheduled",
					day: 1,
					hour: "12:00",
					field: "Ç",
					createdAt: "2014-07-04T00:52:26.467Z",
					updatedAt: "2014-07-04T00:52:37.070Z",
					id: 3,
					teamA: {
						name: "Team Cooler",
						country: "BR",
						category: "default",
						createdAt: "2014-07-04T00:01:24.863Z",
						updatedAt: "2014-07-04T00:01:42.762Z",
						id: 1
					},
					teamB: {
						name: "Abudabadistas",
						country: "AS",
						category: "default",
						createdAt: "2014-07-04T00:01:25.596Z",
						updatedAt: "2014-07-04T00:01:52.076Z",
						id: 3
					}
				},
				{...},
				{...},
			],
			table: [
				{
					rank: 1,
					teamId: "5",
					P: 0,
					goalsMade: 0,
					goalsTaken: 0,
					S: "0:0",
					W: 0,
					D: 0,
					L: 0,
					score: 0,
					team: {
						name: "Samuel Gunzenores",
						country: "BD",
						category: "default",
						createdAt: "2014-07-04T00:01:25.904Z",
						updatedAt: "2014-07-04T00:02:07.517Z",
						id: 5
					}
				},
				{...},
				{...},
				{...},
			]
		*/
		makeTableContent: function(table){
			var listKey = 'table';
			var content = [];
			var columns = table.columns*1;

			for(var s in table[listKey]){
				var score = table[listKey][s];
				// Add dynamic attributes
				score.teamName = score.team ? score.team.name : '';
				content.push(score);
			}

			console.log(table);

			return content;
		},

		/*
			Module Responsible for rendering Matches View's
		*/

		renderMatches: function(matches, container){

			// Group matches by state
			var grouped = _.groupBy(matches, 'state');

			// Now we render everything
			// (Bagde, Match, Match, Match, Badge, Match,...)
			var rendered = [];
			for(var type in grouped){
				var group = grouped[type];

				// Skip if group is empty
				if(group.length <= 0) continue;

				// Render Badge
				rendered.push(this.renderMatchBadge(type));

				// Render Matches
				for(var k in group){
					var match = group[k];
					rendered.push(this.renderMatch(match));
				}
			}

			rendered.push($('<div class="clearfix"></div>'));

			container.empty();
			container.append(rendered);
		},

		// Method will render the 'badge' with the type specified
		// (playing/scheduled/ended)
		renderMatchBadge: function(type){
			var view;

			if(type == 'scheduled')
				view = '<div class="group-tag group-tag-blue">'+
						'<span class="glyphicon glyphicon-time"></span> SCHEDULED</div>';

			else if(type == 'playing')
				view = '<div class="group-tag group-tag-orange">'+
						'<span class="glyphicon glyphicon-play"></span> PLAYING</div>';

			else if(type == 'ended')
				view = '<div class="group-tag group-tag-green">'+
						'<span class="glyphicon glyphicon-ok"></span> ENDED</div>';

			else
				view = '<div class="group-tag group-tag-green">'+type+'</div>';
			// Default one...
			return $(view);
		},

		// Render a single match view with the correct view state
		renderMatch: function(match){
			/*
				Depending on the match state, we shall render
				a different match view. Templates are:
					+ pageview-group.match.scheduled
					+ pageview-group.match.playing
					+ pageview-group.match.endend
			*/
			var templates = {
				'scheduled': JST['pageview-group.match.scheduled'],
				'playing': JST['pageview-group.match.playing'],
				'ended': JST['pageview-group.match.ended'],
			};

			if(match.state == 'scheduled'){

				return JST['pageview-group.match.scheduled']({match: match});

			}else if(match.state == 'playing'){

				return JST['pageview-group.match.playing']({match: match});

			}else if(match.state == 'ended'){

				// In this case, we need to set the class for A and B.
				// (teamAClass and teamBClass to null, team-win, team-loose)
				return JST['pageview-group.match.ended']({
					match: match,
					
					teamAClass: (match.teamAScore > match.teamBScore ? 'team-win'
								:match.teamAScore < match.teamBScore ? 'team-loose' : ''),

					teamBClass: (match.teamBScore > match.teamAScore ? 'team-win'
								:match.teamBScore < match.teamAScore ? 'team-loose' : ''),
				});
			}
		},

	});


	module.ConfigView = defaultModule.ConfigView.extend({

		template: JST['pageview-group.configView'],

		initialize: function(){
			// Setup model variables
			if(!this.model.has('options'))
				this.model.set('options', {});

			this.listenTo(this.model, 'change', this.render);
		},

		render: function(){
			var view = this;

			// If the fetch is not complete, return and call self render later
			var tables = module.getGroups(function(){
				view.render();
			});
			if(!tables) return this;
				
			// Render view
			this.$el.html(this.template());
			this.$el.addClass('list-group');

			// Initialize edit fields
			this.configureEditFields();

			return this;
		},

		configureEditFields: function(){
			var view = this;

			// Editable options used for Tables
			$tables = this.$('.config-tables');
			App.Mixins.editInPlaceCustom($tables, {
				type: 'select2',
				mode: 'popup',
				source: module.GroupsKeys,
				showbuttons: true,
				value: view.model.get('options').tables,
				select2: {
					multiple: false,
					width: 200,
					placeholder: 'Select Table',
					allowClear: true,
				},
			}, this.createSaveWrapperForField('tables'));

			// Editable options used table items
			$rows = this.$('.config-rows');
			App.Mixins.editInPlaceCustom($rows, {
				type: 'text',
				mode: 'popup',
				showbuttons: true,
				value: view.model.get('options').rows,
				emptytext: 'Automatic',
				validate: function(value) {
					if(!value)
						return;
					value = value*1;
					if(!_.isNumber(value) || value < 1)
						return 'It must be bigger than 1!';

					var isRound = (value % 1 === 0);
					if(!isRound)
						return 'It must be an integer';
				}
			}, this.createSaveWrapperForField('rows'));

			// Editable options used table items
			$still = this.$('.config-still');
			App.Mixins.editInPlaceCustom($still, {
				type: 'text',
				mode: 'popup',
				showbuttons: true,
				value: view.model.get('options').still,
				emptytext: 'Automatic',
				validate: function(value) {
					if(!value)
						return;
					value = value*1;
					if(!_.isNumber(value) || value < 1)
						return 'It must be bigger than 1!';
				},
				display: function(value){
					$(this).text(value ? value + 's' : value);
				}
			}, this.createSaveWrapperForField('still'));

			return this;
		}
	});

	module.ItemView = defaultModule.ItemView.extend({
		ConfigView: module.ConfigView,
	});

	// Register in modules
	(Modules.PageViews = Modules.PageViews ? Modules.PageViews : {})[module.module] = module;

})();