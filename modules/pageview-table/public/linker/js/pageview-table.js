/*
	=======================================
				PAGEVIEWS TABLE
	=======================================

	An extension of default PAGEVIEW.

	This will configure and show table data

*/
(function () {

	// Get default pageview module to extend
	defaultModule = _.clone(Modules.PageViews['pageview']);

	// Extend default pageview
	var module = _.extend(defaultModule, {
		name: 'Table View',
		module: 'pageview-table',
		disabled: false,

		/*
			Find tables in server. Return cached if exist, or callback later
			This is a helper method, for loading tables the first time it's called.
			When it is fetched, all the remaining callbacks will be executed.
			Afte that, calling this method will return instantly the tables.

			Also, when it fetches, it will update the tablesKeys array.
		*/
		tables: new App.Collections.Tables(),
		tablesKeys: [],
		_callbacks: [],
		fetchComplete: false,
		getTables: function(next){
			var self = this;
			// Register  callbacks

			// Fetches data
			if(!this.fetchComplete){
				this._callbacks.push(next);
				// Only fetches for the first time
				if(this._callbacks.length <= 1)
					this.tables.fetch({success: onFetchComplete});
				return null;
			}

			return this.tables;

			function onFetchComplete(){
				self.fetchComplete = true;
				processTablesKeys();
				// Run callbacks
				while(self._callbacks.length > 0)
					self._callbacks.pop()(self.tables);
			}

			// When the table is synced, we shall update it's values
			function processTablesKeys(){
				var tablesKeys = [];

				module.tables.forEach(function(table){
					tablesKeys.push({
						value: table.get('id'),
						text: table.get('name'),
					});
				});

				module.tablesKeys = tablesKeys;
			}
		},
	});


	/*
		Public view Class that will render, update and animate
		tables
	*/
	module.view = defaultModule.view.extend({
		tableTemplate: JST['pageview-table.table'],

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

			this.$el.addClass('pageview-table');
		},

		stillTime: null,
		_timePerRowInTable: 400,
		tableStillTime: 1000,
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

			if(still){

				this.stillTime = still;
				this.tableStillTime = still/tableCount;
			}else{
				var expectedTableStill = options.still*1000 || null;
				if(!expectedTableStill)
					expectedTableStill = this.calculateRowsNumber() * this._timePerRowInTable;

				this.stillTime = tableCount*expectedTableStill;
				this.tableStillTime = expectedTableStill;
			}
		},

		/*
			Helper functions
		*/

		// Count how many tables exist in table-index
		countPages: function(table){
			if(!table) table = 0;
			return this.getTableContainer(table).children().length;
		},

		// Get current table for table-index
		currentPage: function(table){
			if(!table) table = 0;
			return this.getTableContainer(table).transitionGetCurrent();
		},

		// Return the container for table-index
		getTableContainer: function(table){
			if(!table) table = 0;
			return $(this.$el.find('.table-pages')[table]);
		},

		// Return the expected MAXIMUM number of rows for every table
		calculateRowsNumber: function(){
			var rows = this.model.get('options').rows*1 || null;
			if(rows) return Math.max(10, rows);

			var cellHeight = 30 || (this.$el.find('tr:first').height() || 30);
			var height = this.$el.height() - this.$el.children(':first').height();
			rows = Math.round(height / cellHeight) - 2;
			return Math.max(5, rows);
		},

		/*
			Return precomputed value
		*/
		estimateTime: function(){
			return this.stillTime;
		},


		render: function(){
			// Get Page options and data
			var options = this.model.get('options');
			var tables 	= this.model.get('data');

			if(!this.$el.html()){
				// Find out correct layout template for it
				var template = JST['pageview-table.layout-'+tables.length];
				// Check if layout template exist
				if(!template)
					return console.log('No layout file provided for '+tables.length+' tables');

				// Create Views for tables
				var tableViews = [];
				for(var t in tables){
					var table = tables[t];
					tableViews.push(this.tableTemplate({
						// table: tables[t]
						title: '--',
						subtitle: 'Scores',
					}));
				}

				var finalLayout = template({
					tables: tableViews
				});

				this.$el.empty();
				this.$el.html(finalLayout);
			}

			this.updateTables();
			this.updatePageIndicators();
		},

		/*
			This method will force the re-rendering of the table,
			trying to recycle it's tables. It will render all tables
			assigned to this Page.
		*/
		updateTables: function(){
			var tables = this.model.get('data');
			var $tableSpots = this.$el.find('.table-view');
			for(var t in tables){
				// Update a table, with it's table-pages with tables[t] data in tableSpot
				this.updateTable(tables[t], $($tableSpots[t]));
			}
			return this;
		},

		/*
			Create HTML-tables with the given table data, in $tableSpot (to recycle)
		*/
		updateTable: function(table, $tableView){
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


		interval: null,
		show: function(){
			this.setupTimer();

			// Set current page
			$tablePages = this.getTableContainer();
			$tablePages.transitionSetup({
				outClass: 'pt-page-flipOutRight',
				inClass: 'pt-page-flipInLeft pt-page-delay500',
			});
			$tablePages.transitionTo(0);
			this.updatePageIndicators();
			// self.cycle();
		},

		setupTimer: function(){
			var self = this;
			this.interval = clearInterval(this.interval);
			this.interval = setInterval(function(){
				self.cycle();
			}, this.tableStillTime);
		},

		hide: function(){
			this.interval = clearInterval(this.interval);
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

		updatePageIndicators: function(){
			// Page indicator
			var view = this;
			$pageInd = this.$el.find('.page-indicator');
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
		Table Data example
			table:{
				columns: "5",
				createdAt: "2014-01-16T19:10:21.861Z",
				evaluateMethod: "return Math.random();",
				headerFinal: "Final",
				headerRank: "Rank",
				headerScore: "Round",
				headerTeam: "Team",
				locked: "no",
				name: "Oficial Rounds",
				sort: "desc",
				updatedAt: "2014-01-30T02:41:41.302Z",
				id: "52d82e9d672c2ccc04e0c775",
				scores: [...]
		*/
		makeTableHeader: function(table){
			console.log(table);
			var alignRight = 'text-right';
			var headers = {
				'rank': {
					value: table.headerRank,
					class: alignRight,
					style: 'width: 2%;',
				},
				'teamName': {
					value: table.headerTeam,
					style: 'width: 34%;',
				}
			};

			// Create dynamic score fields
			var percent = (100-40) / table.columns*1;
			for(var k = 0; k < table.columns*1; k++){
				headers['score'+k] = {
					value: table.headers.scores[k],
					class: alignRight,
					style: 'width: '+percent+'%;',
				};
			}

			headers['final'] = {
				value: table.headerFinal,
				class: alignRight,
				style: 'width: 4%;',
			};

			return headers;
		},

		/*
		Table Scores Example:
			scores: [
				{
					createdAt: "2014-01-24T03:53:58.687Z",
					scores: {
						1: {value: 213, data: {...}}
					},
					tableId: "52d82e9d672c2ccc04e0c775",
					teamId: "52d35c1e6bda8a5c8f8a22a9",
					updatedAt: "2014-01-24T03:54:02.213Z",
					id: "52e1e3d6dbb78102006b8397",
					final: 0.733663140097633,
					rank: 1,
					team: {
						category: "default",
						country: "LK",
						createdAt: "2014-01-13T03:23:10.011Z",
						name: "XLSd",
						updatedAt: "2014-02-07T09:52:40.193Z",
						id: "52d35c1e6bda8a5c8f8a22a9"
					}
				},
				{...}
			]
		*/
		makeTableContent: function(table){
			var content = [];
			var columns = table.columns*1;

			for(var s in table.scores){
				var score = table.scores[s];
				// Add dynamic attributes
				score.teamName = score.team.name;
				for(var c = 0; c < columns; c++){
					var scoreValue = (score.scores[c] ? score.scores[c].value : '-');
					score['score'+c] = scoreValue;
				}
				content.push(score);
			}

			return content;
		},

	});


	module.ConfigView = defaultModule.ConfigView.extend({

		template: JST['pageview-table.configView'],

		initialize: function(){
			// Setup model variables
			if(!this.model.has('options'))
				this.model.set('options', {});

			this.listenTo(this.model, 'change', this.render);
		},

		render: function(){
			var view = this;

			// If the fetch is not complete, return and call self render later
			var tables = module.getTables(function(){
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
				source: module.tablesKeys,
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