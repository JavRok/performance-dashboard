
/*
 * @class GenericStorage
 * @abstract
 */
class GenericStorage {
    constructor(conf) {
        if (new.target === GenericStorage) {
            throw new Error("Cannot construct GenericStorage instances directly");
        }
    }

    /*
     * Get pending tests recently launched by reading the pending folder, where each test has one json file
     * @returns {Promise<Object[]>} array of pending objects (as returned by wpt api)
     */
    async getPendingTests() {
        throw new Error("Cannot call getPendingTests on abstract class directly");
    }

    /*
     * Adds a new recently launched test, with the JSON response from the wpt api
     * @param {Object} wptResponse JSON response from the wpt api after a 'test' command
     * @returns {Promise<String>} name of the file/resource created
     */
    async addPendingTest(wptResponse) {
        throw new Error("Cannot call addPendingTest on abstract class directly");
    }

    /*
     * @param {string} id of the collection (url of the test)
     * @param {TestResultCollection} collection to create/update
     * @returns {boolean}
     */
    saveResultsCollection (id, collection) {
        throw new Error("Cannot call saveResultsCollection on abstract class directly");
    }

    /*
     * @param {string} id of the collection (url of the test)
     * @returns {TestResultCollection} collection found or null if it doesn't exist
     */
    retrieveResultsCollection (id) {
        throw new Error("Cannot call retrieveResultsCollection on abstract class directly");
    }

    /*
     * @param {string} id of the collection (url of the test)
     * @returns {Promise<TestResultCollection>} collection found or null if it doesn't exist
     */
    async retrieveHistoryCollection (id) {
        throw new Error("Cannot call retrieveHistoryCollection on abstract class directly");
    }

    /*
    * @param {string} id of the collection (url of the test)
    * @param {TestResultCollection} collection to create/update
    * @returns {Promise<boolean>} true if successful
    */
    async saveHistoryCollection (id, collection) {
        throw new Error("Cannot call saveHistoryCollection on abstract class directly");
    }




}

module.exports = GenericStorage;
