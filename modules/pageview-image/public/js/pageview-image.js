/*
	=======================================
				PAGEVIEWS IMAGE
	=======================================

	An extension of default PAGEVIEW.

	This will configure and Images

*/
(function () {

	// Get default pageview module to extend
	defaultModule = _.clone(Modules.PageViews['pageview']);

	// Extend default pageview
	var module = _.extend(defaultModule, {
		name: 'Image View',
		module: 'pageview-image',
		disabled: false,
	});


	/*
		Public view Class that will render, update and animate
		tables
	*/
	module.view = defaultModule.view.extend({
		
		initialize: function(){
			// Call super constructor
			this._initialize();
			console.info('pageview-image created');

			this.listenTo(this.model, 'change:options', this.render);
		},

		render: function(){
			var options = this.model.get('options');

			var $img = $('<img>');
			$img.prop('src', options.file);
			this.$el.html($img);
			this.$el.addClass('text-center');

			var sizes = {
				small: '50%',
				medium: '70%',
				big: '100%',
			}
			var height = sizes[options.size] || sizes.medium;

			// Give time to update DOM
			setTimeout(function(){
				$img.addClass('img-rounded box-shadow');
				$img.css('position', 'relative');
				$img.css('top', '50%');
				$img.css('height', height);
				// $img.css('left', '50%');
				$img.css('marginTop', -$img.height()/2);
				// $img.css('marginLeft', -$img.width()/2);
			}, 1);
		},

	});


	module.ConfigView = defaultModule.ConfigView.extend({

		template: JST['pageview-image.configView'],

		initialize: function(){
			// Setup model variables
			if(!this.model.has('options'))
				this.model.set('options', {});

			this.listenTo(this.model, 'change:options', this.optionsChanged);

			this.listenTo(this.model, 'change', this.render);
		},

		render: function(){
			var view = this;
	
			// Render view
			this.$el.html(this.template());
			this.$el.addClass('panel-body');

			// Initialize edit fields
			this.configureEditFields();

			// Initialize view with options
			this.optionsChanged();

			return this;
		},

		optionsChanged: function(){
			var options = this.model.get('options');

			this.$('.img-thumbnail').prop('src', options.file);
		},

		configureEditFields: function(){
			var view = this;

			// Editable options for image size
			$size = this.$('.config-size');
			App.Mixins.editInPlaceCustom($size, {
				type: 'select',
				mode: 'popup',
				source: [
					{value: null,     text: 'Automatic'},
					{value: 'small',  text: 'Small'},
					{value: 'medium', text: 'Medium'},
					{value: 'big',    text: 'Big'},
				],
				// source: module.tablesKeys,
				showbuttons: true,
				value: view.model.getOption('size'),
				emptytext: 'Automatic',
			}, this.createSaveWrapperForField('size'));

			this.initializeUpload();

			return this;
		},

		initializeUpload: function () {
			var self = this;

			var $uploadField = this.$('.upload-file');

			$uploadField.change(function () {

				self.readFile(this, afterSelectFile)
				console.log(this.files);
			});

			function afterSelectFile(error, file){
				self.model.setOption('file', file);
				self.model.save();
			}
		},

		readFile: function (element, next) {
			if(!element.files || !element.files[0] ) return next('No file');

			var FR= new FileReader();
			FR.onload = function(e) {
				console.log(e);
				next(null, e.target.result);
			};       
			FR.readAsDataURL( element.files[0] );
		},

	});

	module.ItemView = defaultModule.ItemView.extend({
		ConfigView: module.ConfigView,
	});

	// Register in modules
	(Modules.PageViews = Modules.PageViews ? Modules.PageViews : {})[module.module] = module;

})();