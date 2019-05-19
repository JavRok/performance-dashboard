/*
 * Trigger a test on each of the sites array items. The tests results are not gathered, since it takes minutes
 * The results are gathered by checkForPendingTests.js, that needs to be run periodically
 */

const conf = require('../Config');
const Util = require('../Helper/util.js');
const testStatus = require('../Model/TestStatus');
const Locations = require('../Model/Locations.js');
const PendingTests = require('../Model/PendingTests');
const wptPromise = require('../Helper/wptPromise');

// Limit where we consider the queue stuck, so we launch another test
const stuckQueueLimit = 100;
const stuckHoursLimit = 8;

async function run(storage) {
	try {
		const sites = conf.getAllSites();
		const pendingTests = new PendingTests(storage);
		await pendingTests.getFromStorage();

		// Update locations from server
		const locations = new Locations(storage);
		await locations.updatePromise();
		let bestLocation = locations.getBestLocation();
		if (!bestLocation) {
			return conf.log('All servers are overloaded, consider adding more locations in the config', true);
		}

		// Launch a test for each configured site
		let status, shouldLaunchTest;
		for(url of sites) {
			let existing = pendingTests.get(url);
			shouldLaunchTest = true;

			if (existing) {
				// If an array is returned, it means there are more than one pending test for this url
				if (Array.isArray(existing)) {
					const statuses = await testStatus.getStatusMultiple(existing.map( t => t.data.testId));
					for (status of statuses) {
						shouldLaunchTest = await shouldLaunchNewTest(status, url, new Date(existing.launchedOn));
						if (!shouldLaunchTest) break;
					}
				} else {
					status = await testStatus.getStatus(existing.data.testId);
					shouldLaunchTest = await shouldLaunchNewTest(status, url, new Date(existing.launchedOn));
				}
			}

			if (shouldLaunchTest) {
				await launchTest(url, bestLocation);
			} else {
				conf.log(`There's already a pending test, so we wait (url ${url})`);
			}
		}

	} catch (err) {
		conf.log(err);
		throw Error(err);
	}

	/*
	 * Decide, looking at existing pending test(s), if we should launch a new one
	 * This function also deletes stuck tests from the storage system
	 * @param {TestStatus} status of the pending test
	 * @param {string} url of the test
	 * @param {Date} launchedOn - Date when test was launched
	 */
	async function shouldLaunchNewTest (status, url, launchedOn) {
		if (status.finished) {
			return false;   // checkForPendingTests will gather these results soon
		}

		// If there's a recent test still pending, we wait a little bit more
        const hoursAgo = (new Date() - launchedOn) / 1000 / 60 / 60;
		if (hoursAgo < conf.get('intervalInHours') * 2) {
			return false;
		}

		// If a test is considered stuck (queue or time), remove it
		if (hoursAgo > stuckHoursLimit || status.position > stuckQueueLimit) {
			await storage.removePendingTest(status.id, url);
			conf.log(`Test ${status.id} with url ${url} was stuck, so had to be removed`);
		}

		return true;
	}


	/*
	 * Launches a test for the provided URL. Checks config for custom scripts
	 * @param {string} url of the site to test
	 * @param {string} already selected best location
	 */
	async function launchTest(url, bestLocation) {
		const scriptUrl = conf.getCustomScript(url);
		const result = await wptPromise.runTest(scriptUrl, bestLocation);
		if (result.statusCode !== 200) return conf.log(result.statusText, true);
		// TODO: On error, select next location

		result.url = url;
		result.launchedOn = new Date().toLocaleString();
		result.location = bestLocation;

		await storage.addPendingTest(result);
	}
}


// Run if file was invoked directly, otherwise leverage on outside script
if (Util.isCalledFromCommandLine('launchTest.js')) {
	conf.getStorage().then(storage => run(storage));
}

module.exports = {run: run};
