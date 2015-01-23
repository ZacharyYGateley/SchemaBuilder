
/*
 * SchemaBuilder
 * Define within an IIFE so as to keep our scope limited
 * without polluting the global namespace.
 * @returns SchemaBuilder constructor
 */
var SchemaBuilder = window.SchemaBuilder = (function() {
	/**
	 * Class Panel
	 * Panel objects contain the DOM elements and all field information
	 * for the a schema.
	 * @parameter Object options
	 * 		@required SchemaBuilder builder
	 * 		@required JSONString options.schema
	 * 		@optional Object metrics
	 * 			metrics.x, .y
	 */
	var Panel = function(options) {
		// The SchemaBuilder this Panel belongs to
		this.builder = options.builder;
		
		// Initialize schema
		this.schema = null;
		if (typeof options.schema === 'string') {
			// Parse JSON string
			this.schema = JSON.parse(options.schema);
		}
		else if (typeof options.schema === 'object') {
			// Assume JSON blob already
			// Deep copy
			this.schema = JSON.parse(JSON.stringify(options.schema));
		}
		
		// Default properties
		this.element = null;
		options.metrics = options.metrics || {};
		this.x = options.metrics.x || 20;
		this.y = options.metrics.y || 20;
		this.offset = null;
		this.mouseDownClosure = this.mouseMoveClosure = this.mouseUpClosure = null;
		
		this.init();
	}
	
	/*
	 * mouseDown
	 * Allow to drag and drop panels
	 * Invoked onmousedown/touchstart
	 * Called from Panel object
	 */
	Panel.prototype.mouseDown = function(e) {
		// Already dragging, cancel
		if (this.offset !== null) {
			return;
		}
		
		e = e || window.event;
		var target = e.target || e.srcElement;
		// No processing on form field
		if (target.nodeType === 1 && 
				(target.tagName === 'input' ||
				 target.tagName === 'select')) {
			return;
		}
		// No processing on right click
		if (typeof e.button !== 'undefined' && e.button !== 0) {
			return;
		}
		e.preventDefault && e.preventDefault();
		
		// For multi-touch events, the guts are in e.touches array
		// We are only concerned with the first touch
		if (e.touches && e.touches.length > 0) {
			e = e.touches[0];
		}
		
		// Record mouse offset
		//var metrics = this.getMetrics();
		metrics = {
			x: parseInt(this.element.style.left),
			y: parseInt(this.element.style.top)
		};
		this.offset = {
			x: e.clientX - metrics.x,
			y: e.clientY - metrics.y
		};
		
		// Add temporary global events to body
		var bdy = document.getElementsByTagName('body')[0] || document.body || document.documentElement;
		SchemaBuilder.addEvent(bdy, 'mousemove', this.mouseMoveClosure);
		SchemaBuilder.addEvent(bdy, 'touchmove', this.mouseMoveClosure);
		SchemaBuilder.addEvent(bdy, 'mouseup', this.mouseUpClosure);
		SchemaBuilder.addEvent(bdy, 'touchend', this.mouseUpClosure);
		
		// Add some styyyyyle
		bdy.origCursor = bdy.style.cursor || 'auto';
		bdy.style.cursor = 'move';
	}
	
	// Move panel
	Panel.prototype.mouseMove = function(e) {
		// Not currently dragging
		if (this.offset === null) {
			// Should not get here
			// Make sure that dragging vars are cleared
			this.mouseUp(e);
			return;
		}
		
		e = e || window.event;
		e.preventDefault && e.preventDefault();
		
		// For multi-touch events, the guts are in e.touches array
		// We are only concerned with the first touch
		if (e.touches && e.touches.length > 0) {
			e = e.touches[0];
		}
		
		this.element.style.left = (e.clientX - this.offset.x)+'px';
		this.element.style.top = (e.clientY - this.offset.y)+'px';
	}
	
	// Place panel
	Panel.prototype.mouseUp = function(e) {
		// Remove global events
		var bdy = document.getElementsByTagName('body')[0] || document.body || document.documentElement;
		SchemaBuilder.removeEvent(bdy, 'mousemove', this.mouseMoveClosure);
		SchemaBuilder.removeEvent(bdy, 'touchmove', this.mouseMoveClosure);
		SchemaBuilder.removeEvent(bdy, 'mouseup', this.mouseUpClosure);
		SchemaBuilder.removeEvent(bdy, 'touchend', this.mouseUpClosure);
		
		// Remove some styyyyyle
		bdy.style.cursor = bdy.origCursor;
		
		// Remember current coordinates
		this.x = parseInt(this.element.style.left);
		this.y = parseInt(this.element.style.top);
		this.offset = null;
	}
	
	/*
	 * getMetrics
	 * Find the x and y position of el relative to BODY tag
	 * @parameter optional HTMLElement el default is this.builder.element
	 */
	Panel.prototype.getMetrics = function(el) {
		el = el || this.builder.element;
		
		var x = y = 0;
		x = el.offsetLeft;
		y = el.offsetTop;
		while (el.offsetParent) {
			el = el.offsetParent;
			x += el.offsetTop;
			y += el.offsetLeft;
		}
		
		return { x: x, y: y }
	}
	
	/*
	 * Panel.prototype.init
	 * Initialize panel elements
	 */
	Panel.prototype.init = function() {
		// Create DOM element structure
		var el = this.element = document.createElement('div');
		el.style.background = '#e1e1e1';
		el.style.border = '3px solid #000000';
		el.style[SchemaBuilder.getCSSRule('border-radius')] = '3px';
		el.style.position = 'absolute';
		el.style.left = this.x+'px';
		el.style.top = this.y+'px';
		el.style.minWidth = '100px';
		el.style.minHeight = '100px';
		// Add to DOM
		this.builder.element.appendChild(el);
		
		
		// Add events
		// Create closure so that events are called by this
		var closure = this.mouseDownClosure = (function(panel) {
			return function(event) {
				panel.mouseDown(event);
			};
		})(this);
		this.mouseMoveClosure = (function(panel) {
			return function(event) {
				panel.mouseMove(event);
			}
		})(this);
		this.mouseUpClosure = (function(panel) {
			return function(event) {
				panel.mouseUp(event);
			};
		})(this);
		// Only add event for mousedown/touchstart
		// Mousemove, mouseup, touchmove, touchend events added on the fly
		SchemaBuilder.addEvent(el, 'mousedown', closure);
		SchemaBuilder.addEvent(el, 'touchstart', closure);
	}
	
	/*
	 * SimpleField
	 * Simple form elements
	 * @parameter Object options
	 * 		@required String options.name
	 * 		@required [enum] options.type
	 */
	var SimpleField = function(options) {
		
	}
	SimpleField.STRING = 0;
	SimpleField.SELECT = 1;

	/**
	 * SchemaBuilder
	 * Constructor for schemaBuilder objects
	 */
	var SchemaBuilder = function(options) {
		this.panels = [];
		
		this.init(options);
	};

	/**
	 * Initialize schemaBuilder
	 * @parameter Object options
	 * 		@required String element ID of element
	 * 		@required JSONString schema
	 */
	SchemaBuilder.prototype.init = function(options) {
		this.element = options.element;
		if (typeof this.element === 'string') {
			document.getElementById(options.element);
		}
		
		// Get schema
		var schema = options.schema;
		if (typeof schema === 'string') {
			schema = JSON.parse(schema);
		}
		
		// Error check
		if (!this.element || typeof schema !== 'object') {
			return null;
		}
		
		// Initial panels
		for (prop in schema) {
			if (schema.hasOwnProperty(prop)) {
				schema[prop].builder = this;
				this.panels.push(
					new Panel(schema[prop])
					);
			}
		}
	}

	return SchemaBuilder;
})();

