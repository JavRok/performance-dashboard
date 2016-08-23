/*
 * Test result Collection Model
 * Holds a collection of TestResult objects. Implements Iterable interface.
 **/
"use strict";

var TestResult = require('../Model/TestResult.js');
var util = require('../Helper/util.js');

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
			// console.log("Test " + newTest.id + " duplicated, couldn't add.");
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
			return day !== util.getUniqueDay(test.date);
		});
	}


	/*
	 * Returns a subset of current tests of a certain recent day
	 * @param {int} day in relative to current day, where 0=today, -1=yesterday, etc
	 * @return {array} Array of exactly 24 test objects, with possible null values
	 */
	get24hResults(day) {

		var dateObj = new Date();
		var result = {
			"hours": [],
			"tests": []
		};

		dateObj.setDate(dateObj.getDate() + day);
		// Last 24h (includes today and possibly yesterday partly)
		if(day === 0) {
			var hour = new Date().getHours();  // Get current hour
			for (let i=0; i<24; i++){
				if (hour === -1) {
					hour = 23;
					dateObj.setDate(dateObj.getDate()-1);  // Move day to yesterday
				}
				result.hours.unshift(hour);
				dateObj.setHours(hour);
				result.tests.unshift(this.getSingleResultByHour(dateObj.getTime()));
				hour--;
			}

		// A whole day from 0 to 23h
		} else {
			for (let i=0; i<24; i++){
				result.hours.push(i);
				dateObj.setHours(i);
				result.tests.push(this.getSingleResultByHour(dateObj.getTime()));
			}
		}

		return result;
	}


	/*
	 * Searches for a test with the specified date time, within the same hour.
	 * @return {TestResult} or null
	 */
	getSingleResultByHour(timestamp) {
		// isoTime contains date and hour only, f.i. "2016-05-05T13"
		var isoTime = new Date(timestamp).toISOString().substr(0, 13);
		var dateObj;
		// Get results from same day
		for(var i=0; i<this.tests.length; i++) {
			if (!this.tests[i].date) {continue;}   // Sometimes wpt.org will give a null test, with no date
			dateObj = new Date(this.tests[i].date * 1000);
			if(dateObj.toISOString().substr(0, 13) === isoTime) {
				return this.tests[i];
			}
		}
		return null;
	}

	/*
	 * Returns a subset of current tests of a certain recent day
	 * @param {int} month in relative to current month, where 0=this month, -1=last month, etc
	 * @return {array} Array of ~30 test objects, with possible null values
	 */
	getMonthResults(month) {

		var dateObj = new Date();
		var result = {
			"days": [],
			"tests": []
		};

		dateObj.setMonth(dateObj.getMonth() + month);
		// Current month (30 days of history starting today)
		if(month === 0) {
			var day = new Date().getDate();  // Get current day
			for (let i=0; i<30; i++){
				dateObj.setDate(day);
				if (day === 0) {
					day = dateObj.getDate();   // Move day to last day of previous month
				}
				result.days.unshift(day);
				result.tests.unshift(this.getSingleResultByDay(dateObj.getTime()));
				day--;
			}

			// A whole month
		} else {
			var nDays = this.daysInMonth(dateObj.getMonth() + 1, dateObj.getFullYear())
			for (let i=0; i<nDays; i++){
				result.days.push(i);
				dateObj.setDate(i);
				result.tests.push(this.getSingleResultByDay(dateObj.getTime()));
			}
		}

		return result;
	}

	/*
	 * Searches for a test with the specified timestamp, within the same day.
	 * @return {TestResult} or null
	 */
	getSingleResultByDay(timestamp) {
		// isoTime contains date only, f.i. "2016-05-05"
		var isoTime = new Date(timestamp).toISOString().substr(0, 10);

		// Get results from same day. The ISO date is already on the ID of the test
		for(var i=0; i<this.tests.length; i++) {
			if(this.tests[i].id === isoTime) {
				return this.tests[i];
			}
		}
		return null;
	}


	//Month is 1 based
	daysInMonth(month,year) {
		return new Date(year, month, 0).getDate();
	}

    toString () {
        return JSON.stringify(this.tests, null, 2);
    }
}


module.exports = TestResultCollection;
