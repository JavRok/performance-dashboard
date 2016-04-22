// Basic express app with a few endpoints

"use strict";

var fs = require('fs');
var express = require('express');
var app = express();

var resultsDir = "wpt.org.json/results/";

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
			result.push(file.replace(".json", ""));
		});

		res.json(result);
	});
});


// Endpoint for getting test results (per hour for now)
app.get('/test/:name', function (req, res) {
	var fileName = "wpt.org.json/results/" + req.params.name + ".json";

	fs.readFile(fileName, "utf-8", function(err, data) {
		if (err) {
			return res.json({"status": "error", "data": "Test not found"});
		}
		try {
			return res.json({"status": "ok", "data": JSON.parse(data)});
		} catch(ex) {
			return res.json({"status": "error", "data": ex});
		}
	});
});



app.listen(3030, function () {
	console.log('Dashboard app listening on http://localhost:3030');
});


