/*
 * Updated list of locations, with info about test load and waiting times
 */

const fs = require('fs');
const WebPageTest = require('webpagetest');
const conf = require('../Model/Config.js');
const util = require('../Helper/util.js');

const locationsFile = conf.get('outputFolder').path + '/locations.json';
let locations;

class Locations {

	constructor() {
		this.locations = fs.readFileSync(locationsFile, 'utf-8');
		this.preferred = conf.get('locations');

		// Waiting time in minutes. Ensure that config order is maintained at first, by penalizing latest ones
		this.waitingTimes = this.preferred.map((location, i) => {
			return 30 + i * 10;
		});
	}

	update() {
		const wpt = new WebPageTest('www.webpagetest.org', conf.getApiKey());
		wpt.getLocations({}, (err, result) => {
			if (err) return conf.log(err, true);
			if (result.response.statusCode !== 200) return conf.log(result.response.statusText, true);

			// Fill the array with usage data.
			this.locations = result.response.data;
			// Write the file
			fs.writeFile(locationsFile, JSON.stringify(this.locations, null, 2), ()=>{});
		});
	}

	// TODO: Check queue in every location (use weight)
	getBestLocation() {
		if (!this.preferred) {
			this.preferred = conf.get('locations');
		}
		return this.preferred[util.minPos(this.waitingTimes)];
	}

	/*
	 * TODO: something with this
	 * Set waiting time for a location, after a test has been retrieved
	 * @return {bool}
	 */
	setLocationWaitingTime(locationId, minutes) {
		const position = this.preferred.indexOf(locationId);
		if (position === -1) {
			return false;
		}
		waitingTimes[position] = minutes;
		return true;
	}

}

/* FIXME: Singleton pattern, probably doesn't work this way. Use symbols to make it real singleton */
const createLocation = function createLocation() {
	if (!locations) {
		locations = new Locations();
	}
	return locations;
};

module.exports = createLocation();
