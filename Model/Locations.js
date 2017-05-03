/*
 * Updated list of locations, with info about test load and waiting times
 */

const fs = require('fs');
const WebPageTest = require('webpagetest');
const conf = require('../Config');
const util = require('../Helper/util.js');

const locationsFile = conf.get('outputFolder').path + '/locations.json';
let location;
const averageTestTime = 40; // seconds
const maxWaitingTime = 100; // mins

class Locations {

	constructor() {
		try {
			const data = fs.readFileSync(locationsFile, 'utf-8');
			this.locations = JSON.parse(data);
		} catch (e) {
			this.locations = [];
		}
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
		const options = conf.get('testOptions');
		let self = this;
		wpt.getLocations(options, (err, result) => {
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

	/*
	 * Call update() once before using this function
	 */
	getBestLocation() {

		const locations = conf.get('locations');
		const filteredLocations = this.filterConfigLocations(this.locations);
		const waitingTimes = filteredLocations.map(this.calculateWaitingTime);
		const bestLocation = filteredLocations[util.minPos(waitingTimes)];

		// If all are overloaded, there's no 'best location'
		if (this.calculateWaitingTime(bestLocation) > maxWaitingTime) {
			return null;
		}

		this.preferred = locations[bestLocation.position];
		this.logLocationWaitingTimes(filteredLocations, waitingTimes, this.preferred);

		return this.preferred;
	}

	/*
	 * Shows in the command line the estimating waiting times
	 */
	logLocationWaitingTimes(locations, waitingTimes, preferred) {

		console.log('Estimated waiting times (mins): ',
			new Map(
				// zip array for the Map
				locations.map((x, i) =>
					[x.Label, waitingTimes[i]]
				)
			),
			'\nUsing ' + preferred
		);


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
	/*setLocationWaitingTime(locationId, minutes) {
		const position = this.preferred.indexOf(locationId);
		if (position === -1) {
			return false;
		}
		waitingTimes[position] = minutes;
		return true;
	}*/

}

/* FIXME: Singleton pattern, probably doesn't work this way. Use symbols to make it real singleton */
const createLocation = function createLocation() {
	if (!location) {
		location = new Locations();
	}
	return location;
};

module.exports = createLocation();
