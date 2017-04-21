/*
 * Trigger a test on each of the sites array items. The tests results are not gathered, since it takes minutes
 * The results are gathered by checkForPendingTests.js, that needs to be run periodically
 */

const fs = require('fs');
const WebPageTest = require('webpagetest');

const conf = require('../Model/Config.js');
const Util = require('../Helper/util.js');
const testStatus = require('../Model/TestStatus');
const locations = require('../Model/Locations.js');



function run() {
	const sites = conf.get('sites');

    // Read the contents of the status directory to get pending tests
	getExistingTests(function (err, existingTests) {
		if (err) return conf.log(err, true);

        // Launch a test for each configure site
		sites.forEach (function (url) {

			if (existingTests.has(url)) {
				testStatus.getStatus(existingTests.get(url), function (err2, status) {
					if (err2) return conf.log(err2, true);

					if (status.finished) {
						launchTest(url);
					} else {
                        // TODO: If the queue is too long, launch the test in a different server
                        // status.position;
					}

				});
			}

		});
	});
}


/**
 * @callback getExistingTestsCallback
 * @param {Error}
 * @param {Map}    map with key = url, and value = testID
 */

/**
 * Get the existing tests from pending folder
 * @param {getExistingTestsCallback} cb Callback with the current pending tests
 */
function getExistingTests(cb) {
    // Read the contents of the status directory to get pending tests
	const pendingDir = conf.getPath('pending');
	fs.readdir(pendingDir, function (err,  files) {
		if (err) cb(err);

		files = files.map((file) => {return pendingDir + file});

        // For each file in pending, get test id and url, with a Promise
		Promise.all(files.map(readStatusFile))
			.then(statuses => {
				cb(null, new Map(statuses));
			});
	});
}

/*
 * @return {Promise.<Object>} If succeeds, returns a TestResultCollection object
 */
function readStatusFile(fileName) {
	return new Promise(function (resolve) {
		fs.readFile(fileName, 'utf-8', function (err, data) {
			if (err) {
                // Never reject, just return empty result
				return resolve(null);
			}
			try {
				const result = JSON.parse(data);
				resolve([result.url, result.data.testId]);
			} catch (ex) {
				resolve(null);
			}
		});
	});
}





function launchTest(url) {

	const wpt = new WebPageTest('www.webpagetest.org', conf.getApiKey());
	const options = conf.get('testOptions');
	options.location = locations.getBestLocation();
	const customScripts = conf.get('customScripts');

    // Set custom script if existing (overwrites url)
	if (customScripts && customScripts[url]) {
		url =  wpt.scriptToString(customScripts[url]);
	}

	wpt.runTest(url, options , (err, result) => {

		if (err) return conf.log(err, true);
		if (result.statusCode !== 200) return conf.log(result.statusText, true);
        // TODO: On error, select next location

        // File with timestamp and ID
		const filename = conf.getPath('pending') + Util.getDateTime() + '-' + result.data.testId + '.json';

		result.url = url;
		result.launchedOn = new Date().toLocaleString();

		fs.writeFile(filename, JSON.stringify(result, null, 2), (err2) => {
			if (err2) {
				conf.log(err2, true);
			} else {
				conf.log(`Test launched in ${options.location}, file created in ${filename}`);
			}
		});
	});
}

/*function checkIfAlreadyExists(url) {
	files.forEach(function (file) {
        // For each file in pending, look for finished tests

	});
}*/


// Run if file was invoked directly, otherwise leverage on outside script
if (Util.isCalledFromCommandLine('launchTest.js')) {
	run();
}

module.exports = {run: run};