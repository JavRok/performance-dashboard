/*
 * Trigger a test on each of the sites array items. The tests results are not gathered, since it takes minutes
 * The results are gathered by checkForPendingTests.js, that needs to be run periodically
 */

const fs = require('fs');
const WebPageTest = require('webpagetest');

const conf = require('../Config');
const Util = require('../Helper/util.js');
const testStatus = require('../Model/TestStatus');
const locations = require('../Model/Locations.js');

// Limit where we consider the queue stuck, so we launch another test
const stuckQueueLimit = 100;

function run() {
	const sites = conf.get('sites');

    // Read the contents of the status directory to get pending tests
	getExistingTests(function (err, existingTests) {
		if (err) return conf.log(err);

		// Update the locations with server current info, needed to avoid overloaded servers
		locations.update(function (err2) {

			if (err2) return;

			let bestLocation = locations.getBestLocation();
			if (!bestLocation) {
				return conf.log('All servers are overloaded, consider adding more locations in the config', true);
			}

			// Launch a test for each configured site
			sites.forEach (function (url) {

				if (existingTests.has(url)) {
					let existing = existingTests.get(url);

					if (existing.length) {

						// There are several pending tests for the same url
						testStatus.getStatusMultiple(existing)
							.then(function (statuses) {
								// Get the one in a better position in the queue
								let bestExisting = statuses.reduce(function (acc, status) {
									return (status.position < acc.postion) ? status : acc;
								});

								// If the queue is too long, launch the test in a different server
								if (bestExisting.finished || bestExisting.position > stuckQueueLimit) {
									launchTest(url, bestLocation);
								}
							}).catch(conf.log);
					} else {
						testStatus.getStatus(existing).then(function (status) {
							// If the queue is too long, launch the test in a different server
							if (status.finished || status.position > stuckQueueLimit) {
								launchTest(url, bestLocation);
							}
						}).catch(conf.log);
					}

				} else {
					launchTest(url, bestLocation);
				}
			});
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
 * IMPORTANT: Merges duplicated tests into an array
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
				let statusMap = new Map();
				statuses.forEach(function (status) {
					// Merge duplicates
					if (statusMap.has(status[0])) {
						let previousMap = statusMap.get(status[0]);
						statusMap.set(status[0], [status[1]].concat(previousMap));
					} else {
						statusMap.set(status[0], status[1]);
					}
				});
				cb(null, statusMap);
			})
			.catch(cb);
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




/*
 * Launches a test for the provided URL. Checks config for custom scripts
 * @param {string} url of the site to test
 * @param {string} already selected best location
 */
function launchTest(url, bestLocation) {
	const wpt = new WebPageTest('www.webpagetest.org', conf.getApiKey());
	const options = conf.get('testOptions');
	const customScripts = conf.get('customScripts');
	let scriptUrl = url;

	options.location = bestLocation || locations.getBestLocation();

    // Set custom script if existing (overwrites url)
	if (customScripts && customScripts[url]) {
		scriptUrl =  wpt.scriptToString(customScripts[url]);
	}

	wpt.runTest(scriptUrl, options , (err, result) => {

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



// Run if file was invoked directly, otherwise leverage on outside script
if (Util.isCalledFromCommandLine('launchTest.js')) {
	run();
}

module.exports = {run: run};