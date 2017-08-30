/*
 * This module controls that the results .json files don't get too big, by reducing old 24h results into a single
 * value, calculated with the median, and saved to a file in history/
 */

if ( global.v8debug ) {
	global.v8debug.Debug.setBreakOnException(); // speaks for itself
}

var fs = require('fs');
const conf = require('../Config');
	// conf = Config();
var util = require('../Helper/util.js');
var TestResult = require('../Model/TestResult.js');
var TestResultCollection = require('../Model/TestResultCollection.js');

// Limit on the number of days stored with all the test information
var limit24hDays = 7;

var resultsDir = conf.getPath('results');  // 24h results
var historyDir = conf.getPath('history');  // days median result

function run() {
	// Calculate the limit date to exclude from the history saving
	var today = new Date();
	var limitDate = today.setDate(today.getDate() - limit24hDays);

	fs.readdir(resultsDir, function (err,  files) {
		if (err) return conf.log(err, true);

		files.forEach(function (file) {

			// For each domain, get both the results and the history file
			Promise.all([getFileJsonResults(historyDir + file), getFileJsonResults(resultsDir + file)])
				.then( (results) => {

					var dailyResults = results[0];
					var hourlyResults = results[1];
					var days = getDays(hourlyResults);

					// Now 'days' list all single days found in the hourly results
					// We calculate median for those, store them in a file, and remove the oldest from original results

					var dateObj, today = util.getUniqueDay(Date.now() / 1000);
					if (days.length > 0) {
						days.forEach((day) => {
							if (day === today) return;
							dailyResults.addOrdered(getMedianForDay(hourlyResults, day));
							dateObj = new Date(day);
							// If older than 7 days (by default), remove them

							if (dateObj < limitDate) {
								hourlyResults.removeTestsFromDay(day);
							}
						});

						setFileJsonResults(historyDir + file, dailyResults);
						setFileJsonResults(resultsDir + file, hourlyResults);
					}

				})
				.catch((err) => {
					conf.log(`saveTestHistory: Error when retrieving ${file}. ${err}`);
				});
		});
	});

	conf.log('Saving daily history and removing old results');
}

/*
 * Read a results file to a TestResultCollection object.
 * @return {Promise.<TestResultCollection>} If succeeds, returns a TestResultCollection object
 */
function getFileJsonResults(fileName) {

	return new Promise(function (resolve, reject) {
		fs.readFile(fileName, 'utf-8', function (err, data) {
			if (err) {
				// Never reject, just return empty test collection
				return resolve(new TestResultCollection ());
			}
			try {
				resolve(new TestResultCollection (JSON.parse(data)));
			} catch (ex) {
				resolve(new TestResultCollection ());
			}
		});
	});
}


/*
 * Save a TestResultCollection object to a file
 * @param {string} fileName
 * @param {TestResultCollection}
 */
function setFileJsonResults(fileName, tests) {
	fs.writeFile(fileName, tests, function () {});
}


/*
 * Calculates the median for all the tests within the day specified
 * @param {string} day in format yyyy-mm-dd
 * @param {array} tests hourly test results saved by checkForPendingTests
 * @return {object} single object with the median of all the previous results
 */
function getMedianForDay(tests, day) {

	if (!tests || tests.length === 0 ) {
		return null;
	}

	// Temp chunk of tests from the total list of elements that matches the day
	var dayTests1stView = [];
	var dayTests2ndView = [];   // RepeatView
	for (let test of tests) {
		if (util.getUniqueDay(test.date) === day) {
			dayTests1stView.push(test.firstView);
			if (test.repeatView) {
				dayTests2ndView.push(test.repeatView);
			}
		}
	}

	var timestamp = Math.floor(new Date(day).getTime() / 1000);
	var sampleTest = tests.tests[tests.length() - 1];

	var medianObject = {
		'id'          : day,
		'location'    : sampleTest.location,
		'url'         : sampleTest.url,
		'domain'      : sampleTest.domain,
		'connectivity': sampleTest.connectivity,
		'date'        : timestamp,
		'firstView'   : {
			'requests'        : util.medianForObject(dayTests1stView, 'requests'),
			'bytesIn'         : util.medianForObject(dayTests1stView, 'bytesIn'),
			'ttfb'            : util.medianForObject(dayTests1stView, 'ttfb'),
			'startRender'     : util.medianForObject(dayTests1stView, 'startRender'),
			'domReadyEvent'   : util.medianForObject(dayTests1stView, 'domReadyEvent'),
			'loadEvent'       : util.medianForObject(dayTests1stView, 'loadEvent'),
			'totalTime'       : util.medianForObject(dayTests1stView, 'totalTime'),
			'visuallyComplete': util.medianForObject(dayTests1stView, 'visuallyComplete'),
			'speedIndex'      : util.medianForObject(dayTests1stView, 'speedIndex')
		}
	};

	if (dayTests2ndView.length > 0) {
		medianObject.repeatView = {
			'requests'        : util.medianForObject(dayTests2ndView, 'requests'),
			'bytesIn'         : util.medianForObject(dayTests2ndView, 'bytesIn'),
			'ttfb'            : util.medianForObject(dayTests2ndView, 'ttfb'),
			'startRender'     : util.medianForObject(dayTests2ndView, 'startRender'),
			'domReadyEvent'   : util.medianForObject(dayTests2ndView, 'domReadyEvent'),
			'loadEvent'       : util.medianForObject(dayTests2ndView, 'loadEvent'),
			'totalTime'       : util.medianForObject(dayTests2ndView, 'totalTime'),
			'visuallyComplete': util.medianForObject(dayTests2ndView, 'visuallyComplete'),
			'speedIndex'      : util.medianForObject(dayTests1stView, 'speedIndex')
		}
	}

	return new TestResult(medianObject);
}





/*
 * Gets an array of different days (no matter how many test results) stored in the results file
 * @param {TestResultCollection}
 */
function getDays(testResults) {

	var days = [];

	// testResults is an Iterable
	for (let test of testResults) {
		let day = util.getUniqueDay(test.date);

		if (days.indexOf(day) === -1) {
			 days.push(day);
		}
	}

	return days;
}


// Run if file was invoked directly, otherwise leverage on outside script
if (util.isCalledFromCommandLine('saveTestHistory.js')) {
	run();
}

module.exports = {run: run};