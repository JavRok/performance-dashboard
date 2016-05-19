
// TODO: Switch to ES6 + Babel
// TODO: Refactor this mess

var chartData = {
	// A labels array that can contain any sort of values
	labels: [],
	// Our series array that contains series objects or in this case series data arrays
	series: []
};

var urls;
var chart;
// 2-dimensions array with all the tests received, each array 1st-level element corresponds with an url (line)
var currentTests = [];

// Nodes
var nodes = {
	daySelect: document.querySelector(".filters-day-select"),
	monthSelect: document.querySelector(".filters-month-select"),
	measureSelect: document.querySelector(".filters-measure-unit"),
	legend: document.querySelector(".legend")
};


var localStorageAvailable = localStorageAvailable();


// Create a new line chart object where as first parameter we pass in a selector
// that is resolving to our chart container element. The Second parameter
// is the actual data object.
function createChart () {
	if (!chart) {
		chart = new Chartist.Line('.loading-time-chart', chartData, {
			// Options
			axisY: {
				labelInterpolationFnc: function(value) {
					return value / 1000 + 's';
				}
			},
			lineSmooth: Chartist.Interpolation.simple({
				fillHoles: true
			}),
			low: 0
			// high: 20000
		});

		// Listening for draw events that get emitted by the Chartist chart
		chart.on('draw', function(data) {
			if(data.type === 'line' || data.type === 'area') {
				data.element.animate({
					d: {
						// begin: 1000 * data.index,
						dur: 1000,
						from: data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
						to: data.path.clone().stringify(),
						easing: Chartist.Svg.Easing.easeOutQuint
					}
				});

			// Add the possibility to click a point (single test) and visit the test results
			} else if(data.type === 'point') {

				addPointEvent(data.element._node, data.index);

			}

		});

		chart.on('created', function(data) {
			loadSelectionFromLS();
			// This is also called on update, so let's remove the event handler
			chart.off('created');
		});

	} else {
		chart.update(chartData);
		applyUrlFilters();
	}


}


// Add click event to points in the line, to visit the test results
function addPointEvent(node, index) {
	// Identify which of the lines in the graph we're in
	var lineMatches = node.parentNode.getAttribute("class").match(/ct-series-([a-z])/);
	if (lineMatches[1]) {
		var lineIndex = lineMatches[1].charCodeAt(0) - "a".charCodeAt(0);
	}
	// And set the Test id to be able to click it
	node.setAttribute("id", currentTests[lineIndex][index].id);
	var title = document.createElement("title");
	title.textContent = "Click to see test details";
	node.appendChild(title);

	node.addEventListener("click", function(evt){
		window.open("http://www.webpagetest.org/result/" + evt.target.id, '_blank');
	}, false);
}



// Require AJAX util library
if (AJAX) {
	// Wait for all the AJAX calls with Promises. First get the tested URLs
	AJAX.promiseGet("urls").then(JSON.parse).then(function(response) {
		console.log("Success!", response);
		urls = response;

		drawLegend();

		// Get the test results for each URL
		return Promise.all(
			response.map(function(url) {
				return AJAX.promiseGet("test/" + url + "/day/0");
			})
		);

	}).then(processTests);
}


/*
 * Process the tests coming from the tests/ Api call
 */
function processTests(responses){
	var maxLength = 0;

	chartData.series = [];
	responses.forEach(function(response, i) {
		var singleUrl = JSON.parse(response);

		if (singleUrl.data.hours) {
			chartData.labels = singleUrl.data.hours;
		} else if(singleUrl.data.days) {
			chartData.labels = singleUrl.data.days;
		}

		singleUrl = singleUrl.data.tests;

		// Store in the global variable
		currentTests[i] = singleUrl;
		if(singleUrl) {
			fillChartData(singleUrl, 'totalTime');
		}
	});

	createChart();
	// drawLegend();
}

/*
 * @param {string} measureUnit can be 'totalTime', 'speedIndex', 'visuallyComplete', 'ttfb', etc.
 */
