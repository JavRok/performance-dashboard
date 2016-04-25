/*
 * Trigger a test on each of the sites array items. The tests results are not gathered, since it takes minutes
 * The results are gathered by checkForPendingTests.js, that needs to be run periodically
 */

// var sites = ['https://www.tele2.nl'];

var fs = require('fs');
var WebPageTest = require('webpagetest');

var Config = require('../Model/TestConfig.js');

function run () {
	var conf = new Config('./config.json');
	var wpt = new WebPageTest('www.webpagetest.org', conf.getApiKey());
	var locations = conf.get('locations');
	var sites = conf.get('sites');

	// Launch the test
	sites.forEach (function (url) {
		wpt.runTest(url, {'location': locations[0]} ,(err, result) => {

			if (err) return Config.log(err, true);
			if (result.statusCode !== 200) return Config.log(result.statusText, true);

			// File with timestamp and ID
			var filename = 'wpt.org.json/pending/' + Config.getDateTime() + "-" + result.data.testId + ".json";

            fs.writeFile(filename, JSON.stringify(result, null, 2), (err) => {
				if (err) {
					Config.log(err, true);
				} else {
					Config.log("Test launched, file created in "+ filename);
				}
			});
		});
	});
}


// Run if file was invoked directly, otherwise leverage on outside script
if (process && process.argv.length > 1 && process.argv[1].indexOf("launchTest.js") !== -1) {
	run();
}

module.exports = {run: run};