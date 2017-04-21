
var url = require('url');

/*
 * Tells if a module has been called directly from the command line (with 'node moduleName')
 */
function isCalledFromCommandLine(moduleName) {
	return process
		&& process.argv.length > 1
		&& process.argv[1].indexOf(moduleName) !== -1;
}


String.prototype.trimRight = function (charlist) {
	if (charlist === undefined)
		charlist = '\s';

	return this.replace(new RegExp('[' + charlist + ']+$'), '');
};

/*
 * Returns a filename based on the URL being tested
 */
function getFileNameFromUrl(testUrl) {
	var urlObj = url.parse(testUrl);
	var path = urlObj.pathname.replace(/\//g, '_');
	path = path.trimRight('_');

	return urlObj.hostname + path + '.json';
}


/*
 * Calculates median value for an array of objects, by comparing the property set by 2nd argument
 * @param {array} array of objects
 * @param {string} name of the property to be used to calculate the median. Only 1st level properties supported
 */
function medianForObject(values, propertyToOrder) {
	if (!values || values.length === 0) return 0;

	values.sort( function (a, b) {return a[propertyToOrder] - b[propertyToOrder];} );

	var half = Math.floor(values.length / 2);

	if (values.length % 2)
		return values[half][propertyToOrder];
	else
		return (values[half - 1][propertyToOrder] + values[half][propertyToOrder]) / 2.0;
}


/*
 * Get Date Time in a filename friendly format (yyyy-mm-ddThh_mm_ss)
 */
function getDateTime() {
	// toISOString returns UTC instead of our timezone, let's apply the correct offset
	var tzoffset = (new Date()).getTimezoneOffset() * 60000; // offset in milliseconds
	var now = new Date(Date.now() - tzoffset);
	return now.toISOString().substr(0, 19).replace(/:/g,'_');
}
/*
 * Parses the date from a file with date format as returned by 'getDateTime()'
 * @return {Date}
 */
function parseDateFromFile(filename) {
	return new Date(filename.substr(0, 19).replace(/_/g, ':'));
}


/*
 * @return [string] current timestamp in format yyyy-mm-dd
 */
function getUniqueDay(timestamp) {
	if (!timestamp) return '';
	var dateObj = new Date(timestamp * 1000);
	return dateObj.toISOString().substr(0, 10);
}


/*
 * Returns the position of the element with min/max value in an array
 * TODO: Use ES6 spread operator, when compatible with Node version
 * @param {array}
 */
function minPos(arr) {
	// return arr.indexOf(Math.min(...arr));
	return arr.indexOf(Math.min.apply(Math, arr));
}
function maxPos(arr) {
	// return arr.indexOf(Math.max(...arr));
	return arr.indexOf(Math.max.apply(Math, arr));
}



module.exports = {
	isCalledFromCommandLine: isCalledFromCommandLine,
	getFileNameFromUrl     : getFileNameFromUrl,
	parseDateFromFile      : parseDateFromFile,
	medianForObject        : medianForObject,
	getDateTime            : getDateTime,
	getUniqueDay           : getUniqueDay,
	minPos                 : minPos,
	maxPos                 : maxPos
};