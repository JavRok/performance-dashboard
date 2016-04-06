

var chartData = {
	// A labels array that can contain any sort of values
	labels: [],
	// Our series array that contains series objects or in this case series data arrays
	series: []
};


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
					dur: 1000,
					from: data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
					to: data.path.clone().stringify(),
					easing: Chartist.Svg.Easing.easeOutQuint
				}
			});
		}
	});

}


// Require AJAX util library
if (AJAX) {
	// Wait for all the AJAX calls with Promises. First get the tested URLs
	AJAX.promiseGet("/urls").then(JSON.parse).then(function(response) {
		console.log("Success!", response);

		// Get the test results for each URL
		return Promise.all(
			response.map(function(url) {
				return AJAX.promiseGet("/test/" + url);
			})
		);

	}).then(function(responses) {
		var maxLength = 0;

		responses.forEach(function(response) {
			var singleTest = JSON.parse(response);

			maxLength = (singleTest.data.length > maxLength)? singleTest.data.length : maxLength;
			console.log("length", singleTest.data.length);

			var serie = singleTest.data.map(function(singleTest) {
				return singleTest.firstView.visuallyComplete;
			});
			chartData.series.push(serie);
		});

		for (var i=0; i < maxLength; i++) {
			chartData.labels[i] = i;
		}

		createChart();
	});

}

/*
 * @param data Test historic data in json
 */
 /*function addChartLine(data) {
	 var chart = new Chartist.Line('.loading-time-chart', chartData, {
		 // Options
		 axisY: {
			 labelInterpolationFnc: function(value) {
				 return value / 1000 + ' s';
			 }
		 }
	 });
}*/

/*homes.sort(function(a, b) {
	return parseFloat(a.price) - parseFloat(b.price);
});*/
