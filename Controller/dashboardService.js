/*
 * Basic express app with a few endpoints
 * Run it, and open http://localhost:3030 on your browser
 */


if ( global.v8debug ) {
	global.v8debug.Debug.setBreakOnException(); // speaks for itself
}

var fs = require('fs');
var express = require('express');
var app = express();

var conf = require('../Model/Config.js');
	// conf = Config();
var TestResultCollection = require('../Model/TestResultCollection.js');
var resultsDir = conf.getPath('results');

app.use(express.static('public'));

app.get('/', function (req, res) {
	res.sendFile('index.html');
});


// Endpoint for existing URLs tested
app.get('/urls', function (req, res) {
	var result = [];

	fs.readdir(resultsDir, (err,  files) => {
		if (err) {
			return res.send(err);
		}

		files.forEach(function (file) {
			// Return the existing tests
			result.push(file.replace('.json', ''));
		});

		res.json(result);
	});
});


// Endpoint for getting test results for the last week(per hour for now)
app.get('/test/:name/week', function (req, res) {
	var fileName = conf.getPath('results') + req.params.name + '.json';

	fs.readFile(fileName, 'utf-8', function (err, data) {
		if (err) {
			return res.json({'status': 'error', 'data': 'Test not found'});
		}
		try {
			return res.json({'status': 'ok', 'data': JSON.parse(data)});
		} catch (ex) {
			return res.json({'status': 'error', 'data': ex});
		}
	});
});


// Endpoint for getting test results for a specific day (24h)
// Receives a named param day/1
app.get('/test/:name/day/:day', function (req, res) {
	var fileName = conf.getPath('results') + req.params.name + '.json';
	var day = parseInt(req.params.day) || 0;
	var testsCollection;

	fs.readFile(fileName, 'utf-8', function (err, data) {
		if (err) {
			return res.json({'status': 'error', 'data': 'Test not found'});
		}
		try {
			testsCollection = new TestResultCollection(JSON.parse(data));
			return res.json({'status': 'ok', 'data': testsCollection.get24hResults(day)});
		} catch (ex) {
			return res.json({'status': 'error', 'data': ex.message});
		}
	});
});


// Endpoint for getting test results for a specific month (Daily result)
// Receives a named param month/0
app.get('/test/:name/month/:month', function (req, res) {
	var fileName = conf.getPath('history') + req.params.name + '.json';
	var month = parseInt(req.params.month) || 0;
	var testsCollection;

	fs.readFile(fileName, 'utf-8', function (err, data) {
		if (err) {
			return res.json({'status': 'error', 'data': 'Test not found'});
		}
		try {
			testsCollection = new TestResultCollection(JSON.parse(data));
			return res.json({'status': 'ok', 'data': testsCollection.getMonthResults(month)});
		} catch (ex) {
			return res.json({'status': 'error', 'data': ex});
		}
	});
});




app.listen(3030, function () {
	conf.log('Dashboard app listening on http://localhost:3030');
});


