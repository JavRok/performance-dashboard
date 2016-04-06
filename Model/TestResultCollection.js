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
			return false;
        }
		return true;
    }


	// Add a single object mainting order by timestamp. Don't mix with normal add, or it won't work
	addOrdered (newTest) {
		var i=0, len=this.tests.length;

		while(i<len && newTest.date > this.tests[i].date) {
			i++;
		}

		if (i === len) {
			this.tests.push(newTest);
			return true;
		}

		if (this.tests[i].id === newTest.id) {
			console.log("Test " + newTest.id + " duplicated, couldn't add.");
			return false;
		}

		this.tests.splice(i, 0, newTest);
		return true;
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