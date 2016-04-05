
/*
 * AJAX util
 * IE8+ only
 */
var AJAX = (function () {

	/*
	 * Performs a GET Ajax call with JSON Response
	 * @param url
	 * @param callback Handles the data received or error
	 */
	function getJson(url, callback) {

		if (!window.XMLHttpRequest) {
			// Not worth it
			callback({'error': 'Use a modern browser, jeez'});
		}

		var xmlhttp = new XMLHttpRequest();

		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
				if(xmlhttp.status == 200){
					callback (JSON.parse(xmlhttp.responseText));
				}
				else if(xmlhttp.status == 400) {
					callback({'error': 'There was an error 400'});
				}
				else {
					callback({'error': 'There was an error'});
				}
			}
		};

		xmlhttp.open("GET", url, true);
		xmlhttp.setRequestHeader('Content-Type', 'application/json');
		xmlhttp.send();
	}

	/*
	 * Get Ajax call as a Promise
	 * Ref: http://www.html5rocks.com/en/tutorials/es6/promises/
	 */
	function promiseGet(url) {
		if (typeof Promise !== "function") return null;

		// Return a new promise.
		return new Promise(function(resolve, reject) {
			var req = new XMLHttpRequest();
			req.open('GET', url);

			req.onload = function() {
				if (req.status == 200) {
					// Resolve the promise with the response text
					resolve(req.response);
				} else {
					// Otherwise reject with the status text which will hopefully be a meaningful error
					reject(Error(req.statusText));
				}
			};

			// Handle network errors
			req.onerror = function() {
				reject(Error("Network Error"));
			};

			// Make the request
			req.send();
		});
	}


	return {
		getJson : getJson,
		promiseGet: promiseGet
	}
})();
