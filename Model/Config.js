/*
 * Config for the tests, including sites to test, locations and API key
 * Uses singleton pattern
 */

const fs = require('fs');
const defaultConfig = "./config.json";
const util = require('../Helper/util.js');

let config;


class Config {
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

	// Returns a folder path
	getPath(folder) {
		return this.config.outputFolder.path + "/" + this.config.outputFolder.subfolders[folder] + "/";
	}

	// Log everything with a timestamp
	log (text, error) {
		if (error) {
			console.error(util.getDateTime() + ": [ERROR] " + text);
		} else {
			console.log(util.getDateTime() + ": " + text);
		}

	}

}

const createConfig = function createConfig() {
	if (!config) {
		config = new Config(defaultConfig);
	}
	return config;
}



module.exports = createConfig();