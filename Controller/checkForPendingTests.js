/* This module checks for pending tests, run by launchTest.js before. */

"use strict";

var fs = require('fs');
var WebPageTest = require('webpagetest');
var url = require('url');

var TestResult = require('../Model/TestResult.js');
var TestResultCollection = require('../Model/TestResultCollection.js');
var Config = require('../Model/TestConfig.js');

var pendingDir = "wpt.org.json/pending/";


// Checks for tests in pending state, and tries to get the result if they're finished
function run () {
	// Read the contents of the status directory to get test Ids
	fs.readdir(pendingDir, function (err,  files) {
		if (err) return Config.log(err, true);

		Config.log("Found " + files.length + " pending tests.");

		files.forEach(function (file) {

			// For each file in pending, look for finished tests
			fs.readFile(pendingDir + file, function (err, data) {
				if (err) return Config.log(err, true);

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
	var conf = new Config('./config.json');

	var wpt = new WebPageTest('www.webpagetest.org', conf.getApiKey());

	wpt.status( id, function (err, data) {
		if (err) return Config.log(err, true);

		switch(true) {
			case (data.statusCode === 200):
				wpt.results(id, processTestResult);
				// Delete the pending state file
				fs.unlink(pendingDir + fileName, ()=>{});

				break;
            case (data.statusCode < 200):
				// Still pending, keep waiting
				Config.log("Test " + id + " still running (" + data.statusText + ")");
				break;
			case (data.statusCode > 200):
			default:
				// Failed test or invalid ID
				break;
		}
	});
}


String.prototype.trimRight = function(charlist) {
	if (charlist === undefined)
		charlist = "\s";

	return this.replace(new RegExp("[" + charlist + "]+$"), "");
};

// Returns a filename based on the URL being tested
function getFileName (testUrl) {
    var urlObj = url.parse(testUrl);
	var path = urlObj.pathname.replace(/\//g, "_");
	path = path.trimRight("_");

    return 'wpt.org.json/results/' + urlObj.hostname + path + '.json';
}


// Process the results and save the summary into a file
function processTestResult(err, result) {
	if (err) return Config.log(err, true);

    // console.log(result.data.runs);return;
	var test = new TestResult(result.data.id, result);
    var tests;
    var fileName = getFileName(test.domain);

    fs.stat(fileName, (err, stats) => {
        // File doesn't exist, create it.
        if (err) {
            tests = new TestResultCollection ();
            tests.add(test);
            fs.writeFile(fileName, tests, function() {});

        // File exists, overwrite it
        } else {
            fs.readFile(fileName, "utf-8", function(err, data) {
                tests = new TestResultCollection (JSON.parse(data));
                tests.addOrdered(test);
                fs.writeFile(fileName, tests, function() {});
            });
        }
    });

	Config.log("Successfully gather results from test " + test.id);

}

module.exports = {run: run};
