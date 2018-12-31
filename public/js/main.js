
// TODO: Switch to ES6 + Babel
// TODO: Refactor this mess

var discardTestOver = 25000; // ms
var chartData = {
	// A labels array that can contain any sort of values
	labels: [],
	// Our series array that contains series objects or in this case series data arrays
	series: []
};

var urls;
var groups;
var chart;
// 2-dimensions array with all the tests received, each array 1st-level element corresponds with an url (line)
var currentTests = [];

// Threshold 3 sec
var thresholdLine = 3000;

// Nodes
var nodes = {
	daySelect    : document.querySelector('.filters-day-select'),
	monthSelect  : document.querySelector('.filters-month-select'),
	measureSelect: document.querySelector('.filters-measure-unit'),
	legend       : document.querySelector('.legend'),
	legendGroups : document.querySelector('.legend-groups'),
	notification : document.querySelector('.notification-text')
};


let localStorageAvailable = lSAvailable();

var firstTime = true;


function onZoom() {
	console.log(arguments);
}

/*
 * Create a new line chart object where as first parameter we pass in a selector
 * that is resolving to our chart container element. The Second parameter is the actual data object.
 */
function createChart() {
	if (!chart) {
		chart = new Chartist.Line('.loading-time-chart', chartData, {
			// Options
			axisY: {
				labelInterpolationFnc: function (value) {
					return value / 1000 + 's';
				}
			},
			lineSmooth: Chartist.Interpolation.simple({
				fillHoles: true
			}),
			low    : 0,
			// high: 20000
			plugins: [
				Chartist.plugins.ctGoalLine({
					value    : thresholdLine,
					className: 'dashed-line'
				})
				// Chartist.plugins.zoom({ onZoom: onZoom })
			]
		});


		// Listening for draw events that get emitted by the Chartist chart
		chart.on('draw', function (data) {
			if (data.type === 'line' || data.type === 'area') {
				data.element.animate({
					d: {
						// begin: 1000 * data.index,
						dur   : 1000,
						from  : data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
						to    : data.path.clone().stringify(),
						easing: Chartist.Svg.Easing.easeOutQuint
					}
				});

			// Add the possibility to click a point (single test) and visit the test results
			} else if (data.type === 'point') {

				addPointEvent(data.element._node, data.index);

			}

		});

		chart.on('created', function (context) {
			if (firstTime) {
				firstTime = false;
				addEvents(context.svg._node);
				loadSelectionFromLS();
			} else {
				applyGroupFilters();
			}
		});

	} else {
		chart.update(chartData);
		applyUrlFilters();
		applyGroupFilters();
	}
}


/*
 * Add a tooltip on a certain point in the graph with the test info
 */
function addTooltip(node) {
	var test = getTestFromSVGNode(node);

	// TODO: use template system or template string
	var template =
		'<ul>' +
			'<li>TotalTime: ' + test.firstView.totalTime / 1000 + 's</li>' +
			'<li>SpeedIndex: ' + test.firstView.speedIndex / 1000 + 's</li>' +
			'<li>VisuallyComplete: ' + test.firstView.visuallyComplete / 1000 + 's</li>' +
			'<li>TTFB: ' + test.firstView.ttfb / 1000 + 's</li>' +
			'<li>Location: ' + test.location + '</li>' +
		'</ul>' +
		'<a href=\'' + test.url + '\' target=\'_blank\'>Click for more details</a>';

	Tooltip.create(node, {showOn: 'load', closeIcon: false, text: template});
}


// Add click event to points in the line, to visit the test results
// TODO: EVENT DELEGATION
function addPointEvent(node, index) {

	// Identify which of the lines in the graph we're in
	var lineMatches = node.parentNode.getAttribute('class').match(/ct-series-([a-z])/);
	if (lineMatches[1]) {
		var lineIndex = lineMatches[1].charCodeAt(0) - 'a'.charCodeAt(0);
	}
	var currentTest = currentTests[lineIndex][index];
	// And set the Test id to be able to click it
	node.setAttribute('id', currentTest.id);
	var title = document.createElement('title');
	title.textContent = 'Click to see test details';
	node.appendChild(title);

	// Closure to save URL
	(function () {
		var url = currentTest.url;
		node.addEventListener('click', function () {
			window.open(url, '_blank');
		}, false);

	})();


}


