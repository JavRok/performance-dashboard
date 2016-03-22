
var sites = ['https://www.tele2.nl'];

var fs = require('fs');
var WebPageTest = require('webpagetest');

fs.readFile("wpt.org.json/api.key", "utf-8", function (err, apiKey) {

	var wpt = new WebPageTest('www.webpagetest.org', apiKey);

	// Launch the test
	sites.forEach (function (url) {
		wpt.runTest(url, function(err, result) {
			if (err) return console.error(err);
			if (result.status !== 200) return console.error(result.statusText);

			// File with timestamp and ID
			var filename = 'wpt.org.json/pending/' + getDateTime() + "-" + result.data.testId;
			fs.writeFile(filename, JSON.stringify(result, null, 2), (err) => {
				if (err) {
					console.error(err);
				} else {
					console.log("Test launched, file created in "+ filename);
				}
			});
		});
	});
});




/* Get Date Time in a filename friendly format */
function getDateTime() {

	var date = new Date();

	var hour = date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;

	var min  = date.getMinutes();
	min = (min < 10 ? "0" : "") + min;

	var sec  = date.getSeconds();
	sec = (sec < 10 ? "0" : "") + sec;

	var year = date.getFullYear();

	var month = date.getMonth() + 1;
	month = (month < 10 ? "0" : "") + month;

	var day  = date.getDate();
	day = (day < 10 ? "0" : "") + day;

	return year + "" + month + "" + day + "-" + hour + "" + min + "" + sec;

}