/*
 * Pending Tests helper class. Manage a collection of pending tests,
 * which are the objects returned by wpt api after launching a test
 */
class PendingTests {

	/*
	 * @param {GenericStorage} storage object
	 */
	constructor(storage) {
		this.storage = storage;
		// testsMap is a Map with pending tests grouped by url
		this.testsMap = null;
	}

	/*
	 * Reads the pending tests from the storage
	 */
	async getFromStorage() {
		try {
			const tests = await this.storage.getPendingTests();
			this.testsMap = this.mergeDuplicates(tests);
		} catch (err) {
			throw Error(err);
		}
	}

	/*
	 * @param {string} url to get the tests from
	 */
	get(url) {
		if (this.testsMap) {
			return this.testsMap.get(url);
		}
		return null;
	}

	/*
	 * @returns {Map} pending tests grouped by url. Duplicates are saved as an array.
	 */
	getAll() {
		return this.testsMap;
	}


	/*
	 * @param {Object[]} array of pending tests as read by the storage (no order and with duplicates)
	 * @returns {Map} pending tests grouped by url. Duplicates are saved as an array.
	 */
	mergeDuplicates(testsArr) {
		const map = new Map();
		testsArr.forEach(test => {
			const existing = map.get(test.url);
			if (existing) {
				if (Array.isArray(existing)) {
					existing.push(test);
					map.set(test.url, existing);
				} else {
					map.set(test.url, [existing, test]);
				}
			} else {
				map.set(test.url, test);
			}
		});
		return map;
	}
}

module.exports = PendingTests;
