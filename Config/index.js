/*
 * Config for the tests, including sites to test, locations and API key
 * Uses singleton pattern
 */

const fs = require('fs');
const apiFile = __dirname + '/api.key_example';
const util = require('../Helper/util.js');
let config;

class Config {
	constructor(config) {
		this.config = require(__dirname + '/config.js');
	}

	getApiKey() {
		if (!this.ApiKey) {
			this.ApiKey = fs.readFileSync(apiFile, 'utf-8');
		}
		return this.ApiKey;
	}

	get(prop) {
		switch(prop) {
			case 'sites':
				return this.config.sites;
			case 'customScripts':
				return this.config.customScripts;
			default:
				return this.config.options[prop];
		}
	}

	// Returns a folder path
	getPath(folder) {
		return this.config.options.outputFolder.path + '/' + this.config.options.outputFolder.subfolders[folder] + '/';
	}

	/*
	 * @return {array} urls stripped down (no protocol or params) f.i. to save into file
	 */
	getTransformedURLs () {
		const sites = this.config.sites;

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

	/*
	 * In case urls are organized in groups, get groups a single url belongs to
	 * @param {string} url
	 * @returns {array}
	 */
	getUrlGroups (url) {
		let sites = this.config.sites;
		let labels = [];
		if (sites.groups) {
			sites.groups.forEach((group) => {
				if(group.urls.indexOf(url) > -1) {
					labels.push(group.label);
				}
			});
		}
		return labels;
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
		try {
			config = new Config(config);
		} catch (e) {
			console.log('Hey, you need to create your config.js file first. Go to Config/ and rename and modify one of the examples');
			process.exit();
		}
		
	}
	return config;
};



module.exports = createConfig();