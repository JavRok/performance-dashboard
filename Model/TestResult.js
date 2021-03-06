/* Test result Model. It's a reduced version of the result received by webpagetest.org */

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
	isOriginalResult(resultJson) {
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
			this.date = test.runs['1'].firstView.date;

			let run = test.runs['1'].firstView;
			if (!run.requests) {
				console.log('requests empty', test.id);
				return;
			}
			this.firstView = {
				requests        : run.requests.length,
				bytesIn         : run.bytesIn,
				ttfb            : run.TTFB, 			// Time to first Byte
				startRender     : run.render,
				domReadyEvent   : run.domContentLoadedEventStart,
				loadEvent       : run.loadEventStart,
				totalTime       : run.loadTime,
				visuallyComplete: run.visualComplete,
				speedIndex      : run.SpeedIndex
			};

			run = test.runs['1'].repeatView;
			if (run) {
				this.repeatView = {
					requests        : run.requests.length,
					bytesIn         : run.bytesIn,
					ttfb            : run.TTFB,
					startRender     : run.render,
					domReadyEvent   : run.domContentLoadedEventStart,
					loadEvent       : run.loadEventStart,
					totalTime       : run.loadTime,
					visuallyComplete: run.visualComplete,
					speedIndex      : run.SpeedIndex
				};
			} else {
				// If there's a timeout on the firstView, repeated view is null
				// console.error("RepeatView is null for test " + this.id);
				this.repeatView = null;
			}

		}
	}

	toString() {
		return JSON.stringify(this, null, 2);
	}

}

module.exports = TestResult;
