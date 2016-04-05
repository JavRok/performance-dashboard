/* Config for the tests, including sites to test, locations and API key */
"use strict";

var fs = require('fs');

class TestConfig {
	constructor (filePath) {
		this.config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
	}

	getApiKey () {
		if (this.ApiKey) {
			return this.ApiKey;
		} else {
			return fs.readFileSync("./wpt.org.json/api.key", "utf-8");
		}
	}

	get (prop) {
		return this.config[prop];
	}

	/* Get Date Time in a filename friendly format */
	static getDateTime() {

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

	/* Log everything with a timestamp */
	static log (text, error) {
		if (error) {
			console.error(this.getDateTime() + ": [ERROR] " + text);
		} else {
			console.log(this.getDateTime() + ": " + text);
		}

	}

}

module.exports = TestConfig;