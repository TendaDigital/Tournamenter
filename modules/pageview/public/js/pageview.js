/*
	=======================================
				PAGEVIEWS
	=======================================
	PageViews will be used by the manager to configure,
	create, delete... and also by the public views.

	The idea is that every 'kind' of view, has
	it's own configuration panel, and it's renderer.

	When in the manager, it will create a Collection
	of Views fetch from server. Each View contain a
	collection of 'Pages'. Pages are actually
	PageViews, and represent a single 'Slide'
	on the presentation. They have properties
	such as 'still' time, 'enabled'...

	Each View, will have many 'Pages', and
	the model responsible for each Page, will be delegated
	to the module specified by it.

	Manager:
	 + ItemView 		| Represents a single Page item
	 + ItemBarView  	| A bar inside the ItemView
	 + ItemConfigView	| Configuration view

	Final View (TV Screen)
	 + ScreenView		| The final view to generate content
	 + ScreenConfigView | A optional sidebar view to customise view


	=======================================
					Extending
	=======================================
	The default adapter for pageviews is called 'pageview';

	In order to create other modules, you can use
	two aproaches: 
		1) Re-write everything (BAD)
		2) Overrided what's needed (GOOD)

	Off course numb. 2 is the best, and the code will be
	more maintainable.

	To 'extend' this default implementation, do like this:

	Modules.PageViews['myModuleName'] = _.extend(Modules.PageViews.pageview, {

		name: 'My New Name',
		module: 'myModuleName',
		disabled: false,

		// Perhaps, you just want to override the ConfigView
		ConfigView: [...]


	});

	// Or, you want to EXTEND it
	Modules.PageViews.myModuleName.ItemView = Modules.PageViews.pageview.extend({
		*
			Note that ItemView is defined with default BarView and
			ConfigView. In order to 'override' it use like this:
		*
		ConfigView: Modules.PageViews.myModuleName.ConfigView
	});


*/
(function () {

	var module = {
		name: 'Default View',
		module: 'pageview',
		disabled: true,
	};

	/*
		Specific Page Model
	*/
	module.model = Backbone.View.extend({});

	/*
		Public view

		There are some defaults methods available for view controllers

			estimateTime
				Returns the estimated time to show this page

			disabled
				Returns if this view is disabled (should not be shown)

		Some events that are triggered externally:

			show:before
				Before showing view. Use this to pre-render stuff and prepare view

			show:after, show
				Sent one after other, usefull for triggering show actions on the view

			hide:before
				Before starting to hide, this is triggered

			hide:after, hide
				After hiding animation complete. Use this to stop animations, ...

	*/
	module.view = Backbone.View.extend({
		template: JST['pageview.view'],
		
		_initialize: function(){
			// this.on('all', this.logAction);
			this.on('hide show', this.saveState, this);
			this.listenTo(this.model, 'destroy', this.destroy);
			this.listenTo(this.model, 'change:disabled', this.changeVisibility);
			// this.$el.addClass('match');
		},

		initialize: function(){
			this._initialize();
		},

		changeVisibility: function(evt){
			if(this.disabled()) this.$el.hide();
			else this.$el.show();
		},

		estimateTime: function(){
			// Still time are saved in secconds
			var still = this.model.get('still')*1000 || 3000;
			return still;
		},

		disabled: function(){
			var disabled = (this.model.get('disabled') == 'true' ? true : false);
			return disabled;
		},

		render: function(){
			this.$el.html(this.template({}));

			return this;
		},

		destroy: function(){
			this.$el.remove();
		},
	});

	module.BarView = Backbone.View.extend({
		template: JST['pageview.barView'],

		events: {
			'click .btn-page-destroy': 'confirmDestroyAction'
		},

		render: function(){
			var dict = {
				resume: this.resume(),
				title: this.itemView.module.name || '-',
			};

			this.$el.html( this.template(dict));

			this.makeEditable();
		},

		resume: function(){
			var still = this.model.get('still');
			var time = Math.round(still / 100) / 10;
			var active = (this.model.get('disabled') ? 'Hidden' : 'Active');
			return '[ '+time+'s, '+active+' ]';
		},

		makeEditable: function(){
			var self = this;

			var $still = this.$('.page-still');
			App.Mixins.editInPlace(this.model, $still, {
				mode: 'popup',
				value: this.model.get('still'),
				emptytext: 'Automatic',
				display: function(value){
					if(value)
						$(this).text(value + 's');
				}
			});

			var $disabled = this.$('.page-disabled');
			$disabled.button();
			
			function refreshBtn(){
				if(self.model.get('disabled') == 'true'){
					console.log('Btn State H: '+self.model.get('disabled'));
					$disabled.text('Hidden');
					$disabled.toggleClass('active', true);
					$disabled.toggleClass('btn-success', false);
					$disabled.toggleClass('btn-danger', true);
				}else{
					console.log('Btn State S: '+self.model.get('disabled'));
					$disabled.text('Showing');
					$disabled.toggleClass('active', false);
					$disabled.toggleClass('btn-success', true);
					$disabled.toggleClass('btn-danger', false);
				}
			}

			refreshBtn();
			$disabled.click(function(){
				var $this = $(this);
				var disabled = $this.hasClass('active') ? 'false' : 'true';
				console.log('Disabled: '+disabled);
				self.model.set('disabled', disabled);
				self.model.save({}, {
					patch: true,
					wait: true,
				});
				refreshBtn();
			});

			// App.Mixins.editInPlace(this.model, $disabled, {
			// 	type: 'select',
			// 	mode: 'popup',
			// 	source: [{value: 'true', text: 'Hidden'}, {value: 'false', text: 'Visible'}],
			// 	value: this.model.get('disabled'),
			// });

			return this;
		},

		confirmDestroyAction: function(evt){
			var view = this;
			var message = 'Are you shure that you want to delete this page?';
			App.Mixins.confirmAction(message, true, function(){
				
				view.itemView.$el.slideUp(function(){
					view.model.destroy();
				});

			});
		},
	});

	module.ConfigView = Backbone.View.extend({
		/*
			This is a HELPER method, used to simplify save under options hash.
			It is really usefull for ediding fields dinamicaly

			Assign an callback to be run BEFORE the save call, and it will
			return a method that takes two arguments:
			 + values (new values to save)
			 + next (used internally, to callback with or without errors)

			Ex:

			App.Mixins.editInPlaceCustom($editable, {
				type: 'select2',
				mode: 'popup',
				[...]
			}, this.createSaveWrapper(function(options, newVals){
				return options['tables'] = _.values(newVals.value);
			}));
		*/
		createSaveWrapper: function(cb){
			var view = this;
			return function(values, next){
				var lastOptions = view.model.get('options');

				// Delegate modifications to callback
				var newOptions = cb(lastOptions, values);
				// console.log({
				// 	options: newOptions
				// });
				view.model.save({
					options: newOptions
				}, {
					success: function(){ next(); },
					error: function(){ next('Could not save tables'); }
				});
			}
		}, 
		/*
			Another helper method used to simplify things.

			This creates a Wrapper of a Wrapper.
			Example:
			App.Mixins.editInPlaceCustom($editable, {
				type: 'select2',
				mode: 'popup',
				[...]
			}, this.createSaveWrapper('tables'));
		*/
		createSaveWrapperForField: function(field){
			return this.createSaveWrapper(function(options, values){
				options[field] = values.value;
				// console.info(options);
				return options;
			});
		},

		saveField: function(field, value, next){
			var view = this;
			var options = view.model.get('options');
			options[field] = value;

			view.model.save({
				options: options
			}, {
				success: function(){ next && next(); },
				error: function(){ next && next('Could not save tables'); }
			});
		},

	});

	module.ItemView = Backbone.View.extend({

		tagName: 'div',
		className: 'panel',
		template: JST['pageview.itemView'],

		/*
			Views responsibles for rendering the bar, and the Config bar

			Note that 'BarView' and 'ConfigView' is a overridable option,
			in case you want to override them.
		*/
		BarView: module.BarView,
		ConfigView: module.ConfigView,

		/*
			Instantied views from 'BarView' and 'configView'
			(Use LOCALLY only. Do not try to override)
		*/
		barView: null,
		configView: null,

		initialize: function(){
			// Find proper module
			var moduleId = this.model.get('module');
			this.module = Modules.PageViews[moduleId] || Modules.PageViews['pageview'];
			
			// Initialize sub-views
			var opts = {
				model: this.model,
			};
			this.barView = new this.BarView(opts);
			this.configView = new this.ConfigView(opts);

			// Inject this view
			this.barView.itemView = this;
			this.configView.itemView = this;

			// console.log(opts);
		},

		render: function(){

			// Render itself
			this.$el.html(this.template());

			if(this.model.get('disabled') == 'true')
				this.$el.addClass('panel-default');
			else
				this.$el.addClass('panel-success');

			// Set elements and render
			this.barView.setElement(this.$('.spot-bar-view')).render();
			this.configView.setElement(this.$('.spot-config-view')).render();

			// Make configView collapsible
			// Util.makeCollapsible(this.$('.btn-collapse-options'), this.$('.collapse-options'), {
			// 	showData: '<span class="caret"></span> Show Options',
			// 	hideData: 'Hide Options',
			// });

			return this;
		},

	});

	// Register in modules
	(Modules.PageViews = Modules.PageViews ? Modules.PageViews : {})[module.module] = module;

})();