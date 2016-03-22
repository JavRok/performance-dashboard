/* Test result Model. It's a reduced version of the result received by webpagetest.org */
"use strict";

class TestResult {

	constructor(id, resultsJson) {
		this.id = id;
		if (resultsJson) {
			this.fillFromResults(resultsJson);
		}
	}

	/* Fills the object with results JSON coming from WebPageTest.org */
	fillFromResults(test) {
		if (test.statusCode && test.statusCode === 200) {
			test = test.data;
			this.location = test.location;
			this.url = test.summary;
			this.connectivity = test.connectivity;

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
		}
	}

}

module.exports = TestResult;