/*
 * Having the SVG Point (actually 'line') in the graph, get the related test
 */
function getTestFromSVGNode(node) {

	// Identify which of the lines in the graph we're in
	var lineMatches = node.parentNode.getAttribute('class').match(/ct-series-([a-z])/);
	if (lineMatches[1]) {
		var lineIndex = lineMatches[1].charCodeAt(0) - 'a'.charCodeAt(0);
	}
	if (typeof lineIndex !== 'undefined') {
		return getTestById(node.id, lineIndex);
	}
	return null;
}


/*
 * Get a test by Id (and line/url index)
 */
function getTestById(id, lineIndex) {
	var tests = currentTests[lineIndex];
	for (var i = 0; i < tests.length; i++) {
		if (tests[i] && tests[i].id === id) {
			return tests[i];
		}
	}
	return null;
}


/*
 * Add delegated events to the SVG nodes
 */
function addEvents(svgNode) {
	var timeout;
	svgNode.parentNode.addEventListener('mouseover', function (evt) {
		var node = evt.target;
		if (node.nodeName === 'line' && node.classList.contains('ct-point')) {
			if (timeout) clearTimeout(timeout);
			addTooltip(node);
		}

	}, false);

	svgNode.parentNode.addEventListener('mouseout', function (evt) {
		var node = evt.target;
		if (node.nodeName === 'line' && node.classList.contains('ct-point')) {
			timeout = setTimeout(Tooltip.destroyAll, 1000);
		}
	}, false);
}

// TODO: This function is in util, how to share between node and browser (module loader?)
// @return {array} urls merged and without duplicates
function getURLs (sites) {
	if (sites.groups) {
		// Concatenate all urls
		const urls = sites.groups.reduce((acc, group) => [...acc, ...group.urls], []);
		// Remove duplicates
		return [...new Set(urls)];
	}
	return sites;
}

// Require AJAX util library
if (AJAX) {
	// Wait for all the AJAX calls with Promises. First get the tested URLs
	AJAX.promiseGet('urls').then(JSON.parse).then(function (response) {
		if (response.length === 0) {
			showError('There are no tests yet');
		}

		if (response.groups) {
			groups = response.groups;
		}
		urls = getURLs(response);
		drawLegend(response);

		if (urls.length > 5) {
			document.body.classList.add('crowded-house');
		}

		// Get the test results for each URL
		return Promise.all(
			urls.map(function (url) {
				return AJAX.promiseGet('test/' + url + '/day/0');
			})
		);

	}).then(processTests)
	.catch(showError);
}


/*
 * Process the tests coming from the tests/ Api call
 */
function processTests(responses) {
	var maxLength = 0;
	chartData.series = [];
	
	responses.forEach(function (response, i) {
		var singleUrl = JSON.parse(response);

		// If there's no test info, avoid chartist to crash by setting an empty array
		if (singleUrl.status === 'error') {
			chartData.series[i] = [];
			return;
		}

		if (singleUrl.data.hours) {
			chartData.labels = singleUrl.data.hours;
		} else if (singleUrl.data.days) {
			chartData.labels = singleUrl.data.days;
		}
 
		singleUrl = singleUrl.data.tests;

		// Store in the global variable
		currentTests[i] = singleUrl;
		if (singleUrl) {
			fillChartData(singleUrl, nodes.measureSelect.value);
		}
	});

	createChart();
}

/*
 * @param {string} measureUnit can be 'totalTime', 'speedIndex', 'visuallyComplete', 'ttfb', etc.
 */
function fillChartData(tests, measureUnit) {
	var serie = tests.map(function (singleTest) {
		if (singleTest && singleTest.firstView[measureUnit]) {
			return singleTest.firstView[measureUnit];
		}
		return null;
	});

	removePeaks(serie);
	chartData.series.push(serie);
}



