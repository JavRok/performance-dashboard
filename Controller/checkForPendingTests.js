/**
 * This module checks for pending tests, run by launchTest.js before.
 */

const conf = require('../Config');
const TestResult = require('../Model/TestResult.js');
const testStatus = require('../Model/TestStatus.js');
const PendingTests = require('../Model/PendingTests');
const util = require('../Helper/util.js');
const wptPromise = require('../Helper/wptPromise');


// Checks for tests in pending state, and tries to get the result if they're finished
async function run(storage) {

	try {
		const pendingTests = new PendingTests(storage);
		await pendingTests.getFromStorage();
		// getAll returns a Map of urls with pending tests
		const pendingMap = pendingTests.getAll();
		conf.log('Found ' + pendingMap.size + ' pending tests.');

		let status;
		for ([url, test] of pendingMap) {
			// If an array is returned, it means there are more than one pending test for this url
			if (Array.isArray(test)) {
				const statuses = await testStatus.getStatusMultiple(test.map( t => t.data.testId));
				for (status of statuses) {
					if(status.finished) {
						// TODO: Promise.all
						await gatherResults(status.id, url);
					}
				}
			} else {
				status = await testStatus.getStatus(test.data.testId);
				if(status.finished) {
					// gather result
					await gatherResults(status.id, url);
				}
			}
		}
	} catch (err) {
		conf.log(err);
	}


	async function gatherResults (id, url) {
		try {
			const result = await wptPromise.results(id);
			const test = new TestResult(result);
			const existingTests = await storage.retrieveResultsCollection(url);
			existingTests.addOrdered(test);
			await storage.saveResultsCollection(url, existingTests);

			conf.log(`Stored successfully results for test ${id} from ${url}`);

			// Delete the pending state from the storage
			await storage.removePendingTest(id, url);

		} catch (err) {
			conf.log('There was an error gathering results from test ' + id);
			throw Error(err);
		}
	}
}


// Run if file was invoked directly, otherwise leverage on outside script
if (util.isCalledFromCommandLine('checkForPendingTests.js')) {
	conf.getStorage().then(storage => run(storage));
}


module.exports = {run: run};
