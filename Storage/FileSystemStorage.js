// Promisified fs (native fs promises are flagged as 'experimental' at the time of writing)
const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const conf = require('../Config');
const GenericStorage = require('./GenericStorage');
const TestResultCollection = require('../Model/TestResultCollection.js');

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

    getFilePath (name, subfolder) {
        return `${this.path}/${subfolder}/${name}.json`;
    }
}

module.exports = FileSystemStorage;
