/*
  	Copyright 2014 Ivan Seidel
  
	Light controll for animations and transitions

	When animating 'fromElement' to 'toElement', with options:
		$.transition(toElement, fromElement, options);
		$.transition(toElement, options);
		$.transition(toElement);

	When animating 'toElement', that is inside 'container', 
	this library will automatically try to find last element
	and set it as the fromElement:
		$('container').transition.to(toElement, options)
		$('container').transition.to(toElement)

	Note: Options will be saved to container, allowing you
	to use this method without any options. If you want to
	setup it your self, use:
		$('container').setup(options);

	This way, all transitions called from container, will
	have it's defaults options already set. Ex:

		$('container').transition.setup({
			visibleClass: 'myVisibleClass'
		});

		$('container').transition.to(element);

	To override options, use:
		$.transition.defaults.cssType = 'animation';

	This code was build with Modernizr and Bootstrap, and are
	only needed to allow the code to know witch eventName
	adequates the browser.
	Both options must be a string on:
		$.support.animation.end, or
		$.support.transition.end

*/
(function ( $ ){

	// Find out correct animation end event name (depends on browser)
	var animEndEventNames = {
			'WebkitAnimation' : 'webkitAnimationEnd',
			'OAnimation' : 'oAnimationEnd',
			'msAnimation' : 'MSAnimationEnd',
			'animation' : 'animationend'
	};
	// Save to global
	$.support.animation = {end: animEndEventNames[ Modernizr.prefixed('animation') ] };

	// Emulate event if not sent for a given time
	$.fn.emulateEvent = function (eventName, duration) {
		var called = false, $el = this
		$(this).one(eventName, function () { called = true })
		var callback = function () { if (!called) $($el).trigger(eventName) }
		setTimeout(callback, duration)
		return this
	}

	/*
		Helper function used to get jQuery view inside view object, or return view itself
		It also checks if the view has it's saved values, if not, then save it
	*/
	var saveClass = function(view){
		if(!view) return;
		// If not saved, save it
		if(!view.data('originalClassList'))
			view.data('originalClassList', view.attr( 'class' ));
		return view;
	};

	/*
		Restore view default classes 
	*/
	var restoreClass = function(view){
		if(!view) return;
		// Restore
		view.attr('class', view.data('originalClassList'));
		return view;
	};

	/*
		Transition method
	*/
	$.transition = function(to, from, options){
		// Adequate for multy param types
		if(!options) {
			options = from;
			from = null;
		}

		// jQueryfy elements (allow usage as strings)
		if(to) 	 to = $(to);
		if(from) from = $(from);

		// If the same element is being animated, call the callback and return
		if(to && from && to.get(0) === from.get(0)){
			return onEnd();
		}

		// console.log('-----------');
		// console.log(to ? to.get() : null);
		// console.log(from ? from.get() : null);
		// console.log('-----------');


		// Set defaults to options
		options = $.extend({}, $.transition.defaults, options);
		
		// saveClass
		if(options.saveClass && from) 	saveClass(from);
		if(options.saveClass && to) 	saveClass(to);
		// restoreClass from class
		if(options.restoreClass && to )   restoreClass(to).addClass(options.visibleClass);
		if(options.currentClass && to )   to.addClass(options.currentClass);
		if(options.restoreClass && from ) restoreClass(from).addClass(options.visibleClass);

		// Get event name to listent to
		var eventName = $.support[options.cssType].end;

		if(!options.animate){
			return onEnd();
		}

		// Set animation properties
		if(from){
			from//.off( eventName )
				.addClass( options.outClass )
				.one( eventName, onEnd )
				.emulateEvent(eventName, options.timeout );
		}

		if(to){
			  to//.off( eventName )
				.addClass( options.inClass )
				.one( eventName, onEnd )
				.emulateEvent(eventName, options.timeout );
		}

		var cbCount = 0;
		var cbTarget = (from ? from.length: 0) + (to ? to.length : 0);
		function onEnd(){
			// console.log('c: '+(cbCount+1)+' t: '+cbTarget);
			// console.log(evt);
			if(++cbCount != cbTarget) return;

			// Restor classes, and set visible and invisible class to elements
			if(options.restoreClass && from) 	restoreClass(from);
			if(options.restoreClass && to)		restoreClass(to);

			if(options.visibleClass && to)		to.addClass(options.visibleClass);
			if(options.currentClass && to )   	to.addClass(options.currentClass);
			if(options.invisibleClass && from)	from.addClass(options.invisibleClass);

			if(options.onEnd) options.onEnd();
		}

		// If no from or to is set, let's trigger it anyway (async)
		if(cbTarget <= 0) setTimeout(onEnd, 0);
	}

	// Default options for transitions
	$.transition.defaults = {
		// Callback
		onEnd: null,
		// Class that will be added to 'from' element
		outClass: 'pt-page-moveToRight',
		// Class that will be added to 'to' element
		inClass: 'pt-page-moveFromLeft',
		// Set to true, if class will be saved (if not saved yet) into element's data
		saveClass: true,
		// Set to true, if, at the START and END, the class will be restored
		restoreClass: true,
		// Class that will be added to 'to' element after end
		visibleClass: 'pt-page-current',
		// Class that will be added to 'current' element
		currentClass: 'item-active',
		// Class that will be added to 'from' element after end
		invisibleClass: '',
		// Timeout for animations
		timeout: 3000,
		// Type of animation ( animation|transition )
		cssType: 'animation',
		// If should or not animate (set to false to just change instantly)
		animate: true,
	};


	$.fn.transition = {};
	// Setup the container to allow automatic transition
	$.fn.transitionSetup = function(options, notOverride){
		$this = $(this);
		if(!notOverride || $this.data('transitionOptions'))
			$this.data('transitionOptions', options);
	}

	$.fn.transitionTo = function(next, options){
		var $this = $(this);
		// Get options
		options = $.extend({}, $.transition.defaults, $this.data('transitionOptions'), options);

		// Try to get last element from saved, or elements with the visibleClass
		var $current = $this.transitionGetCurrent(options);
		if($current.length <= 0) $current = null;

		// If next is an number, we shall get the index element
		if(_.isNumber(next))
			next = $($this.children()[next]);

		$this.data('transitionLast', next);

		// Transitionate
		$.transition(next, $current, options);
	}

	$.fn.transitionNext = function(options){
		var $this = $(this);
		// Get options
		options = $.extend({}, $.transition.defaults, $this.data('transitionOptions'), options);
		
		// Try to get last element from saved, or elements with the visibleClass
		var $current = $this.transitionGetCurrent(options);

		// Get the next element. Try to get next element near current, otherwise, first
		var $next = ($current.length > 0 && $current.next() ? $current.next() : null);
		if(!$next || $next.length <= 0)
			$next = $this.children(':first');

		// Transitionate
		$this.transitionTo($next, options);
	}

	$.fn.transitionGetCurrent = function(options){
		var $this = $(this);
		// Get options
		options = $.extend({}, $.transition.defaults, $this.data('transitionOptions'), options);
		
		// Try to get last element from saved, or elements with the visibleClass
		return $this.data('transitionLast') || $this.children('.'+options.currentClass);
	}

}( $ ));

