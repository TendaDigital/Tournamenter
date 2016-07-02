/*
	=======================================
				PAGEVIEWS BRACKET
	=======================================

	An extension of default PAGEVIEW.

	This will configure and show brackets

*/
(function () {

	// Get default pageview module to extend
	defaultModule = _.clone(Modules.PageViews['pageview']);

	// Extend default pageview
	var module = _.extend(defaultModule, {
		name: 'Bracket View',
		module: 'pageview-bracket',
		disabled: false,
	});


	/*
		Public view Class that will render, update and animate
		brackets
	*/
	module.view = defaultModule.view.extend({
		template: JST['pageview-bracket.layout'],

		initialize: function(){
			// Call super constructor
			this._initialize();
			this.listenTo(this.model, 'change:options', this.render);

			// this.on('show:before', this.updateTables, this);
			this.on('show:before', this.prepare, this);
			// this.on('show:skip', this.prepare, this);
			this.on('show:after', 	this.show, this);
			this.on('hide', 		this.hide, this);
			
			this.$el.addClass('pageview-bracket');
		},

		prepare: function(){
			// Render always before showing
			this.render();
		},

		/*
			Helper functions
		*/
		initied: false,
		render: function(){
			// Get Page options and data
			var options = this.model.get('options');
			var bracket	= options.data;

			this.$el.html(this.template({}));

			$bracket = this.$('.bracket-container');
			try{

				$bracket.bracket({
					init: bracket,
					// save: function(){}
				});
				
			}catch(e){
				console.log('Failed to render bracket. Continuing...');
			}

			// Configure bracket`s position
			$bracket.css('marginLeft', '-'+$bracket.width()/2+'px');
			$bracket.css('marginTop', '-'+$bracket.height()/2+'px');
		},

		show: function(){
		},

		hide: function(){
		},

	});


	module.ConfigView = defaultModule.ConfigView.extend({

		template: JST['pageview-bracket.configView'],

		initialize: function(){
			// Setup model variables
			if(!this.model.has('options'))
				this.model.set('options', {});

			// this.listenTo(this.model, 'change', this.render);
		},

		render: function(){
			var view = this;
			console.log('rendering...' + (this.$el.html().trim()?1:0));
				
			// Render view
			if(!this.$el.html().trim()){
				this.$el.html(this.template());
				this.$el.addClass('list-group');
			}

			var container = this.$('.bracket-container');
			container.empty();

			setTimeout(function(){

				container.bracket({
					init: view.model.get('options').data,
					save: function(data){
						view.saveField('data', data);
					}
				});

			}, 50);

			/* You can also inquiry the current data */
			// var data = container.bracket('data')
			// $('#dataOutput').text(jQuery.toJSON(data))

			// Initialize edit fields
			this.configureEditFields();

			return this;
		},

		save: function(){
			console.log('save');
		},

		configureEditFields: function(){
			var view = this;

			// // Editable options used for Tables
			// $tables = this.$('.config-tables');
			// App.Mixins.editInPlaceCustom($tables, {
			// 	type: 'select2',
			// 	mode: 'popup',
			// 	source: module.GroupsKeys,
			// 	showbuttons: true,
			// 	value: view.model.get('options').tables,
			// 	select2: {
			// 		multiple: false,
			// 		width: 200,
			// 		placeholder: 'Select Table',
			// 		allowClear: true,
			// 	},
			// }, this.createSaveWrapperForField('tables'));

			// Editable options used table items
			$title = this.$('.config-title');
			App.Mixins.editInPlaceCustom($title, {
				type: 'text',
				// mode: 'inline',
				// showbuttons: true,
				value: view.model.get('options').title,
				// emptytext: 'n',
			}, this.createSaveWrapperForField('title'));

			// // Editable options used table items
			// $still = this.$('.config-still');
			// App.Mixins.editInPlaceCustom($still, {
			// 	type: 'text',
			// 	mode: 'popup',
			// 	showbuttons: true,
			// 	value: view.model.get('options').still,
			// 	emptytext: 'Automatic',
			// 	validate: function(value) {
			// 		if(!value)
			// 			return;
			// 		value = value*1;
			// 		if(!_.isNumber(value) || value < 1)
			// 			return 'It must be bigger than 1!';
			// 	},
			// 	display: function(value){
			// 		$(this).text(value ? value + 's' : value);
			// 	}
			// }, this.createSaveWrapperForField('still'));

			return this;
		}
	});

	module.ItemView = defaultModule.ItemView.extend({
		ConfigView: module.ConfigView,
	});

	// Register in modules
	(Modules.PageViews = Modules.PageViews ? Modules.PageViews : {})[module.module] = module;

})();