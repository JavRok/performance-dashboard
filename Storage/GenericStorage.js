
/*
 * @class GenericStorage
 * @abstract
 */
class GenericStorage {
    constructor() {
        if (new.target === GenericStorage) {
            throw new Error("Cannot construct GenericStorage instances directly");
        }
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
}

module.exports = GenericStorage;
