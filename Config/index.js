/*
 * Config for the tests, including sites to test, locations and API key
 * Uses singleton pattern
 */

const fs = require('fs');
const defaultConfig = './config.json';
const apiFile = './api.key';
const util = require('../Helper/util.js');

let config;


class Config {
	constructor(filePath) {
		filePath = filePath || defaultConfig;
		this.config = require(filePath);
	}

	getApiKey() {
		if (!this.ApiKey) {
			this.ApiKey = fs.readFileSync(apiFile, 'utf-8');
		}
		return this.ApiKey;
	}

	get(prop) {
		return this.config[prop];
	}

	// Returns a folder path
	getPath(folder) {
		return this.config.outputFolder.path + '/' + this.config.outputFolder.subfolders[folder] + '/';
	}

	// Log everything with a timestamp
	log(text, error) {
		if (error) {
			console.error(util.getDateTime() + ': [ERROR] ' + text);
		} else {
			console.log(util.getDateTime() + ': ' + text);
		}

	}

}

const createConfig = function createConfig() {
	if (!config) {
		console.log("new Config instance");
		config = new Config(defaultConfig);
	}
	return config;
}



module.exports = createConfig();