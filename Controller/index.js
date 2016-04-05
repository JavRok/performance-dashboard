/*
 * IMPORTANT: Tests are limited to 200 per day. Given a test per hour, we can run up to 8 sites.
 * Main loop of the backend application, that will run tests and gather results for later use
 */

var CheckForTests = require('./checkForPendingTests.js');
var LaunchTests = require('./launchTest.js');
var Config = require('../Model/TestConfig.js');
var conf = new Config('./config.json');

// Every 15 minutes
var checkTimeout = 15 * 60 * 1000;
// Every 1h
var launchTestTimeout = 60 * 60 * 1000;

Config.log("Starting the performance-dashboard application. Ctrl+C to terminate it.");

// Launch one test for every site in config.json
var testInterval = setInterval(() => {
	LaunchTests.run();
}, launchTestTimeout);


// Check for test results, for tests that are on pending state
var checkInterval = setInterval (() => {
	CheckForTests.run();
}, checkTimeout);


// Call it first time
// LaunchTests.run();
CheckForTests.run();
