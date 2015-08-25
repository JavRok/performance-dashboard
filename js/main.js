

// For now hardcoded test results
var results = ['150710_12_RT9', '150710_42_QS8', '150710_ZD_RTW', '150713_3M_J0Z', '150710_12_RT9', '150710_42_QS8', '150713_3M_J0Z'];
// Simple stack to wait for all ajax calls
var pending = [];


var chartData = {
	// A labels array that can contain any sort of values
	labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
	// Our series array that contains series objects or in this case series data arrays
	series: [[]]
};



// Require AJAX util library
if (AJAX) {
	// Wait for all the AJAX calls
	results.forEach(function (res) {
		pending.push(true);
		AJAX.getJson ('wpt.org.json/'+res+".json", function (json) {
			chartData.series[0].push(json.data.runs["1"].firstView.loadTime);
			pending.pop();

			if (pending.length === 0) {
				createChart ();
			}
		});
	});

}

// Create a new line chart object where as first parameter we pass in a selector
// that is resolving to our chart container element. The Second parameter
// is the actual data object.
function createChart () {
	var chart = new Chartist.Line('.loading-time-chart', chartData, {
		// Options
		axisY: {
			labelInterpolationFnc: function(value) {
				return value / 1000 + ' s';
			}
		}
	});

	chart.on('draw', function(data) {
		if(data.type === 'line' || data.type === 'area') {
			data.element.animate({
				d: {
					begin: 2000 * data.index,
					dur: 2000,
					from: data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
					to: data.path.clone().stringify(),
					easing: Chartist.Svg.Easing.easeOutQuint
				}
			});
		}
	});

}
