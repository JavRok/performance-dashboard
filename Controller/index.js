/*
 * IMPORTANT: Tests are limited to 200 per day. Given a test per hour, we can run up to 8 sites.
 * Main loop of the backend application, that will run tests and gather results for later use
 */


/**************   Run express app to open the dashboard in a browser   **************/
require('../dashboardService.js');



/**************   Start the loop that will launch tests and gather results   **************/

var CheckForTests = require('./checkForPendingTests.js');
var LaunchTests = require('./launchTest.js');
var SaveHistory = require('./saveTestHistory.js');
var Config = require('../Model/TestConfig.js'),
	conf = Config();


// Every 15 minutes
var checkTimeout = 15 * 60 * 1000;
// Every 1h
var launchTestTimeout = 60 * 60 * 1000;
// Delay the execution 1 min to ensure check timer runs before
var delayTestLaunch = 60 * 1000;
// Every 24h
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
LaunchTests.run();