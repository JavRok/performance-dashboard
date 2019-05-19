/*
 * Promise wrapper for webpagetest module calls, original only has callbacks
 */

const conf = require('../Config');
const WebPageTest = require('webpagetest');

/*
 * Promisified wpt.runTest
 * @param {string} url
 * @param {string} preferredLocation - one of the locations on the config
 */
function wptRunTestPromise(url, preferredLocation) {
    return new Promise((resolve, reject) => {
        const options = conf.get('testOptions');
        if (preferredLocation) {
            options.location = preferredLocation;
        }
        const wpt = new WebPageTest(options.server, conf.getApiKey());
        wpt.runTest(url, options, (err, result) => {
            if (err) reject(err);
            resolve(result);
        })
    });
}


/*
 * Promisified wpt.results
 */
function wptResultsPromise(id) {
    return new Promise((resolve, reject) => {
        const options = conf.get('testOptions');
        const wpt = new WebPageTest(options.server, conf.getApiKey());
        wpt.results(id, options, (err, result) => {
            if (err) reject(err);
            resolve(result);
        })
    });
}

module.exports = {
    runTest: wptRunTestPromise,
    results: wptResultsPromise
};