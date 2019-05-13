/* Test status Model. Current status of a launched test, can be finished, queued or failed */

const WebPageTest = require('webpagetest');
const conf = require('../Config');

class TestStatus {

	/**
	 * @typedef testStatus
	 * @type {Object}
	 * @property {bool} finished
	 * @property {number} position - indicates current position in the server queue
	 * @property {string} id - Test id
	 */

	/**
	 * Gets the status from the server for 1 or more tests. Returns a promise.
	 * @param {Number|Array} testId single or multiple (array) of test Ids
	 * @returns {Promise}
	 * @resolve {testStatus}
	 * @rejects  {Error}
	 */
	getStatus(testId) {
		return new Promise(function (resolve, reject) {

			const wpt = new WebPageTest('www.webpagetest.org', conf.getApiKey());
			const options = conf.get('testOptions');

			wpt.status(testId, options, function (err, data) {
				if (err) {
					reject(err);
					return;
				}

				switch (true) {
					case (data.statusCode === 200):
						resolve({finished: true, position: -1, id: testId});
						break;

					case (data.statusCode < 200):
						// Still pending, keep waiting
						conf.log('Test ' + testId + ' still running (' + data.statusText + ')');
						resolve({
							finished: false,
							position: data.data.behindCount,
							location: data.data.location,
							id: testId
						});
						break;

					case (data.statusCode > 200):
					default:
						// Failed test or invalid ID
						reject(new Error('ID ' + testId + ' ' + data.statusText));
						break;
				}
			});
		});
	}

	/**
	 * Gets status for several tests in a single promise
	 * @param {Array.<string>} testIds
	 * @returns {Promise|null}
	 * @resolve {Array.<testStatus>}
	 * @rejects  {Error}
	 */
	getStatusMultiple(testIds) {
		if (!testIds || !Array.isArray(testIds)) return null;
		return Promise.all(testIds.map(this.getStatus));
	}

	/*
	 *
	 */
}

// Singleton, no need for instances
module.exports = new TestStatus();
