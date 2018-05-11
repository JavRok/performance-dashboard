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
			label: "Wordpress",
			urls: [
				"https://www.tele2.nl/",
				"https://www.tele2.nl/shop/thuis/postcodecheck/",
				"https://www.tele2.nl/klantenservice/mobiel/toestelhulp/",
				"https://www.tele2.nl/klantenservice/",
				"https://www.tele2.nl/klantenservice/contact/",
				"https://www.tele2.nl/klantenservice/mobiel/simkaart-activeren/",
				"https://forum.tele2.nl/"
			]
		},
		{
			label: "Magento",
			urls: [
				"https://www.tele2.nl/mobiel/sim-only/",
				"https://www.tele2.nl/mobiel/smartphones/",
				"https://www.tele2.nl/mobiel/smartphones/apple-iphone-x/",
				"https://www.tele2.nl/mobiel/smartphones/apple-iphone-7/?data=2000&voice=100&installment=26&binding=24&cancelable=false&force=1&memory=128&color=red"
			]
		},
		{
			label: "Competitors",
			urls: [
				"https://www.tele2.nl/",
				"http://www.ziggo.nl/",
				"https://www.t-mobile.nl",
				"https://www.kpn.com/",
				"https://www.vodafone.nl/",
				"https://www.telfort.nl/"
			]
		}
	]
};

/*
 * General options.
 */
const options = {
	intervalInHours: 1,
	locations: ["DiemenTester_wptdriver:Chrome", "DiemenTester_wptdriver:Firefox"],
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
		server: "http://52.28.134.156"
		// proxy: "proxy.dcn.versatel.net:3128"
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
		{setCookie: ["https://www.ziggo.nl", "_syn={'c': cookiesPermission ,'ct':1473804921100}]}"]}
	],
	"https://www.kpn.com/": [
		{setCookie: ["https://www.kpn.com", "BCPermissionLevel=PERSONAL"]}
	],
	"https://www.t-mobile.nl": [
		{setCookie: ["https://www.t-mobile.nl", "tm_cookie_setting=Tracking"]}
	]		
};

module.exports =  {
	sites: sites,
	options: options,
	customScripts: customScripts
};