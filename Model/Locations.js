/*
 * Updated list of locations, with info about test load and waiting times
 */
"use strict";

var fs = require('fs');
var WebPageTest = require('webpagetest');
var Config = require('../Model/Config.js'),
	conf = Config();
var util = require('../Helper/util.js')

var locationsFile = conf.get("outputFolder").path + "/locations.json";

var locations;

class Locations {

	constructor (filePath) {
		this.locations = fs.readFileSync(locationsFile, "utf-8");
		this.preferred = conf.get('locations');

		// Waiting time in minutes. Ensure that config order is maintained at first, by penalizing latest ones
		this.waitingTimes = this.preferred.map((location, i) => {
			return 30 + i * 10;
		});
	}

	update() {
		var wpt = new WebPageTest('www.webpagetest.org', conf.getApiKey());
		wpt.getLocations({}, (err, result) => {
			if (err) return conf.log(err, true);
			if (result.response.statusCode !== 200) return conf.log(result.response.statusText, true);

			// Fill the array with usage data.
			this.locations = result.response.data;
			// Write the file
			fs.writeFile(locationsFile, JSON.stringify(this.locations, null, 2), ()=>{});
		});
	}

	getBestLocation() {
		if (!this.preferred) {
			this.preferred = conf.get('locations');
		}
		return this.preferred[util.minPos(this.waitingTimes)];
	}

	/*
	 * Set waiting time for a location, after a test has been retrieved
	 * @return {bool}
	 */
	setLocationWaitingTime(locationId, minutes) {
		var position = this.preferred.indexOf(locationId);
		if (position === -1) {
			return false;
		}
		waitingTimes[position] = minutes;
		return true;
	}

}

/* Singleton pattern */
var createLocation = function createLocation() {
	if (!locations) {
		locations = new Locations();
	}
	return locations;
}

module.exports = createLocation;