var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fillFilterDropdowns() {

	var option,	dateObj;

	// Fill the days dropdown
	option = document.createElement('option');
	option.textContent = 'Yesterday';
	option.value = -1;
	nodes.daySelect.appendChild(option);

	dateObj = new Date();
	dateObj.setDate(dateObj.getDate() - 1);
	for (var i = 2; i < 7; i++) {
		// Substract one day at a time
		dateObj.setDate(dateObj.getDate() - 1);
		option = document.createElement('option');
		option.textContent = days[dateObj.getDay()];
		option.value = -i;
		nodes.daySelect.appendChild(option);
	}

	// Now the months
	option = document.createElement('option');
	option.textContent = 'last 30 days';
	option.value = 0;
	nodes.monthSelect.appendChild(option);
	for (i = 1; i < 12; i++) {
		// Substract one month at a time
		dateObj.setMonth(dateObj.getMonth() - 1);
		option = document.createElement('option');
		option.textContent = months[dateObj.getMonth()];
		option.value = -i;
		nodes.monthSelect.appendChild(option);
	}
}

fillFilterDropdowns();

nodes.daySelect.addEventListener('change', function (evt) {
	Promise.all(
		urls.map(function (url) {
			return AJAX.promiseGet('test/' + url + '/day/' + evt.target.value);
		})
	).then(processTests)
	.catch(showError);

	// nodes.measureSelect.selectedIndex = 0;
	this.classList.add('active');
	nodes.monthSelect.classList.remove('active');
	nodes.monthSelect.selectedIndex = 0;
}, false);


nodes.monthSelect.addEventListener('change', function (evt) {

	if (evt.target.value === 'thisweek') {
		nodes.daySelect.value = '0';
		nodes.daySelect.dispatchEvent(new Event('change', { 'bubbles': true }));
		return;
	}

	Promise.all(
		urls.map(function (url) {
			return AJAX.promiseGet('test/' + url + '/month/' + evt.target.value);
		})
	).then(processTests)
	.catch(showError);

	// nodes.measureSelect.selectedIndex = 0;
	this.classList.add('active');
	nodes.daySelect.classList.remove('active');
}, false);



/*
 * Event for switching measurement unit via dropdown
 */
nodes.measureSelect.addEventListener('change', function (evt) {
	chartData.series = [];
	currentTests.forEach(function (test) {
		fillChartData(test, evt.target.value);
	});
	createChart();

}, false);



/*
 * Sometimes there's a peak of more than 20s that makes the graph more difficult to see, let's remove them
 * TODO: Detect somehow else continuous peaks on a server
 */
function removePeaks(serie) {
	serie.forEach((value, i, serie) => {
		if (value > discardTestOver)  {
			serie[i] = null;
		}
	});
} 




/** ***********************   LEGEND   *********************/
function drawLegend(sites) {
	var line, label, checkbox, text, char = 'a';

	// Output groups labels
	nodes.legendGroups.innerHTML = '';
	if (sites.groups) {
		nodes.legendGroups.parentNode.classList.remove('hidden');
		sites.groups.forEach((group, i) => {
			label = document.createElement('label');

			checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.name = 'label-group-' + i;
			checkbox.checked = true;
			label.appendChild(checkbox);
			text = document.createTextNode(group.label);
			label.appendChild(text);
			nodes.legendGroups.appendChild(label);
		});
	}


	nodes.legend.innerHTML = '';
	line = document.createElement('label');
	checkbox = document.createElement('input');
	checkbox.type = 'checkbox';
	checkbox.name = 'check-all';
	checkbox.checked = true;
	line.appendChild(checkbox);
	text = document.createTextNode('Check/Uncheck all');
	line.appendChild(text);
	nodes.legend.appendChild(line);

	urls.forEach((url, i) => {
		line = document.createElement('label');
		line.className = 'ct-series-' + increaseChar(char, i);
		if (sites.groups) {
			line.className += ' ' + getUrlGroups(sites.groups, url).map((group) => 'group-' + group).join(' ');
		}
		checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.name = 'line-' + i;
		checkbox.checked = true;
		line.appendChild(checkbox);
		text = document.createTextNode(url);
		line.appendChild(text);
		nodes.legend.appendChild(line);
	});
}

/*
 * Get the line node in the canvas graph from the associated checkbox in the legend
 * @param {NodeElement} checkbox node
 * @returns {NodeElement} The corresponding line in the canvas/graph
 */
