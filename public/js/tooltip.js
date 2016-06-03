/**
 * @module Tooltip
 * @author javier.rocamora@gmail.com
 * Attaches a tooltip to an element.
 */

// UMD standard code
(function (root, factory) {
	if (typeof define === "function" && define.amd) {
		define(factory);
	} else if (typeof exports === "object") {
		module.exports = factory();
	} else {
		root.Tooltip = factory();
	}
}(this, function () {
	"use strict";

	/**
	 * Constructor for TooltipClass
	 * @class Every tooltip is an instance of TooltipClass
	 * TODO : Class could be in a separated file
	 */
	function TooltipClass (element) {
		this.element = element;
		// Default config
		this.config = {
			position: 'auto',
			class: '',
			orientation: '',
			showOn: 'hover',
			closeIcon: true
		};

		// Will contain the tooltip DOM Node
		this.node = null;
		this.arrow = null;
	}

	var arrowSize = 10;  // px

	/** Override default options. Probably there's a better way to do this
	 * @params {object} options An object with the options for the tooltip, possible options are:
	 *  @config {string} [position='auto'] - 'auto' will position the tooltip (absolute) centered close to the element attached to
	 * 					Also normal position values are accepted (relative, absolute, static or fixed)
	 *  @config {string} [class] - Extra class for custom styling
	 *  @config {string} [orientation='top'] - top, bottom, left or right
	 *  @config {string} [showOn='load'] - load|hover|click|... Load will show it from the beginning
	 *  @config {boolean} [closeIcon=true] - If to show Close icon on the tooltip
	 *  @config {boolean} [persistent=false] - If tooltip should stay when clicking outside. False by default, except for showOn=load
	 */
	TooltipClass.prototype.setOptions = function (options) {
		var config = this.config;
		if (options) {
			if(options.class) {
				config.class = options.class;
			}
			if(options.orientation) {
				config.orientation = options.orientation;
			}
			if(options.position) {
				config.position = options.position;
			}
			if(options.showOn) {
				config.showOn = options.showOn;
			}
			if(options.closeIcon !== undefined) {
				config.closeIcon = options.closeIcon;
			}
			if(options.text) {
				config.text = options.text;
			}
			// Let's assume an onLoad should be persistent
			if(options.showOn === "load") {
				config.persistent = true;
			}
			if(options.persistent) {
				config.persistent = options.persistent;
			}
		}
	};


	/**
	 * Creates the tooltip node, to be inserted on the DOM. Includes arrow and close icon
	 */
	TooltipClass.prototype.createTooltipNode = function (text) {
		var tooltip = document.createElement("div"),
			arrow = document.createElement("div"),
			close = document.createElement("a"),
			config = this.config,
			self = this;

		tooltip.className = config.orientation + " tooltip "+ config.class;

		if (!text) {
			if (!config.text) {
				text = "This tooltip text must be set with title or data-tooltip attribute";
			}
			else {
				text = config.text;
			}
		}

		tooltip.innerHTML = text;

		if (config.closeIcon) {
			close.className = "close";
			close.href = "#";
			close.textContent = "✖";
			close.addEventListener('click', function(evt) {
				evt.preventDefault();
				evt.stopPropagation();
				self.hide();
			}, false);
			// == prepend
			tooltip.insertBefore(close, tooltip.childNodes[0]);
		}

		arrow.className = "arrow";
		tooltip.appendChild(arrow);

		// Make it focusable
		tooltip.tabIndex = -1;

		this.node = tooltip;
		this.arrow = arrow;

		return tooltip;
	};

	
	/**
	 * Automatically position tooltip, depending on orientation
	 */
	TooltipClass.prototype.absolutePositioning  = function () {
		var element = this.element;
		var elementRect = element.getBoundingClientRect(),
			tooltipWidth = this.node.clientWidth,
			tooltipHeight = this.node.clientHeight,
			tooltipTop, tooltipLeft;

		// TODO: test this value in normal DOM and replace with hardcoded one
		var offset = {
				top: 5,
				left: 5
			};

		switch(this.config.orientation) {
			case 'left':
				tooltipLeft = elementRect.left - tooltipWidth - arrowSize - 5;
				tooltipTop = elementRect.top - (tooltipHeight/2 - elementRect.height/2);
				break;
			case 'right':
				tooltipLeft = elementRect.left + tooltipWidth + arrowSize + 5;
				tooltipTop = elementRect.top - (tooltipHeight/2 - elementRect.height/2);
				break;
			case 'bottom':
				tooltipTop = elementRect.top + height + arrowSize + 5;
				tooltipLeft = elementRect.left - (tooltipWidth/2 - elementRect.width/2);
				break;
			case 'top':
			default:
				tooltipTop = elementRect.top - tooltipHeight - arrowSize - 5;
				tooltipLeft = elementRect.left - (tooltipWidth/2 - elementRect.width/2);
				break;
		}

		if(isSvgNode(element)) {
			offset = getSvgOffset(element);
		}

		this.node.style.top = tooltipTop - offset.top + "px" ;
		this.node.style.left = tooltipLeft - offset.left + "px" ;
	};


	/**
	 * Automatically position arrow for the tooltip, for tooltip position != 'auto'
	 * ONLY for orientation bottom/top. TODO for left/right
	 */
	TooltipClass.prototype.arrowAutoPositioning = function () {

		var left = this.element.offsetLeft,
			width = this.element.clientWidth;

		if (this.config.orientation === "top" || this.config.orientation === "bottom") {
			this.arrow.style.left = (left + width/2 - this.node.offsetLeft) + "px";
		}
	};


	/**
	 * Attach event to the element to show the tooltip
	 */
	TooltipClass.prototype.attachEvents = function () {

		var self = this,
			element = this.element,
			config = this.config;

		// Create closure on event handlers, also useful for detaching the events when destroying the tooltip
		self.listenerShow = function (evt) {
			evt.preventDefault();
			evt.stopPropagation();
			self.show();
		};
		self.listenerHide = function (evt) {
			evt.preventDefault();
			evt.stopPropagation();
			self.hide();
		};

		if (config.showOn === "hover") {
			element.addEventListener('mouseover', this.listenerShow, false);
			element.addEventListener('mouseout', this.listenerHide, false);
		} else {
			if(config.showOn !== "load" ) {
				// Standard event
				element.addEventListener(config.showOn, this.listenerShow, false);
			}
			if (!config.persistent) {
				this.node.addEventListener('blur', this.listenerHide, true);
			}
		}

	};


	/**
	 * Show the tooltip. This creates the node every time is called.
	 */
	TooltipClass.prototype.destroyEvents = function () {
		var config = this.config;

		if (config.showOn === "hover") {
			this.element.removeEventListener('mouseover', this.listenerShow, false);
			this.element.removeEventListener('mouseout', this.listenerHide, false);
		} else if (config.showOn === "focus") {
			this.element.removeEventListener('focus', this.listenerShow, false);
			this.element.removeEventListener('blur', this.listenerHide, false);
		} else if (config.showOn !== "load") {
			this.element.removeEventListener(config.showOn, this.listenerShow, false);
			document.body.removeEventListener('click', this.bodyClickListener, false);
		}
	};

	/**
	 * Show the tooltip. Uses visibility instead of display, to correct calculation of position.
	 */
	TooltipClass.prototype.show = function () {
		this.node.style.visibility = "visible";
		// Can't focus on an invisible element
		this.node.focus();
	};

	/**
	 * Hides the tooltip. If was set on load, destroys the tooltip.
	 */
	TooltipClass.prototype.hide = function () {
		if (this.config.showOn === "load") {
			this.destroyEvents();
			getTooltipContainer(this.node).removeChild(this.node);
		} else {
			this.node.style.visibility = "hidden";
		}
	};


	/********  End of TooltipClass **********/





	/*
	 * Tooltip Module: A factory that returns an object of type TooltipClass
	 */

	// Object module to return
	var Tooltip = {};

	// Keep a reference to all created tooltips
	var existingTooltips = [];

	/*
	 * Creates a tooltip next to an element
	 * @return {TooltipClass} - Tooltip object.
	 */
	Tooltip.create = function (element, options) {
		if (!element) {
			console.error("Tooltip: Invalid element, needs a DOM Node as 1st argument");
			return null;
		}
		if (!isVisible(element)) {
			console.error("Tooltip: Can't attach a tooltip to an invisible element ->", element );
			return null;
		}

		// Does the tooltip already exist ? If so, remove it, we don't want tooltip-spamming
		var parent = getTooltipContainer(element);
		var existing = parent.querySelector(".tooltip");
		if (existing) {
			// console.log("Tooltip: Already existing tooltip on element. Caller should use Tooltip.destroy before adding new one -> ", element );
			parent.removeChild(existing);
		}

		var tooltip = new TooltipClass(element);
		tooltip.setOptions (options);

		tooltip.createTooltipNode(element.getAttribute('title'));

		// Attach to the element, as a sibling in the DOM
		getTooltipContainer(element).appendChild(tooltip.node);

		if(tooltip.config.showOn === 'load') {
			tooltip.show();
		} else {
			tooltip.hide();
		}
		tooltip.attachEvents();

		if (tooltip.config.position === 'auto') {
			tooltip.absolutePositioning();
		} else {
			tooltip.arrowAutoPositioning();
		}

		existingTooltips.push(tooltip);

		return tooltip;
	};


	/*
	 * Destroys the tooltip and removes the events
	 */
	Tooltip.destroy = function (tooltip) {
		nullifyTooltip(tooltip);
		existingTooltips.pop(tooltip);
	};
	/* Separated function to avoid loop problems on the array */
	function nullifyTooltip (tooltip) {
		tooltip.destroyEvents();
		if (tooltip.node.parentNode) {
			tooltip.node.parentNode.removeChild(tooltip.node);	
		}
	}

	/*
	 * Helper function to remove all active tooltips
	 */
	Tooltip.destroyAll = function () {
		existingTooltips.forEach(nullifyTooltip);
		existingTooltips = [];
	};



	/**
	 *  Check if element is visible on the page
	 */
	function isVisible(elem) {
		if (isSvgNode(elem)) return (getComputedStyle(elem).display !== "none");
		return elem.offsetWidth > 0 || elem.offsetHeight > 0;
	}

	function isSvgNode (node) {
		return node instanceof SVGElement;
	}

	/*
	 * Get the top/left offset of a node relative to the SVG container.
	 */
	function getSvgOffset (node){
		if (!isSvgNode(node)) return null;

		var rect = node.getBoundingClientRect();
		return {
			top: rect.top -node.y1.baseVal.value,
			left: rect.left - node.x1.baseVal.value
		}
	}

	/*
	 * Usually this would be the parent node. On SVG is parent of the root element.
	 * @param node The element that we want to attach the tooltip to
	 */
	function getTooltipContainer (node) {
		return isSvgNode(node) ?
				node.ownerSVGElement.parentNode :
				node.parentNode;
	}


	/* Init tooltip by default for elements with data-tooltip attributes 
	 * data-tooltip is expected to have a hardcoded JSON object
	 */
	var elements = document.querySelectorAll ("[data-tooltip]");
	for (var i= 0, len = elements.length; i < len; i++) {
		var config = elements[i].getAttribute("data-tooltip");
		if (config) {
			config = JSON.parse(config);
		} else {
			config = undefined;
		}

		Tooltip.create(elements[i], config);
	}

	return Tooltip;
}));