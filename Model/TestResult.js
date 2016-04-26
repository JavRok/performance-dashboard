/* Test result Model. It's a reduced version of the result received by webpagetest.org */
"use strict";

class TestResult {

	constructor(resultJson) {
		if (this.isOriginalResult(resultJson)) {
			this.fillFromResult(resultJson);
		} else {
			// this = resultJson;
			Object.assign(this, resultJson);
		}
	}

	/*
	 * Check if Test Result comes directly from webpagetest.org or it's the reduced version we save
	 */
	isOriginalResult (resultJson) {
		return (resultJson && resultJson.data && resultJson.statusCode);
	}

	/* Fills the object with results JSON coming from WebPageTest.org */
	fillFromResult(test) {
		if (test.statusCode && test.statusCode === 200) {
			test = test.data;
			this.id = test.id;
			this.location = test.location;
			this.url = test.summary;
            this.domain = test.testUrl;
			this.connectivity = test.connectivity;
            this.date = test.runs["1"].firstView.date;

			var run = test.runs["1"].firstView;
			this.firstView = {
				requests: run.requests.length,
				bytesIn: run.bytesIn,
				ttfb : run.TTFB, 			// Time to first Byte
				startRender: run.render,
				domReadyEvent: run.domContentLoadedEventStart,
				loadEvent: run.loadEventStart,
				totalTime: run.loadTime,
				visuallyComplete: run.visualComplete
			};

			run = test.runs["1"].repeatView;
			if (run) {
				this.repeatView = {
					requests: run.requests.length,
					bytesIn: run.bytesIn,
					ttfb : run.TTFB,
					startRender: run.render,
					domReadyEvent: run.domContentLoadedEventStart,
					loadEvent: run.loadEventStart,
					totalTime: run.loadTime,
					visuallyComplete: run.visualComplete
				};
			} else {
				// If there's a timeout on the firstView, repeated view is null
				console.error("RepeatView is null for test " + this.id);
				this.repeatView = null;
			}

		}
	}

	/*
	 * @return [string] current timestamp in format yyyy-mm-dd
	 */
	getUniqueDay() {
		var dateObj = new Date(this.date * 1000);
		return dateObj.toISOString().substr(0, 10);
	}

    toString () {
        return JSON.stringify(this, null, 2);
    }

}

module.exports = TestResult;