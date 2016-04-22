/* Test result Model. It's a reduced version of the result received by webpagetest.org */
"use strict";

class TestResult {

	constructor(id, resultJson) {
		this.id = id;
		if (resultJson) {
			this.fillFromResult(resultJson);
		}
	}

	/* Fills the object with results JSON coming from WebPageTest.org */
	fillFromResult(test) {
		if (test.statusCode && test.statusCode === 200) {
			test = test.data;
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

    toString () {
        return JSON.stringify(this, null, 2);
    }

}

module.exports = TestResult;