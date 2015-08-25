
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

	return {
		getJson : getJson
	}
})();
