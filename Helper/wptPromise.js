/*
 * Promise wrapper for webpagetest module calls, original only has callbacks
 */

/*
 * Promisified wpt.runTest
 */
function wptRunTestPromise(url, conf) {
    return new Promise((resolve, reject) => {
        const options = conf.get('testOptions');
        const wpt = new WebPageTest(options.server, conf.getApiKey());
        wpt.runTest(url, options, (err, result) => {
            if (err) reject(err);
            resolve(result);
        })
    });
}