function getLineFromCheckbox(checkbox) {
	var index = parseInt(checkbox.name.replace('line-', ''));
	return document.getElementsByClassName('ct-series ct-series-' + increaseChar('a', index)[0]);
}

/*
 * Increase char by a numeric index -> 'a' + 3 = 'd'
 * @param {string} base char
 * @param {number}
 * @returns {string}
 */
function increaseChar(c, sum) {
	return String.fromCharCode(c.charCodeAt(0) + sum);
}


/*
 * For groups of urls, get the groups a url belongs to. Can be multiple groups.
 * @param {object} groups as received by the Ajax call
 * @param {string} url to search for
 * @return {array} of groups, zero-based
 */
function getUrlGroups(groups, url) {
	let groupArr = [];
	groups.forEach(function (group, i) {
		if (group.urls.indexOf(url) > -1) {
			groupArr.push(i);
		}
	});
	return groupArr;
}

/*
 * Activate a url line in the graph
 * @param {NodeElement} checkbox node from the legend
 * @param {bool} wether save to Localstorage or not
 * @return {bool}
 */
function activateUrl (checkbox, saveToLS) {
	const line = getLineFromCheckbox(checkbox);
	if (line.length) {
		line[0].classList.remove('hidden');
		if (saveToLS) {
			saveSelectionInLS();
		}
		return true;
	}
	return false;
}

/*
 * Deactivate a url line in the graph
 * @param {NodeElement} checkbox node from the legend
 * @param {bool} wether save to Localstorage or not
 * @return {bool}
 */
function deactivateUrl (checkbox, saveToLS) {
	const line = getLineFromCheckbox(checkbox);
	if (line.length) {
		line[0].classList.add('hidden');
		if (saveToLS) {
			saveSelectionInLS();
		}
		return true;
	}
	return false;
}

/*
 * Event for showing/hiding lines in the graph (evt delegated)
 */
nodes.legend.addEventListener('change', function (evt) {
	var node = evt.target, i;
	if (node.name === 'check-all') {
		var checkboxes = nodes.legend.querySelectorAll('[class^=ct-series]:not(.hidden) input');
		if (node.checked) {
			for (i=0; i < checkboxes.length; i++) {
				checkboxes[i].checked = true;
				activateUrl(checkboxes[i], true);
			}
		} else {
			for (i=0; i < checkboxes.length; i++) {
				checkboxes[i].checked = false;
				deactivateUrl(checkboxes[i], true);
			}
		}
	} else {
		if (node.checked) {
			activateUrl(node, true);
		} else {
			deactivateUrl(node, true);
		}
	}


}, false);


/*
 * Event for showing/hiding group of lines in the graph (evt delegated)
 */
nodes.legendGroups.addEventListener('change', function (evt) {
	applyGroupFilter(evt.target);
	saveSelectionInLS();
}, false);


/*
 * Applies the group filter from the legend (because a graph refresh)
 */
function applyGroupFilters() {
	var groups = nodes.legendGroups.querySelectorAll('[type=checkbox]');
	for (var i = 0; i < groups.length; i++) {
		applyGroupFilter(groups[i]);
	}
}


/*
 * Get current active groups
 * @returns {array} like ['group-0', 'group-2']
 */
function getActiveGroups() {
	const groups = Array.from(nodes.legendGroups.querySelectorAll('input[type=checkbox]:checked'));
	return groups.map(input => input.name.replace('label-', ''));
}

/*
 * Applies a SINGLE group filter from the legend (because a graph refresh)
 * @param {Element} group checkbox
 */
function applyGroupFilter(groupNode) {
	var group = groupNode.name.replace('label-', '');
	var labels = nodes.legend.getElementsByClassName(group);

	var activeGroups = getActiveGroups();

	for (var i=0; i < labels.length; i++) {
		var label = labels[i],
			input = label.querySelector('input');

		if (groupNode.checked) {
			label.classList.remove('hidden');
			if (input.checked) {
				activateUrl(input);
			}
		} else {
			// Deactivate url, only if it doesn't belong to another active group
			if (!activeGroups.some(activeGroup => label.classList.contains(activeGroup))) {
				label.classList.add('hidden');
				deactivateUrl(input);
			}
		}
	}
}

/*
 * Event for highlighting the hovered url in the graph (evt delegated)
 */
