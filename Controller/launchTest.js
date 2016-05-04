/*
 * Trigger a test on each of the sites array items. The tests results are not gathered, since it takes minutes
 * The results are gathered by checkForPendingTests.js, that needs to be run periodically
 */

var fs = require('fs');
var WebPageTest = require('webpagetest');

var Config = require('../Model/TestConfig.js'),
	conf = Config();
var Util = require('../Helper/util.js');
var Locations = require('../Model/Locations.js'),
	locs = new Locations();


function run () {
	var wpt = new WebPageTest('www.webpagetest.org', conf.getApiKey());
	var location = locs.getBestLocation()
	var sites = conf.get('sites');

	// Launch the test
	sites.forEach (function (url) {
		wpt.runTest(url, {'location': location} ,(err, result) => {

			if (err) return conf.log(err, true);
			if (result.statusCode !== 200) return conf.log(result.statusText, true);
			// TODO: On error, select next location

			// File with timestamp and ID
			var filename = conf.getPath('pending') + Util.getDateTime() + "-" + result.data.testId + ".json";

            fs.writeFile(filename, JSON.stringify(result, null, 2), (err) => {
				if (err) {
					conf.log(err, true);
				} else {
					conf.log(`Test launched in ${location}, file created in ${filename}`);
				}
			});
		});
	});
}


// Run if file was invoked directly, otherwise leverage on outside script
if (Util.isCalledFromCommandLine("launchTest.js")) {
	run();
}

module.exports = {run: run};