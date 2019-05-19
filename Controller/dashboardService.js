/*
 * Basic express app with a few endpoints
 * Run it, and open http://localhost:3030 on your browser
 */

const fs = require('fs');
const express = require('express');
const app = express();
const conf = require('../Config');

app.use(express.static('public'));

app.get('/', function (req, res) {
	res.sendFile('index.html');
});


// Endpoint for existing URLs tested
app.get('/urls', function (req, res) {
	res.json(conf.getTransformedURLs());
});


/*
 * Endpoint for getting test results for a specific day (24h)
 * Receives a named param day/1
 */
app.get('/test/:name/day/:day', (req, res) => {
	const day = parseInt(req.params.day) || 0;

	conf.getStorage()
		.then(storage => {
			return storage.retrieveResultsCollection(req.params.name);
		})
		.then(tests => {
			res.json({'status': 'ok', 'data': tests.get24hResults(day)});
		})
		.catch(err => res.json({'status': 'error', 'data': err.message}));
});


/*
 * Endpoint for getting test results for a specific month (Daily result)
 * Receives a named param month/0
 */
app.get('/test/:name/month/:month', function (req, res) {
	const month = parseInt(req.params.month) || 0;

	conf.getStorage()
		.then(storage => {
			return storage.retrieveHistoryCollection(req.params.name);
		})
		.then(tests => {
			res.json({'status': 'ok', 'data': tests.getMonthResults(month)});
		})
		.catch(err => res.json({'status': 'error', 'data': err.message}));
});



// Endpoint for getting test results for the last week(per hour for now)
// app.get('/test/:name/week', function (req, res) {
// 	const  fileName = conf.getPath('results') + req.params.name + '.json';
//
// 	fs.readFile(fileName, 'utf-8', function (err, data) {
// 		if (err) {
// 			return res.json({'status': 'error', 'data': 'Test not found'});
// 		}
// 		try {
// 			return res.json({'status': 'ok', 'data': JSON.parse(data)});
// 		} catch (ex) {
// 			return res.json({'status': 'error', 'data': ex});
// 		}
// 	});
// });




app.listen(3000, function () {
	conf.log('Dashboard app listening on http://localhost:3000');
});