nodes.legend.addEventListener('mouseover', function (evt) {
	const label = evt.target;
	if (label.nodeName === "LABEL") {
		const input = label.querySelector('input');
		if (input) {
			const line = getLineFromCheckbox(input);
			if (line.length) {
				line[0].parentNode.classList.add('fade-out');
				line[0].classList.add('line-active');
			}
		}
	}
}, false);

nodes.legend.addEventListener('mouseout', function (evt) {
	const label = evt.target;
	if (label.nodeName === "LABEL") {
		const input = label.querySelector('input');
		if (input) {
			const line = getLineFromCheckbox(input);
			if (line.length) {
				line[0].parentNode.classList.remove('fade-out');
				let previousActive = line[0].parentNode.querySelector('.line-active');
				if (previousActive) {
					previousActive.classList.remove('line-active');
				}
			}
		}
	}
}, false);




/* Apply the filters if graph is reloaded */
function applyUrlFilters() {
	var filters = nodes.legend.querySelectorAll('input[type=checkbox]');
	var i, line;
	for (i = 0; i < filters.length; i++) {
		if (!filters[i].checked) {
			line = document.getElementsByClassName('ct-series ct-series-' + increaseChar('a', i)[0]);
			if (line.length) {
				line[0].classList.add('hidden');
			}
		}
	}
	
	saveSelectionInLS();
}

function showError(error) {
	console.log(arguments);
	nodes.notification.textContent = error;
}


/** ****************   LOCAL STORAGE    ************************/
function saveSelectionInLS() {
	if (!localStorageAvailable) return;

	var legendUrls = nodes.legend.childNodes,
		legend = {},
		groups = {},
		input;

	for (var i = 0; i < legendUrls.length; i++) {
		input = legendUrls[i].querySelector('input[type=checkbox]');
		legend[legendUrls[i].className] = input.checked;
	}

	var groupNodes = nodes.legendGroups.querySelectorAll('input[type=checkbox]');
	for (i = 0; i < groupNodes.length; i++) {
		groups[groupNodes[i].name] = groupNodes[i].checked;
	}

	var selection = {
		'daySelect'    : nodes.daySelect.value,
		'monthSelect'  : nodes.monthSelect.value,
		'measureSelect': nodes.measureSelect.value,
		'legend'       : legend,
		'groups'       : groups
	};

	localStorage.setItem('perf-dashboard-selection', JSON.stringify(selection));
}

function loadSelectionFromLS() {
	if (!localStorageAvailable) return;
	var selection = localStorage.getItem('perf-dashboard-selection');
	var legendUrls = nodes.legend.childNodes;

	if (!selection) return;
	selection = JSON.parse(selection);

	inputChange(nodes.daySelect, selection.daySelect);
	inputChange(nodes.monthSelect, selection.monthSelect);
	inputChange(nodes.measureSelect, selection.measureSelect);

	for (var i = 0; i < legendUrls.length; i++) {
		inputChange(
			legendUrls[i].querySelector('input[type=checkbox]'),
			selection.legend[legendUrls[i].className]
		);
	}

	var groupNodes = nodes.legendGroups.querySelectorAll('input[type=checkbox]');
	for (i = 0; i < groupNodes.length; i++) {
		inputChange(groupNodes[i],selection.groups[groupNodes[i].name]);
		applyGroupFilter(groupNodes[i]);
	}
}


/*
 * Changes input/select value if different, and triggers 'change' event
 */
function inputChange(node, newValue) {
	if (node.type === 'checkbox' || node.type === 'radio') {
		if (node.checked !== newValue) {
			node.checked = newValue;
			node.dispatchEvent(new Event('change', { 'bubbles': true }));
		}
	} else {
		if (node.value !== newValue) {
			node.value = newValue;
			node.dispatchEvent(new Event('change'));
		}
	}
}

/*
 * make sure that localStorage is accesible
 * if gets to the error and returns QUOTA_EXCEEDED that means the device is in private mode
 */
function lSAvailable() {
	try {
		localStorage.setItem('t2', 'privateBrowsing');
		localStorage.removeItem('t2');
		return true;
	} catch (e) {
		// error returned when local storage is not available or the user is in private browsing
		return false;
	}
}


