/* Test status Model. Current status of a launched test, can be finished, queued or failed */

const WebPageTest = require('webpagetest');
const conf = require('../Model/Config.js');
    // conf = Config();

class TestStatus {

	// constructor() {}

    /**
     * @callback getStatusCallback
     * @param {Error}
     * @param {Object}      status
     *  @param {bool}      status.finished - true if test results are ready
     *  @param {Number}    [status.position] - position in the queue if test is not yet ready
     */

	/**
	 * @param {Number} testId
	 * @param {getStatusCallback} cb
	 */
	getStatus(testId, cb) {
        const wpt = new WebPageTest('www.webpagetest.org', conf.getApiKey());
        const options = conf.get('testOptions');

        wpt.status( testId, options, function (err, data) {
            if (err) {
                cb(err);
                return;
			}

            switch(true) {
                case (data.statusCode === 200):
                	cb(null, {finished: true});
                    break;

                case (data.statusCode < 200):
                    // Still pending, keep waiting
                    conf.log("Test " + testId + " still running (" + data.statusText + ")");
					cb(null, {
					    finished: false,
                        position: data.data.behindCount
					});
                    break;

                case (data.statusCode > 200):
                default:
                    // Failed test or invalid ID
                    cb(new Error(data.statusText));
                    break;
            }
        });
	}
}

// Singleton, no need for instances
module.exports = new TestStatus();