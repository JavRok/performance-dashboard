/*
 * This module controls that the results .json files don't get too big, by reducing old 24h results into a single
 * value, calculated with the median.
  */

var fs = require('fs');
var Config = require('../Model/TestConfig.js');
// var TestResult = require('../Model/TestResult.js');
var TestResultCollection = require('../Model/TestResultCollection.js');

// Limit on the number of days stored with all the test information
var limit24hDays = 7;

// TODO: To Config
var resultsDir = "wpt.org.json/results/";  // 24h results
var historyDir = "wpt.org.json/history/";  // days median result

function run () {
	// Read the contents of the status directory to get test Ids
	fs.readdir(resultsDir, function (err,  files) {
		if (err) return Config.log(err, true);

		files.forEach(function (file) {

			// For each file in pending, look for finished tests
			fs.readFile(resultsDir + file, function (err, data) {
				if (err) return Config.log(err, true);

				var tests = new TestResultCollection (JSON.parse(data));
				var days = getDays(tests);

				console.log(days);


				// Get days that are over the limit
				// Calculate median for those
				// Create a file with days results instead of hours result


			});
		});
	});
}


/*
 * Gets an array of different days (no matter how many test results) stored in the results file
 */
function getDays(testResults) {
	// Loop over the tests and get
	testResults.tests.forEach()
}

run();