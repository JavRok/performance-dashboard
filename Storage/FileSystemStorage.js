// Promisified fs (native fs promises are flagged as 'experimental' at the time of writing)
const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const readDirAsync = promisify(fs.readdir);
const accessAsync = promisify(fs.access);
const mkdirAsync = promisify(fs.mkdir);
const unlinkAsync = promisify(fs.unlink);

const conf = require('../Config');
const GenericStorage = require('./GenericStorage');
const TestResultCollection = require('../Model/TestResultCollection.js');
const Util = require('../Helper/util');

const resultsFolder = 'results';
const historyFolder = 'history';
const pendingFolder = 'pending';

class FileSystemStorage extends GenericStorage {

    constructor() {
        super();
        const storage = conf.get('storage');
        if (storage.type && storage.type !== 'FileSystem') {
            throw Error('Storage is not configured as FileSystem in the config');
        }
        this.path = storage.path || 'wpt.org.json';
    }

    /*
     * Check that the needed folders exist, otherwise create them
     */
    async checkFolders() {
        if (this.foldersCreated) return;
        const folders = [pendingFolder, resultsFolder, historyFolder];
        for (const folder of folders) {
            try {
                await accessAsync(`${this.path}/${folder}`, fs.constants.F_OK);
            } catch (err) {
                if (err.code === 'ENOENT') {
                    conf.log(`Folder ${err.path} doesn't exist, creating it`);
                    await mkdirAsync(err.path);
                } else {
                    throw Error(err);
                }
            }
        }
        this.foldersCreated = true;
    }

    /*
     * Get pending tests recently launched by reading the pending folder, where each test has one json file
     * @returns {Promise<Object[]>} Array of pending objects, unordered and with possible duplicates
     */
    async getPendingTests() {
        try {
            // Read the contents of the status directory to get test Ids
            const path = `${this.path}/${pendingFolder}`;
            const files = await readDirAsync(path);
            // Let's use Promise.all to read the files in parallel
            const promises = files.map(file => readFileAsync(`${path}/${file}`, {encoding: 'utf8'}));
            const results = await Promise.all(promises);
            return results.map(result => JSON.parse(result));
        } catch (err) {
            throw Error(err);
        }
    }

    /*
     * Adds a new recently launched test, with the JSON response from the wpt api
     * @param {Object} wptResponse JSON response from the wpt api after a 'test' command
     * @returns {Promise<String>} name of the file created, throws exception if error
     */
    async addPendingTest(wptResponse) {
        try{
            // File with url and ID
            const fileName = this.getFilePath(Util.urlToName(wptResponse.url) + '-' + wptResponse.data.testId, pendingFolder);
            // TODO: Check for duplicates
            await writeFileAsync(fileName, JSON.stringify(wptResponse, null, 2), {encoding: 'utf8'});
            conf.log(`Test launched for ${wptResponse.url} , file created in ${fileName} (location ${wptResponse.location})`);
            return fileName;
        } catch (err) {
            throw Error(err);
        }
    }

    /*
     * Removes a pending test, because we already gather the results or because of an error
     * @param {string} id of the test
     * @param {string} url of the test
     */
    async removePendingTest(id, url) {
        try{
            const fileName = this.getFilePath(Util.urlToName(url) + '-' + id, pendingFolder);
            await unlinkAsync(fileName);
        } catch (err) {
            throw Error(err);
        }
    }


    /*
     * @param {string} id of the collection (url of the test)
     * @param {TestResultCollection} collection to create/update
     * @returns {Promise<boolean>} true if successful
     */
    async saveResultsCollection (id, collection) {
        try {
            const fileName = this.getFilePath(id, resultsFolder);
            await writeFileAsync(fileName, collection, {encoding: 'utf8'});
            return true;
        } catch (err) {
            throw Error(err);
        }
    }

    /*
     * @param {string} id of the collection (url of the test)
     * @returns {Promise<TestResultCollection>} collection found or null if it doesn't exist
     */
    async retrieveResultsCollection (id) {
        try {
            const fileName = this.getFilePath(id, resultsFolder);
            const content = await readFileAsync(fileName, {encoding: 'utf8'});
            return new TestResultCollection (JSON.parse(content));
        } catch (err) {
            throw Error(err);
        }
    }

    /*
     * @param {string} id of the collection (url of the test)
     * @returns {Promise<TestResultCollection>} collection found or null if it doesn't exist
     */
    async retrieveHistoryCollection (id) {
        try {
            const fileName = this.getFilePath(id, historyFolder);
            const content = await readFileAsync(fileName, {encoding: 'utf8'});
            return new TestResultCollection (JSON.parse(content));
        } catch (err) {
            throw Error(err);
        }
    }

    /*
    * @param {string} id of the collection (url of the test)
    * @param {TestResultCollection} collection to create/update
    * @returns {Promise<boolean>} true if successful
    */
    async saveHistoryCollection (id, collection) {
        try {
            const fileName = this.getFilePath(id, historyFolder);
            await writeFileAsync(fileName, collection, {encoding: 'utf8'});
            return true;
        } catch (err) {
            throw Error(err);
        }
    }


    /*
    * @returns {Promise<Array>} array with wpt api format
    */
    async getLocations () {
        try {
            const fileName = `${this.path}/locations.json`;
            const content = await readFileAsync(fileName, {encoding: 'utf8'});
            return JSON.parse(content);
        } catch (err) {
            return [];
        }
    }

    /*
    * @param {Array} array with wpt api format
    * @returns {Promise<boolean>} true if successful
    */
    async saveLocations (locations) {
        try {
            const fileName = `${this.path}/locations.json`;
            await writeFileAsync(fileName, locations, {encoding: 'utf8'});
            return true;
        } catch (err) {
            throw Error(err);
        }
    }


    getFilePath (name, subfolder) {
        return `${this.path}/${subfolder}/${name}.json`;
    }
}

module.exports = FileSystemStorage;