/*
	This controlls animations for Pages
*/
App.Views.PageTransitions = Backbone.View.extend({

	// Internal Flags
	isAnimating: false,
	endCurrPage: false,
	endNextPage: false,
	animEndEventNames: null,
	supportAnimation: false,

	initialize: function () {
		// Find out animation end callback name (depends on browser)
		var animEndEventNames = {
			'WebkitAnimation' : 'webkitAnimationEnd',
			'OAnimation' : 'oAnimationEnd',
			'msAnimation' : 'MSAnimationEnd',
			'animation' : 'animationend'
		};
		this.animEndEventName = animEndEventNames[ Modernizr.prefixed( 'animation' ) ];
		this.supportAnimation = Modernizr.cssanimations;
	},

	// The actual view being shown
	$currentView: null,

	/*
		Set the current page. With animations.
	*/
	changePage: function(next, options){
		var self = this;
		options = options || {};
		_.defaults(options, {
		// options = {
			outClass: 'pt-page-moveToLeft',
			inClass: 'pt-page-moveFromRight',

			force: false,
		});

		if(options.animation)
			_.extend(options, options.animation);

		// If we still animating, but not forcing, cancel change.
		if( this.isAnimating && !options.force)
			return false;
		this.isAnimating = true;
		
		var $currPage = this.$currentView;
		var $nextPage = (next ? this.saveView(next).addClass( 'pt-page-current' ) : null);

		if(!this.supportAnimation)
			return self.setPage($nextPage);

		this.trigger('start-animate');
		if($currPage){
			$currPage.addClass( options.outClass ).on( self.animEndEventName, function() {
				$currPage.off( self.animEndEventName );
				self.endCurrPage = true;
				checkEndAnimation();
			});
		}else{
			self.endCurrPage = true;
			checkEndAnimation();
		}

		if($nextPage){
			$nextPage.addClass( options.inClass ).on( self.animEndEventName, function() {
				$nextPage.off( self.animEndEventName );
				self.endNextPage = true;
				checkEndAnimation();
			} );
		}else{
			self.endNextPage = true;
			checkEndAnimation();
		}

		function checkEndAnimation(){
			if(self.endNextPage && self.endCurrPage)
				self.setPage($nextPage);
		}
	},

	/*
		Set the current page. No animations.
	*/
	setPage: function(view){
		// Check if jQuery object is inside view, or is the view object itself
		var $nextView = this.saveView(view);

		// Reset flags
		this.endCurrPage = false;
		this.endNextPage = false;

		// Check if views are different
		// if($nextView == this.$currentView)
			// return false;

		// Restore current view class if already set
		if(this.$currentView)
			this.restoreView(this.$currentView);

		// Set nextView as current, with restored css values
		if($nextView){
			this.restoreView($nextView);
			this.$currentView = $nextView.addClass('pt-page-current');
		}else{
			this.$currentView = null;
		}

		// Reset animate flag
		this.isAnimating = false;

		// Trigger change-page event
		this.trigger('page-change');
		return true;
	},

	/*
		Helper function used to get jQuery view inside view object, or return view itself
		It also checks if the view has it's saved values, if not, then save it
	*/
	saveView: function(view){
		if(!view) return null;
		// If not saved, save it
		if(!view.data('originalClassList'))
			view.data('originalClassList', view.attr( 'class' ));
		return view;
	},

	/*
		Restore view default classes 
	*/
	restoreView: function(view){
		if(!view) return null;
		// Restore
		var $view = this.saveView(view);
		$view.attr('class', $view.data('originalClassList'));
		return $view;
	},

	animations: {
		'moveToLeft': {
			outClass: 'pt-page-moveToLeft',
			inClass: 'pt-page-moveFromRight',
		},
		'moveToRight': {
			outClass: 'pt-page-moveToRight',
			inClass: 'pt-page-moveFromLeft',
		},
		'moveToTop': {
			outClass: 'pt-page-moveToTop',
			inClass: 'pt-page-moveFromBottom',
		},
		'moveToBottom': {
			outClass: 'pt-page-moveToBottom',
			inClass: 'pt-page-moveFromTop',
		},
		'fadeRight': {
			outClass: 'pt-page-fade',
			inClass: 'pt-page-moveFromRight pt-page-ontop',
		},
		'fadeLeft': {
			outClass: 'pt-page-fade',
			inClass: 'pt-page-moveFromLeft pt-page-ontop',
		},
		'fadeBottom': {
			outClass: 'pt-page-fade',
			inClass: 'pt-page-moveFromBottom pt-page-ontop',
		},
		'fadeTop': {
			outClass: 'pt-page-fade',
			inClass: 'pt-page-moveFromTop pt-page-ontop',
		},
		'moveToLeftFade': {
			outClass: 'pt-page-moveToLeftFade',
			inClass: 'pt-page-moveFromRightFade',
		},
		'moveToRightFade': {
			outClass: 'pt-page-moveToRightFade',
			inClass: 'pt-page-moveFromLeftFade',
		},
		'moveToTopFade': {
			outClass: 'pt-page-moveToTopFade',
			inClass: 'pt-page-moveFromBottomFade',
		},
		'moveToBottomFade': {
			outClass: 'pt-page-moveToBottomFade',
			inClass: 'pt-page-moveFromTopFade',
		},
		'moveToLeftEasing': {
			outClass: 'pt-page-moveToLeftEasing pt-page-ontop',
			inClass: 'pt-page-moveFromRight',
		},
		'moveToRightEasing': {
			outClass: 'pt-page-moveToRightEasing pt-page-ontop',
			inClass: 'pt-page-moveFromLeft',
		},
		'moveToTopEasing': {
			outClass: 'pt-page-moveToTopEasing pt-page-ontop',
			inClass: 'pt-page-moveFromBottom',
		},
		'moveToBottomEasing': {
			outClass: 'pt-page-moveToBottomEasing pt-page-ontop',
			inClass: 'pt-page-moveFromTop',
		},
		'scaleDownRight': {
			outClass: 'pt-page-scaleDown',
			inClass: 'pt-page-moveFromRight pt-page-ontop',
		},
		'scaleDownLeft': {
			outClass: 'pt-page-scaleDown',
			inClass: 'pt-page-moveFromLeft pt-page-ontop',
		},
		'scaleDownBottom': {
			outClass: 'pt-page-scaleDown',
			inClass: 'pt-page-moveFromBottom pt-page-ontop',
		},
		'scaleDownTop': {
			outClass: 'pt-page-scaleDown',
			inClass: 'pt-page-moveFromTop pt-page-ontop',
		},
		'scaleDownDown': {
			outClass: 'pt-page-scaleDown',
			inClass: 'pt-page-scaleUpDown pt-page-delay300',
		},
		'scaleDownUp': {
			outClass: 'pt-page-scaleDownUp',
			inClass: 'pt-page-scaleUp pt-page-delay300',
		},
		'moveToLeftWithScale': {
			outClass: 'pt-page-moveToLeft pt-page-ontop',
			inClass: 'pt-page-scaleUp',
		},
		'moveToRightWithScale': {
			outClass: 'pt-page-moveToRight pt-page-ontop',
			inClass: 'pt-page-scaleUp',
		},
		'moveToTopWithScale': {
			outClass: 'pt-page-moveToTop pt-page-ontop',
			inClass: 'pt-page-scaleUp',
		},
		'moveToBottomWithScale': {
			outClass: 'pt-page-moveToBottom pt-page-ontop',
			inClass: 'pt-page-scaleUp',
		},
		'scaleDownCenter': {
			outClass: 'pt-page-scaleDownCenter',
			inClass: 'pt-page-scaleUpCenter pt-page-delay400',
		},
		'rotateRightSideFirst': {
			outClass: 'pt-page-rotateRightSideFirst',
			inClass: 'pt-page-moveFromRight pt-page-delay200 pt-page-ontop',
		},
		'rotateLeftSideFirst': {
			outClass: 'pt-page-rotateLeftSideFirst',
			inClass: 'pt-page-moveFromLeft pt-page-delay200 pt-page-ontop',
		},
		'rotateTopSideFirst': {
			outClass: 'pt-page-rotateTopSideFirst',
			inClass: 'pt-page-moveFromTop pt-page-delay200 pt-page-ontop',
		},
		'rotateBottomSideFirst': {
			outClass: 'pt-page-rotateBottomSideFirst',
			inClass: 'pt-page-moveFromBottom pt-page-delay200 pt-page-ontop',
		},
		'flipOutRight': {
			outClass: 'pt-page-flipOutRight',
			inClass: 'pt-page-flipInLeft pt-page-delay500',
		},
		'flipOutLeft': {
			outClass: 'pt-page-flipOutLeft',
			inClass: 'pt-page-flipInRight pt-page-delay500',
		},
		'flipOutTop': {
			outClass: 'pt-page-flipOutTop',
			inClass: 'pt-page-flipInBottom pt-page-delay500',
		},
		'flipOutBottom': {
			outClass: 'pt-page-flipOutBottom',
			inClass: 'pt-page-flipInTop pt-page-delay500',
		},
		'rotateFall': {
			outClass: 'pt-page-rotateFall pt-page-ontop',
			inClass: 'pt-page-scaleUp',
		},
		'rotateOutNewspaper': {
			outClass: 'pt-page-rotateOutNewspaper',
			inClass: 'pt-page-rotateInNewspaper pt-page-delay500',
		},
		'rotatePushLeft': {
			outClass: 'pt-page-rotatePushLeft',
			inClass: 'pt-page-moveFromRight',
		},
		'rotatePushRight': {
			outClass: 'pt-page-rotatePushRight',
			inClass: 'pt-page-moveFromLeft',
		},
		'rotatePushTop': {
			outClass: 'pt-page-rotatePushTop',
			inClass: 'pt-page-moveFromBottom',
		},
		'rotatePushBottom': {
			outClass: 'pt-page-rotatePushBottom',
			inClass: 'pt-page-moveFromTop',
		},
		'rotatePushLeft': {
			outClass: 'pt-page-rotatePushLeft',
			inClass: 'pt-page-rotatePullRight pt-page-delay180',
		},
		'rotatePushRight': {
			outClass: 'pt-page-rotatePushRight',
			inClass: 'pt-page-rotatePullLeft pt-page-delay180',
		},
		'rotatePushTop': {
			outClass: 'pt-page-rotatePushTop',
			inClass: 'pt-page-rotatePullBottom pt-page-delay180',
		},
		'rotatePushBottomPull': {
			outClass: 'pt-page-rotatePushBottom',
			inClass: 'pt-page-rotatePullTop pt-page-delay180',
		},
		'rotateFoldLeft': {
			outClass: 'pt-page-rotateFoldLeft',
			inClass: 'pt-page-moveFromRightFade',
		},
		'rotateFoldRight': {
			outClass: 'pt-page-rotateFoldRight',
			inClass: 'pt-page-moveFromLeftFade',
		},
		'rotateFoldTop': {
			outClass: 'pt-page-rotateFoldTop',
			inClass: 'pt-page-moveFromBottomFade',
		},
		'rotateFoldBottom': {
			outClass: 'pt-page-rotateFoldBottom',
			inClass: 'pt-page-moveFromTopFade',
		},
		'moveToRightFadeUnfold': {
			outClass: 'pt-page-moveToRightFade',
			inClass: 'pt-page-rotateUnfoldLeft',
		},
		'moveToLeftFadeUnfold': {
			outClass: 'pt-page-moveToLeftFade',
			inClass: 'pt-page-rotateUnfoldRight',
		},
		'moveToBottomFadeUnfold': {
			outClass: 'pt-page-moveToBottomFade',
			inClass: 'pt-page-rotateUnfoldTop',
		},
		'moveToTopFadeUnfold': {
			outClass: 'pt-page-moveToTopFade',
			inClass: 'pt-page-rotateUnfoldBottom',
		},
		'rotateRoomLeftOut': {
			outClass: 'pt-page-rotateRoomLeftOut pt-page-ontop',
			inClass: 'pt-page-rotateRoomLeftIn',
		},
		'rotateRoomRightOut': {
			outClass: 'pt-page-rotateRoomRightOut pt-page-ontop',
			inClass: 'pt-page-rotateRoomRightIn',
		},
		'rotateRoomTopOut': {
			outClass: 'pt-page-rotateRoomTopOut pt-page-ontop',
			inClass: 'pt-page-rotateRoomTopIn',
		},
		'rotateRoomBottomOut': {
			outClass: 'pt-page-rotateRoomBottomOut pt-page-ontop',
			inClass: 'pt-page-rotateRoomBottomIn',
		},
		'rotateCubeLeftOut': {
			outClass: 'pt-page-rotateCubeLeftOut pt-page-ontop',
			inClass: 'pt-page-rotateCubeLeftIn',
		},
		'rotateCubeRightOut': {
			outClass: 'pt-page-rotateCubeRightOut pt-page-ontop',
			inClass: 'pt-page-rotateCubeRightIn',
		},
		'rotateCubeTopOut': {
			outClass: 'pt-page-rotateCubeTopOut pt-page-ontop',
			inClass: 'pt-page-rotateCubeTopIn',
		},
		'rotateCubeBottomOut': {
			outClass: 'pt-page-rotateCubeBottomOut pt-page-ontop',
			inClass: 'pt-page-rotateCubeBottomIn',
		},
		'rotateCarouselLeftOut': {
			outClass: 'pt-page-rotateCarouselLeftOut pt-page-ontop',
			inClass: 'pt-page-rotateCarouselLeftIn',
		},
		'rotateCarouselRightOut': {
			outClass: 'pt-page-rotateCarouselRightOut pt-page-ontop',
			inClass: 'pt-page-rotateCarouselRightIn',
		},
		'rotateCarouselTopOut': {
			outClass: 'pt-page-rotateCarouselTopOut pt-page-ontop',
			inClass: 'pt-page-rotateCarouselTopIn',
		},
		'rotateCarouselBottomOut': {
			outClass: 'pt-page-rotateCarouselBottomOut pt-page-ontop',
			inClass: 'pt-page-rotateCarouselBottomIn',
		},
		'rotateSidesOut': {
			outClass: 'pt-page-rotateSidesOut',
			inClass: 'pt-page-rotateSidesIn pt-page-delay200',
		},
		'rotateSlideOut': {
			outClass: 'pt-page-rotateSlideOut',
			inClass: 'pt-page-rotateSlideIn',
		}
	},

});