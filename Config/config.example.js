/*
* Config file
*/

/*
 * 'sites' can be a plain array of urls, or it can have a 'groups' structure like the example.
 * 'groups' is an array of objects with two props: label & urls.
 */
const sites = {
	groups: [
		{
			label: "Social",
			urls: [
				"https://www.facebook.com/",
				"https://www.twitter.com/"
			]
		},
		{
			label: "News",
			urls: [
				"https://www.nytimes.com/",
				"https://www.elespanol.com/"
			]
		}
	]
};

/*
 * General options.
 */
const options = {
	intervalInHours: 1,
	locations: ["London_EC2:Chrome", "Dulles_Edge:Microsoft Edge (EdgeHTML)"],
	storage: {
		type: 'FileSystem',
		path: 'wpt.org.json'
	},
	// TODO: MongoDB
	// storage: {
	// 	type: 'MongoDB',
	// 	...
	// },

	// testOptions are passed directly to the webpagetest module, docs: https://www.npmjs.com/package/webpagetest
	testOptions: {
		connectivity: "Cable",
		server: "https://www.webpagetest.org/"    // You can put here the IP of your private instance
		// proxy: "proxy.net:3128"
	}
};


/*
 * Optional, if you want to pass custom scripts to wpt, like setting cookies. Either to a single url or group
 * Check the docs in https://sites.google.com/a/webpagetest.org/docs/using-webpagetest/scripting
 */
const customScripts = {
	Social: [
		{setCookie: ["https://www.facebook.com", "cookie=somevalue"]}
	],
	"https://www.nytimes.com/": [
		{setCookie: ["https://www.nytimes.com/", "cookie2=someothervalue"]}
	]
};


// Don't touch this
module.exports =  {
	sites: sites,
	options: options,
	customScripts: customScripts
};