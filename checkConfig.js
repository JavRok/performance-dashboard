/*
 * This script is meant for 1st time run as a helper.
 * Run this file to check that the config.js file is correct.
 * -> node checkConfig.js
 */
const conf = require('./Config');
const Locations = require('./Model/Locations.js');

const getLocations = async () => {
	try {
		const serverLocations = await Locations.getLocationsPromise();
		const configLocations = conf.get('locations');
		const browsers = getBrowsers(serverLocations);

		configLocations.forEach(location => {
			const parts = location.split(':');
			let locationBrowsers = browsers.find(browserObj => browserObj.name === parts[0]);
			if (!locationBrowsers) {
				console.log(`\nERROR location ${parts[0]} not found, use one of the following: `);
				console.log(browsers.map(browserObj => browserObj.name).join(', '));
				process.exit();
			} else {
				// Check list of browsers
				if (!locationBrowsers.browsers.includes(parts[1])) {
					console.log(`\nERROR browser ${parts[1]} not found, use one of the following: `);
					console.log(locationBrowsers.browsers);
					process.exit();
				}
			}
		});

		console.log('\nCONFIG OK\n');

	} catch (err) {
		if (err.code) {
			switch (err.code) {
				case 'ENOTFOUND':
					console.log('\nERROR reaching the wpt.org server, please check the address is correct in config.js:');
					console.log(`Hostname: ${err.hostname} \nHost: ${err.host}`);
					break;
				default:
					console.log(`Error getting locations: ${err}`);
			}
		} else {
			console.log(`Error getting locations: ${err}`);
		}
	}
};

function getBrowsers(locations) {
	console.log('locations',locations);
	return locations.map( location => {
		return {
			name: location.id,
			browsers: location.Browsers.split(',')
		}
	});
}

getLocations();