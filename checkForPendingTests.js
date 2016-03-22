"use strict";

var fs = require('fs');
var WebPageTest = require('webpagetest');

var TestResult = require('./TestResult.js');

var pendingDir = "wpt.org.json/pending/";
var apiKey;

fs.readFile("wpt.org.json/api.key", "utf-8", function (err, key) {
	apiKey = key;
	if (err) return console.error(err);

	// Read the contents of the status directory to get test Ids
	fs.readdir(pendingDir, function (err,  files) {

		if (err) return console.error(err);

		files.forEach(function (file) {

			// For each file in pending, look for finished tests
			fs.readFile(pendingDir + file, function (err, data) {
				if (err) return console.error(err);

				var result = JSON.parse(data);
				if (result.statusCode === 200) {
					checkTestStatus(result.data.testId);
				}

			});
		});

	});

});


function checkTestStatus (id) {

	var wpt = new WebPageTest('www.webpagetest.org', apiKey);

	wpt.status( id, function (err, data) {
		if (err) return console.error(err);

		switch(true) {
			case (data.statusCode === 200):

				wpt.results(id, processTestResult);

				break;

			case (data.statusCode < 200):
				// Still pending, keep waiting
				break;
			case (data.statusCode > 200):
			default:
				// Failed test or invalid ID
				break;
		}
	});
}


function processTestResult(err, result) {
	if (err) return console.error(err);

	var test = new TestResult(result.data.id, result);
	console.log(test);
}