function fillChartData(tests, measureUnit) {
	var serie = tests.map(function(singleTest) {
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
	option = document.createElement("option");
	option.textContent = "Yesterday";
	option.value = -1;
	nodes.daySelect.appendChild(option);

	dateObj = new Date();
	dateObj.setDate(dateObj.getDate() - 1);
	for (var i=2; i < 7; i++) {
		// Substract one day at a time
		dateObj.setDate(dateObj.getDate() - 1);
		option = document.createElement("option");
		option.textContent = days[dateObj.getDay()];
		option.value = -i;
		nodes.daySelect.appendChild(option);
	}

	// Now the months
	option = document.createElement("option");
	option.textContent = "last 30 days";
	option.value = 0;
	nodes.monthSelect.appendChild(option);
	for (var i=1; i < 12; i++) {
		// Substract one month at a time
		dateObj.setMonth(dateObj.getMonth() - 1);
		option = document.createElement("option");
		option.textContent = months[dateObj.getMonth()];
		option.value = -i;
		nodes.monthSelect.appendChild(option);
	}
}

fillFilterDropdowns();

nodes.daySelect.addEventListener("change", function(evt) {
	Promise.all(
		urls.map(function(url) {
			return AJAX.promiseGet("test/" + url + "/day/"+ evt.target.value);
		})
	).then(processTests);
	nodes.measureSelect.selectedIndex = 0;
}, false);

nodes.monthSelect.addEventListener("change", function(evt) {
	Promise.all(
		urls.map(function(url) {
			return AJAX.promiseGet("test/" + url + "/month/"+ evt.target.value);
		})
	).then(processTests);
	nodes.measureSelect.selectedIndex = 0;
}, false);



/*
 * Event for switching measurement unit via dropdown
 */
nodes.measureSelect.addEventListener("change", function(evt) {
	chartData.series = [];
	currentTests.forEach(function(test) {
		fillChartData(test, evt.target.value);
	});
	createChart();

}, false);


/*
 * Event for switching measurement unit via dropdown
 */
nodes.measureSelect.addEventListener("change", function(evt) {
	chartData.series = [];
	currentTests.forEach(function(test) {
		fillChartData(test, evt.target.value);
	});
	createChart();

}, false);



/*
 * Sometimes there's a peak of more than 20s that makes the graph more difficult to see, let's remove them
 * TODO: Detect somehow else continuous peaks on a server
 */
function removePeaks (serie) {
	serie.forEach((value, i, serie) => {
		if (value > 20000)  {
		serie[i] = null;
	}
});
}


function increaseChar(c, sum) {
	return String.fromCharCode(c.charCodeAt(0) + sum);
}


/*************************   LEGEND   *********************/
function drawLegend() {
	var line, checkbox, text, char = 'a';
	nodes.legend.innerHTML = "";
	urls.forEach((url, i) => {
		line = document.createElement("label");
		line.className = "ct-series-" + increaseChar(char, i);
		checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.name = "line-" + i;
		checkbox.checked = true;
		line.appendChild(checkbox);
		text = document.createTextNode(url);
		line.appendChild(text);
		nodes.legend.appendChild(line);
	});
}

/*
 * Event for showing/hiding lines in the graph (evt delegated)
 */
nodes.legend.addEventListener("change", function(evt) {
	var index = parseInt(evt.target.name.replace("line-", ""));
	var line = document.getElementsByClassName("ct-series ct-series-" + increaseChar("a", index)[0]);
	if (line.length) {
		line[0].classList.toggle("hidden");
	}
	saveSelectionInLS();
}, false);

/* Apply the filters if graph is reloaded */
function applyUrlFilters () {
	var filters = nodes.legend.querySelectorAll("input[type=checkbox]");
	var i, line;
	for(i=0; i<filters.length; i++) {
		if (!filters[i].checked) {
			line = document.getElementsByClassName("ct-series ct-series-" + increaseChar("a", i)[0]);
			if (line.length) {
				line[0].classList.add("hidden");
			}

		}
	}
	saveSelectionInLS();
}




/******************   LOCAL STORAGE    ************************/
function saveSelectionInLS() {
	if(!localStorageAvailable) return;

	var legendUrls = nodes.legend.childNodes,
		legend = {}, input;

	for (var i=0; i<legendUrls.length; i++) {
		input = legendUrls[i].querySelector("input[type=checkbox]");
		legend[legendUrls[i].className] = input.checked;
	}
	var selection = {
		"daySelect": nodes.daySelect.value,
		"monthSelect": nodes.monthSelect.value,
		"measureSelect": nodes.measureSelect.value,
		"legend": legend
	};

	localStorage.setItem("perf-dashboard-selection", JSON.stringify(selection));
}

function loadSelectionFromLS () {
	if(!localStorageAvailable) return;
	var selection = localStorage.getItem("perf-dashboard-selection");
	var legendUrls = nodes.legend.childNodes;

	selection = JSON.parse(selection);

	inputChange(nodes.daySelect, selection.daySelect);
	inputChange(nodes.monthSelect, selection.monthSelect);
	inputChange(nodes.measureSelect, selection.measureSelect);

	for (var i=0; i<legendUrls.length; i++) {
		inputChange(
			legendUrls[i].querySelector("input[type=checkbox]"),
			selection.legend[legendUrls[i].className]
		);
	}
}

/*
 * Changes input/select value if different, and triggers 'change' event
 */
function inputChange (node, newValue) {
	if (node.type === "checkbox" || node.type === "radio") {
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
 * if gets to the error and returns QUOTA_EXCEEDED that means the device it's in private mode
 */
function localStorageAvailable () {
	try {
		localStorage.setItem('t2', 'privateBrowsing');
		localStorage.removeItem('t2');
		return true;
	} catch (e) {
		// error returned when local storage is not available or the user is in private browsing
		return false;
	}
}



