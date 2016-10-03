/* This module checks for pending tests, run by launchTest.js before. */

"use strict";

var fs = require('fs');
var WebPageTest = require('webpagetest');

var TestResult = require('../Model/TestResult.js');
var TestResultCollection = require('../Model/TestResultCollection.js');
var util = require('../Helper/util.js');
var Config = require('../Model/TestConfig.js'),
	conf = Config();
var pendingDir = conf.getPath("pending");


// Map of the queued time (when we requested the test), used to calculate waiting times on specific locations
var queuedTimes = new Map();

// Checks for tests in pending state, and tries to get the result if they're finished
function run () {
	// Read the contents of the status directory to get test Ids
	fs.readdir(pendingDir, function (err,  files) {
		if (err) return conf.log(err, true);

		conf.log("Found " + files.length + " pending tests.");

		files.forEach(function (file) {

			// For each file in pending, look for finished tests
			fs.readFile(pendingDir + file, function (err, data) {
				if (err) return conf.log(err, true);

				var result = JSON.parse(data);
				if (result.statusCode === 200) {
					checkTestStatus(result.data.testId, file);
				}

			});
		});
	});

}

// Checks if a test has been finished (by using wpt.org API). If so, process the results and cleans the files
function checkTestStatus (id, fileName) {

	var wpt = new WebPageTest('www.webpagetest.org', conf.getApiKey());
	var options = conf.get('testOptions');

	wpt.status( id, options, function (err, data) {
		if (err) return conf.log(err, true);

		switch(true) {
			case (data.statusCode === 200):
				queuedTimes.set(id, util.parseDateFromFile(fileName));
				wpt.results(id, options, processTestResult);
				// Delete the pending state file
				fs.unlink(pendingDir + fileName, ()=>{});

				break;
            case (data.statusCode < 200):
				// Still pending, keep waiting
				conf.log("Test " + id + " still running (" + data.statusText + ")");
				break;
			case (data.statusCode > 200):
			default:
				// Failed test or invalid ID
				break;
		}
	});
}


// Process the results and save the summary into a file
function processTestResult(err, result) {
	if (err) return conf.log(err, true);

    // console.log(result.data.runs);return;
	var test = new TestResult(result);
    var tests;
    var fileName = conf.getPath('results') + util.getFileNameFromUrl(test.domain);

	// Add starting time (not when the test actually started)
	test.queuedTime = queuedTimes.get(test.id);

    fs.stat(fileName, (err, stats) => {
        // File doesn't exist, create it.
        if (err) {
            tests = new TestResultCollection ();
            tests.add(test);
            fs.writeFile(fileName, tests, function() {});

        // File exists, overwrite it
        } else {
            fs.readFile(fileName, "utf-8", function(err, data) {
				if (err) return conf.log(err, true);

				try{
					tests = new TestResultCollection (JSON.parse(data));
					tests.addOrdered(test);
					fs.writeFile(fileName, tests, function() {});
				} catch(ex) {
					conf.log("Exception:" + ex.message);
				}
            });
        }
    });

	conf.log("Successfully gather results from test " + test.id);

}


// Run if file was invoked directly, otherwise leverage on outside script
if (util.isCalledFromCommandLine("checkForPendingTests.js")) {
	run();
}


module.exports = {run: run};
