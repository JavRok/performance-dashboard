/*
 * Start point for the performance dashboard. Run with 'node start.js >> log/history.log'.
 * IMPORTANT: Tests are limited to 200 per day. Given a test per hour, we can run up to 8 sites. 
 */

/**************   Run express app to open the dashboard in a browser   **************/
require('./Controller/dashboardService.js');


/**************   Start the loop that will launch tests and gather results   **************/

var CheckForTests = require('./Controller/checkForPendingTests.js');
var LaunchTests = require('./Controller/launchTest.js');
var SaveHistory = require('./Controller/saveTestHistory.js');
var Config = require('./Model/TestConfig.js'),
	conf = Config();


// Interval in hours, every hour by default
var launchTestTimeout = 60 * 60 * 1000 * conf.get("intervalInHours");
// Check 4 times for every test launched (by default every 15 mins)
var checkTimeout = launchTestTimeout / 4;
// Delay the execution 1 min to ensure check timer runs before
var delayTestLaunch = 60 * 1000;
// Every 24h we save the history
var saveHistoryTimeout = 24 * 60 * 60 * 1000;

conf.log("Starting the performance-dashboard application. Ctrl+C to terminate it.");

// Launch one test for every site in config
setTimeout(()=> {
	var testInterval = setInterval(() => {
		LaunchTests.run();
	}, launchTestTimeout);
}, delayTestLaunch);


// Check for test results, for tests that are on pending state
var checkInterval = setInterval (() => {
	CheckForTests.run();
}, checkTimeout);


// Save history every 24h
var historyInterval = setInterval (() => {
	SaveHistory.run();
}, saveHistoryTimeout);


// Call it first time
CheckForTests.run();
// LaunchTests.run();