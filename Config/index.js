/*
 * Config for the tests, including sites to test, locations and API key
 * Uses singleton pattern
 */

const fs = require('fs');
const defaultConfig = __dirname + '/config.json';
const apiFile = __dirname + '/api.key';
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

	/*
	 * @return {array} urls stripped down (no protocol or params) f.i. to save into file
	 */
	getTransformedURLs () {
		const sites = this.get('sites');

		if (sites.groups) {
			// Rebuild object replacing urls with filenames
			return {
				'groups': sites.groups.map((group) => ({
						'label': group.label,
						'urls': group.urls.map(util.urlToName)
					})
				)
			}
		}
		return sites.map(util.urlToName);
	}

	getFilenames() {

	}


	/**
	 * Log everything with a timestamp
	 * @param {string|Error} text
	 * @param {bool=} error - is it an error text?
	 */
	log(text, error) {
		if (text instanceof Error) {
			console.error(util.getDateTime() + ': [ERROR] ' + text, text.stack);
		} else if (error) {
			console.error(util.getDateTime() + ': [ERROR] ' + text);
		} else {
			console.log(util.getDateTime() + ': ' + text);
		}
	}

}

const createConfig = function createConfig() {
	if (!config) {
		config = new Config(defaultConfig);
	}
	return config;
};



module.exports = createConfig();