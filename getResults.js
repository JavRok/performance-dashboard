
// Load the fs (filesystem) module
var fs = require('fs');
var webpagetest = require('webpagetest');
var wpt = new WebPageTest('www.webpagetest.org');


var statusDir = "wpt.org.json/status/";
var resultsDir = 'wpt.org.json/results/';


// Read the contents of the status directory to get test Ids
fs.readdir(statusDir, function (err,  files) {

	files.forEach(function (file) {

		// For each file in status, look for successful test IDs
		fs.readFile(statusDir + file, function (err, data) {

			var results;

			// If an error occurred, throwing it will
			// display the exception and end our app.
			if (err) throw err;

			results = JSON.parse(data);

			// There are several tests run in a batch
			results.forEach(function(test) {
				if (test && test.statusCode === 200) {
					getResult(test.data.testId);
				}
			});
		});
	});

});


function getResult(testId) {

	var testFile = resultsDir + testId + ".json";

	// Check if file exists
	fs.stat(testFile, function (stats) {
		console.log(stats);
		if (stats.code === 'ENOENT' ) {
			console.log("File doesn't exist ! ", testFile);

			wpt.results( testId, function (err, data) {
				console.log(err || data);
			});

		}

	});

}