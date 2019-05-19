/*
 * Updated list of locations, with info about test load and waiting times
 */

const WebPageTest = require('webpagetest');
const conf = require('../Config');
const util = require('../Helper/util.js');

const averageTestTime = 40; // seconds
const maxWaitingTime = 100; // mins

class Locations {

	constructor(Storage) {
		this.storage = Storage;
		this.locations = [];
	}

	/*
	 * Constructor can't be async, so this fn needs to be called after 'new Locations()';
	 */
	async initFromStorage() {
		this.locations = this.storage.getLocations();
	}

	/*
	 * Filter the full locations array to only the ones in the config
	 * @param {Array|Object} the response array of objects coming from wpt api
	 * NOTE: Apparently if there's only 1 location, we get only an object
	 */
	filterConfigLocations(dataArray) {
		let preferredLocations = conf.get('locations').map(function (location) {
			// We need to remove the browser from the location
			return location.split(':')[0];
		});

		if (!Array.isArray(dataArray)) {
			dataArray.position = 0;
			return [dataArray];
		}
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
	 * Returns error in the callback function
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
			// When only 1 location, only the object is returned, not the array
			if (!Array.isArray(self.locations) && self.locations.Label) {
				self.locations = [this.locations];
			}
			// Write the file
			// fs.writeFile(locationsFile, JSON.stringify(self.locations, null, 2), () => {});
			cb(null);
		});
	}

	/*
	 * Same as update(), but returns a promise with the result
	 * @returns {Promise}
	 */
	updatePromise() {
		const wpt = new WebPageTest('www.webpagetest.org', conf.getApiKey());
		const options = conf.get('testOptions');
		const storage = this.storage;
		return new Promise((resolve, reject) => {
			wpt.getLocations(options, (err, result) => {
				if (err) {
					conf.log(err, true);
					return reject(err);
				}

				if (result.response.statusCode !== 200) {
					conf.log(result.response.statusText, true);
					return reject(new Error(result.response.statusText));
				}

				// Fill the array with usage data.
				this.locations = result.response.data.location;
				// When only 1 location, only the object is returned, not the array
				if (!Array.isArray(this.locations) && this.locations.Label) {
					this.locations = [this.locations];
				}

				// Save it to the storage
				storage.saveLocations(this.locations);
				resolve(this.locations);
			});
		})
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
	 * TODO: Set waiting time for a location, after a test has been retrieved
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


module.exports = Locations;
