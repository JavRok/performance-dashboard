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
        if(!this.tests.some( function(test) {
            return test.id === newTest.id;
        })) {

            this.tests.push(newTest);

        }
    }


    toString () {
        return JSON.stringify(this.tests, null, 2);
    }
}


module.exports = TestResultCollection;