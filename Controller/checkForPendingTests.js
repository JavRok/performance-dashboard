/**
 * This module checks for pending tests, run by launchTest.js before.
 */

const fs = require('fs');
const WebPageTest = require('webpagetest');
const TestResult = require('../Model/TestResult.js');
const TestResultCollection = require('../Model/TestResultCollection.js');
const testStatus = require('../Model/TestStatus.js');
const util = require('../Helper/util.js');
const conf = require('../Config');

const pendingDir = conf.getPath('pending');


// Map of the queued time (when we requested the test), used to calculate waiting times on specific locations
const queuedTimes = new Map();

// Checks for tests in pending state, and tries to get the result if they're finished
function run() {

	// Read the contents of the status directory to get test Ids
	fs.readdir(pendingDir, function (err,  files) {
		if (err) return conf.log(err, true);

		conf.log('Found ' + files.length + ' pending tests.');

		files.forEach(function (file) {

			// For each file in pending, look for finished tests
			fs.readFile(pendingDir + file, function (err2, data) {
				if (err2) return conf.log(err2, true);

				const result = JSON.parse(data);
				if (result.statusCode === 200) {
					checkTestStatus(result.data.testId, file);
				}

			});
		});
	});

}

// Checks if a test has been finished (by using wpt.org API). If so, process the results and cleans the files
function checkTestStatus(id, fileName) {

	testStatus.getStatus(id, function (err, result) {
		if (err) return conf.log(err, true);

		if (result.finished) {

			const wpt = new WebPageTest('www.webpagetest.org', conf.getApiKey());
			const options = conf.get('testOptions');
			queuedTimes.set(id, util.parseDateFromFile(fileName));
			wpt.results(id, options, processTestResult);
            // Delete the pending state file
			fs.unlink(pendingDir + fileName, ()=>{});
		} else {
            // result.position -> queue
		}
	});

}


// Process the results and save the summary into a file
function processTestResult(err, result) {
	if (err) return conf.log(err, true);

    // console.log(result.data.runs);return;
	const test = new TestResult(result);
	let tests;
	const fileName = conf.getPath('results') + util.getFileNameFromUrl(test.domain);

	// Add starting time (not when the test actually started)
	test.queuedTime = queuedTimes.get(test.id);

	fs.readFile(fileName, 'utf-8', function (err2, data) {
        // File doesn't exist, create it.
		if (err2) {
			tests = new TestResultCollection ();
			tests.add(test);
			fs.writeFile(fileName, tests, function () {});

        // File exists, overwrite it
		} else {

			try {
				tests = new TestResultCollection (JSON.parse(data));
			} catch (ex) {
				conf.log('Exception when parsing test json file:' + ex.message);
				tests = new TestResultCollection ();
			}

			tests.addOrdered(test);
			fs.writeFile(fileName, tests, function () {});
		}
	});

	conf.log('Successfully gather results from test ' + test.id);
}


// Run if file was invoked directly, otherwise leverage on outside script
if (util.isCalledFromCommandLine('checkForPendingTests.js')) {
	run();
}


module.exports = {run: run};
