/*
 * Test result Collection Model
 * Holds a collection of TestResult objects. Implements Iterable interface.
 **/
"use strict";

if ( global.v8debug ) {
	global.v8debug.Debug.setBreakOnException(); // speaks for itself
}

var TestResult = require('../Model/TestResult.js');

class TestResultCollection {

	constructor(tests) {
		this.tests = [];

        if (tests && tests.length > 0) {
			tests.forEach( (test) => {
				this.addOrdered(new TestResult(test));
			});
        }
	}

	/*
	 * Implements Iterable 'interface'
	 */
	[Symbol.iterator]() {
		var index = 0;
		var data  = this.tests;

		return {
				next: () => ({ value: data[index], done: ++index >= data.length })
		}
	}

	length() {
		return this.tests.length;
	}

	/*
 	 * Add a single object of type TestResult
 	 */
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


	/*
 	 * Add a single object maintaining order by timestamp. Don't mix with normal add, or it won't work
 	 */
	addOrdered (newTest) {
		var len=this.tests.length;
		var i=len;

		// Inverse order to improve performance (newest tests are at the end)
		while(i>0 && newTest.date < this.tests[i-1].date) {
			i--;
		}

		if (i > 0 && this.tests[i-1].id === newTest.id) {
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


	/*
	 * Removes all tests happened in a certain day, specified by the parameter
	 * @param [string] day in yyyy-mm-dd format
	 */
	removeTestsFromDay (day) {

		this.tests = this.tests.filter((test) => {
			return day !== test.getUniqueDay();
		});
	}


    toString () {
        return JSON.stringify(this.tests, null, 2);
    }
}


module.exports = TestResultCollection;