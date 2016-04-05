/* Test result Collection Model */
"use strict";

class TestResultCollection {

	constructor(tests) {
        if (tests) {
            this.tests = tests;
        }
		else {
            this.tests = [];
        }
	}

    // Add a single object of type TestResult
    add (newTest) {
        // Avoid duplicates
        if(!this._exists(newTest)) {
            this.tests.push(newTest);
        } else {
            console.log("Test " + newTest.id + " duplicated, couldn't add.");
        }
    }

    // Check if test Id already exists in current collection
    _exists(newTest) {
        return this.tests.some( function(test) {
            return test.id === newTest.id;
        });
    }


    toString () {
        return JSON.stringify(this.tests, null, 2);
    }
}


module.exports = TestResultCollection;