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
				"https://forum.tele2.nl/"
			]
		},
		{
			label: "Magento",
			urls: [
				"https://www.tele2.nl/mobiel/sim-only/",
				"https://www.tele2.nl/mobiel/smartphones/",
				"https://www.tele2.nl/mobiel/smartphones/apple-iphone-x/",
				"https://www.tele2.nl/mobiel/smartphones/apple-iphone-8/?data=2000&voice=100&installment=16&binding=24&cancelable=false&memory=64&color=silver&force=1"
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
	locations: ["DesktopT2_wptdriver:Chrome", "DesktopT2_wptdriver:Firefox"],
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
		server: "http://52.28.134.156",
		video : true
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
