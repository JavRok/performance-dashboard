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
				"https://www.elespanol.com/",
				"https://www.telegraph.co.uk/"
			]
		}
	]
};

/*
 * General options.
 */
const options = {
	intervalInHours: 1,
	locations: ["SanJose_IE9:IE 9", "Dulles_MotoG4:Firefox"],
	outputFolder: {
		path: "wpt.org.json",
		subfolders: {
			pending: "pending",
			results: "results",
			history: "history"
		}
	},
	// testOptions are passed directly to the webpagetest module, docs: https://www.npmjs.com/package/webpagetest
	testOptions: {
		connectivity: "Cable",
		server: "https://www.webpagetest.org/"
		// proxy: "proxy.net:3128"
	}
};

/*
 * Optional, if you want to pass custom scripts to wpt, like setting cookies. Either to a single url or group
 * Check the docs in https://sites.google.com/a/webpagetest.org/docs/using-webpagetest/scripting
 */
const customScripts = {
	Wordpress: [
		{setCookie: ["https://www.tele2.nl", "t2_cc_d=1507077438231"]},
		{setCookie: ["https://www.tele2.nl", "ely_cc_answ={\"cookie-consent\":1}"]},
	],
	Magento: [
		{setCookie: ["https://www.tele2.nl", "t2_cc_d=1507077438231"]},
		{setCookie: ["https://www.tele2.nl", "ely_cc_answ={\"cookie-consent\":1}"]},
	],
	"https://www.ziggo.nl/": [
		{setCookie: ["https://www.ziggo.nl", "_svs=%7B%22e%22%3A%7B%22152%22%3A%7B%22group%22%3A156%2C%22sent%22%3Atrue%7D%2C%22345%22%3A%7B%22group%22%3A346%2C%22sent%22%3Atrue%7D%2C%22403%22%3A%7B%22group%22%3A405%2C%22sent%22%3Atrue%7D%7D%2C%22c%22%3A%7B%221%22%3Atrue%2C%222%22%3Atrue%2C%223%22%3Atrue%2C%224%22%3Atrue%7D%2C%22ct%22%3A1526976543344%2C%22p%22%3A%7B%227%22%3A1626976543369%2C%224242%22%3A1626976543365%7D%2C%22m%22%3A%7B%22customOffer%22%3A%7B%22sent%22%3A1626976543312%7D%7D%7D"]}
	],
	"https://www.kpn.com/": [
		{setCookie: ["https://www.kpn.com", "BCPermissionLevel=PERSONAL"]}
	],
	"https://www.t-mobile.nl": [
		{setCookie: ["https://www.t-mobile.nl", "tm_cookie_setting=Tracking"]}
	],
	"https://www.vodafone.nl/": [
		{setCookie: ["https://www.vodafone.nl/", "dimml_consent={\"level\":2,\"version\":\"2.0.0\",\"contentHashConsumer\":422970128,\"contentHashBusiness\":-1158459282}"]}
	]
};

module.exports =  {
	sites: sites,
	options: options,
	customScripts: customScripts
};