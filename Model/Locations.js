/*
 * Updated list of locations, with info about test load and waiting times
 */

const fs = require('fs');
const WebPageTest = require('webpagetest');
const conf = require('../Model/Config.js');
const util = require('../Helper/util.js');

const locationsFile = conf.get('outputFolder').path + '/locations.json';
let locations;
const averageTestTime = 40; // seconds

class Locations {

	constructor() {
		this.locations = fs.readFileSync(locationsFile, 'utf-8');
		// this.preferred = conf.get('locations');

		// Waiting time in minutes. Ensure that config order is maintained at first, by penalizing latest ones
		/*this.waitingTimes = this.preferred.map((location, i) => {
		 return 30 + i * 10;
		 });*/
	}

	/*
	 * Filter the full locations array to only the ones in the config
	 * @param {Array} the response array of objects coming from wpt api
	 */
	filterConfigLocations(dataArray) {
		let preferredLocations = conf.get('locations').map(function (location) {
			// We need to remove the browser from the location
			return location.split(':')[0];
		});

		return dataArray.filter(function (location) {
			let position = preferredLocations.indexOf(location.id);
			// Save user order preference
			if (position !== -1) {
				location.position = position;
				return true;
			}
			return false;
		});
	}

	/*
	 * Updates the list of locations and waiting times. Saves it on locations.json file
	 * Returns the list on the callback function
	 */
	update(cb) {
		const wpt = new WebPageTest('www.webpagetest.org', conf.getApiKey());
		let self = this;
		wpt.getLocations({}, (err, result) => {
			if (err) {
				conf.log(err, true);
				return cb(err);
			}
			if (result.response.statusCode !== 200) {
				conf.log(result.response.statusText, true);
				return cb(new Error(result.response.statusText));
			}

			// Fill the array with usage data.
			self.locations = result.response.data.location;
			// Write the file
			fs.writeFile(locationsFile, JSON.stringify(self.locations, null, 2), () => { });
			cb(null);
		});
	}

	// TODO: Check queue in every location (use weight)
	// Call update() once before using this function
	getBestLocation() {

		if (!this.preferred) {
			const filteredLocations = this.filterConfigLocations(this.locations);
			const waitingTimes = filteredLocations.map(this.calculateWaitingTime);
			const bestLocation = filteredLocations[util.minPos(waitingTimes)]
			this.preferred = conf.get('locations')[bestLocation.position];
		}

		// return this.preferred;
		return this.preferred;
	}


	/*
	 * Calculates a location estimated waiting time, by the state of the queue
	 * The locations list order in the config is taken into account by penalizing the last ones
	 * @return {Number} time in minutes
	 */
	calculateWaitingTime(location) {
		const penalizationSecs = 600;
		// Number of parallel tests that can be run on this location
		const agents = location.PendingTests.Testing + location.PendingTests.Idle;

		// Calculated time for our test to begin (in secs)
		let estimatedTime = location.PendingTests.Total * averageTestTime / agents;
		// Add weight depending on the users preference list position
		estimatedTime += location.position * penalizationSecs;

		return Math.ceil(estimatedTime / 60);
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