// Helper functions
SchemaBuilder.addEvent = function(object, event, handler) {
	if (object.addEventListener) {
		// Current standards
		object.addEventListener(event, handler, false);
	}
	else if (object.attachEvent) {
		// Older IE versions
		object.addEventListener('on'+event, handler);
	}
}
	
SchemaBuilder.removeEvent = function(object, event, handler) {
	if (object.removeEventListener) {
		// Current standards
		object.removeEventListener(event, handler, false);
	}
	else if (object.detachEvent) {
		// Older IE versions
		object.detachEvent('on'+event, handler);
	}
}

/*
 * getCSSRule
 * @parameter String cssRule
 * @returns String appropriately prefixed CSS rule
 */
SchemaBuilder.getCSSRule = function(cssRule) {
	// Camelize if currently hyphenated
	var st = cssRule.split('-');
	cssRule = '';
	for (var i = 0; i < st.length; i++) {
		cssRule += st[i].charAt(0).toUpperCase() + st[i].substr(1);
	}
	
	// Check for native support
	var bdy = document.getElementsByTagName('body')[0] || document.body || document.documentElement;
	var oCSSRule = cssRule;
	cssRule = cssRule.charAt(0).toLowerCase() + cssRule.substr(1);
	if (typeof bdy.style[cssRule] === 'string') {
		return cssRule;
	}
	
	// Check prefixes
	var prefixes = ['khtml', 'Moz', 'ms', 'o', 'webkit'];
	for (var i = 0; i < prefixes.length; i++) {
		cssRule = prefixes[i] + oCSSRule;
		if (typeof bdy.style[cssRule] === 'string') {
			return cssRule;
		}
	}
	
	// No support
	// Return original string
	return oCSSRule;
}
