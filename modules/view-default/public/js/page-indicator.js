/*
	Light Page Indicator

	To listen to events:
		$('container').on('indicator.selectpage', myCallback);

	To update item count:
		$obj.indicate('items', 10);
		
	To update current index:
		$obj.indicate('index', 6);

	To update count and index:
		$obj.indicate(10, 6);

*/

(function( $ ) {
	var template = $('<li><a href="#"></a></li>');

	function createCallback(element, item){
		return function(evt){
			evt.preventDefault();
			element.trigger('indicator.selectpage', item);
		}
	}

	function setItems(element, items){
		// Remove extra items
		element.children().slice(items).fadeOut(function(){
			$(this).remove();
		});

		// Add new items
		for(var i = element.children().length; i < items; i++){
			var newElement = template.clone();
			element.append(newElement);
			newElement.click(createCallback(element, i));
		}
	};

	function setIndex(element, index){
		var $lis = element.children();
		$lis.removeClass('current');
		if(index >= 0) $lis.eq(index).addClass('current');
	};

	$.fn.indicate = function(action, value){
		$this = $(this);
		if(action == 'items') return setItems($this, value);
		if(action == 'index') return setIndex($this, value);
		setItems($this, action);
		setIndex($this, value);
	};

}( $ ));

/*
	Page indicator View
*/
var PageIndicator = Backbone.View.extend({

	page: -1,
	count: 0,

	initialize: function(){

	},

	render: function(){
		// var currentCount  = this.$el.length;
		var targetTotal = this.getCount();

		// Remove extra items
		var safe = 0;
		while(this.$el.children().length > targetTotal){
			this.removeElement();
			safe++;
			if(safe > 100) break;
		}
		// Add new items
		safe = 0;
		while(this.$el.children().length < targetTotal){
			this.addElement(this.$el.children().length);
			safe++;
			if(safe > 100) break;
		}

		// Reset current item classes
		var $lis = this.$el.children();
		$lis.removeClass('current');
		$lis.eq(this.getPage()).addClass('current');

		return this;
	},

	// Remove the element "el". If not set, will remove the last one
	removeElement: function(el){
		if(!el)
			el = this.$el.last();
		else
			el = $(el);

		el.fadeOut(el.remove);
	},

	addElement: function(index){
		var view = this;
		var element = $('<li><a href="#"></a></li>');
		this.$el.append(element);
		// Callback change action
		element.click(function(){
			view.trigger('selectpage:'+index, index);
			view.trigger('selectpage', index);
		});
		return element;
	},

	/*
		Getters and setters for Page and Count
	*/
	getPage: function(){
		if(_.isFunction(this.page))
			return this.page();
		return this.page;
	},
	setPage: function(page){
		this.page = page;
		this.render();
		this.trigger('setpage', this.getPage());
		return this;
	},

	getCount: function(){
		if(_.isFunction(this.count))
			return this.count();
		return this.count;
	},
	setCount: function(count){
		this.count = count;
		this.render();
		this.trigger('setcount', this.getCount());
		return this;
	}
});