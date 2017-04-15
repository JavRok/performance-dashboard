/*
 * Trigger a test on each of the sites array items. The tests results are not gathered, since it takes minutes
 * The results are gathered by checkForPendingTests.js, that needs to be run periodically
 */

const  fs = require('fs');
const  WebPageTest = require('webpagetest');

const  Config = require('../Model/Config.js'),
	conf = Config();
const  Util = require('../Helper/util.js');
const  Locations = require('../Model/Locations.js'),
	locs = Locations();


function run () {
	const wpt = new WebPageTest('www.webpagetest.org', conf.getApiKey());
	const sites = conf.get('sites');
	const options = conf.get('testOptions');
	const customScripts = conf.get("customScripts");
	options.location = locs.getBestLocation();


	// Launch the test
	sites.forEach (function (url) {

		// Set custom script if existing (overwrites url)
		if (customScripts && customScripts[url]) {
			url =  wpt.scriptToString(customScripts[url]);
		}

		wpt.runTest(url, options , (err, result) => {

			if (err) return conf.log(err, true);
			if (result.statusCode !== 200) return conf.log(result.statusText, true);
			// TODO: On error, select next location

			// File with timestamp and ID
			const filename = conf.getPath('pending') + Util.getDateTime() + "-" + result.data.testId + ".json";

            fs.writeFile(filename, JSON.stringify(result, null, 2), (err) => {
				if (err) {
					conf.log(err, true);
				} else {
					conf.log(`Test launched in ${options.location}, file created in ${filename}`);
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