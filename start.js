/*
 * Start point for the performance dashboard. Run with 'node start.js >> log/history.log'.
 * IMPORTANT: Tests are limited to 200 per day. Given a test per hour, we can run up to 8 sites. 
 */

/** ************   Run express app to open the dashboard in a browser   **************/
require('./Controller/dashboardService.js');


/** ************   Start the loop that will launch tests and gather results   **************/

const fs = require('fs');
const CheckForTests = require('./Controller/checkForPendingTests.js');
const LaunchTests = require('./Controller/launchTest.js');
const SaveHistory = require('./Controller/saveTestHistory.js');
const conf = require('./Config');

if (!conf) {
	console.log('ERROR!');
	process.exit();
} 


// Interval in hours, every hour by default
const launchTestTimeout = 60 * 60 * 1000 * conf.get('intervalInHours');
// Check 4 times for every test launched (by default every 15 mins)
const checkTimeout = launchTestTimeout / 4;
// Delay the execution 1 min to ensure check timer runs before
const delayTestLaunch = 60 * 1000;
// Every 24h we save the history
const saveHistoryTimeout = 24 * 60 * 60 * 1000;

conf.log('Starting the performance-dashboard application. Ctrl+C to terminate it.');

// Launch one test for every site in config
setTimeout(()=> {
	const testInterval = setInterval(() => {
		LaunchTests.run();
	}, launchTestTimeout);
}, delayTestLaunch);


// Check for test results, for tests that are on pending state
const checkInterval = setInterval (() => {
	CheckForTests.run();
}, checkTimeout);


// Save history every 24h
const historyInterval = setInterval (() => {
	SaveHistory.run();
}, saveHistoryTimeout);


// Call it first time
CheckForTests.run();
LaunchTests.run();




// Create folders if not existing (1st run)
const folderObj = conf.get('outputFolder');
if (typeof folderObj.subfolders === 'object') {
	for (let subfolder in folderObj.subfolders) {
    	if (folderObj.subfolders.hasOwnProperty(subfolder)) {
		checkDirectory(conf.getPath(subfolder), () => {});
	}
	}
}


/*
 * Check if a directory exists, and create it if it doesn't
 */
function checkDirectory(directory, callback) {
	fs.stat(directory, function (err, stats) {
        // Check if error defined and the error code is "not exists"
		if (err && err.code === 'ENOENT') {
            // Create the directory, call the callback.
			fs.mkdir(directory, callback);
		} else {
            // just in case there was a different error:
			callback(err)
		}
	});
}
