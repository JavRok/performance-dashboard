## Performance Dashboard, an automatic webpagetest.org tester

The Performance Dashboard gives an automated way of testing a set of urls against webpagetest.org, with history and
graphs. Normally wpt.org is used for manual testing, but thanks to this dashboard and the wpt API, it becomes easier
to track loading times throughout time. 

### Installation

#### Prerequisits:
1. You need an __API key__ for a running webpagetest.org instance, either the official or your own private one.
2. Node >= v8
3. A 'server' to run this dashboard on. You can run it locally, but it needs to be always on if you want to have some
useful data. I run it on the same AWS machine where I have webpagetest, for instance. 

#### First steps
1. Run `npm install --only=prod` in the root folder. While it installs: 
2. Put your own API key string in the `Config/api.key` file. You can get one for the public instance here: https://www.webpagetest.org/getkey.php
3. Create a config.js file in `Config/` folder, use `config.example.js` as a starting point.
4. Fill the `sites` variable with the urls you'd like to test.
    1. By default a simple array of urls will work.
        ````
        const sites: [
            "https://www.google.com",
            "https://www.facebook.com"
        ]
        ````
    2. Optionally, if you have many urls, you can use the key `groups` to make it easier for the frontend dashboard.
        ````
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
        ````
5. Fill the `options` object. Possible properties:
    - `intervalInHours: 1` -> Number, by default every url is tested every hour.
    - `locations: ["SanJose_IE9:IE 9", "Dulles_MotoG4:Firefox"]` -> Fill several options for public instance, an 
    algorithm will choose the most suitable at the moment. Don't forget to include the browser as `"<server>:<browser>"`
    - `outputFolder` -> leave it as it is. You can rename the folders, but at it needs to have 3 subfolders: pending,
    results and history.
    - `testOptions: Object` -> Here you can pass the options that the webpagetest npm package accepts and passes to the
     server. Check the docs for more info: https://www.npmjs.com/package/webpagetest#options

6. Optionally, fill the `customScripts` object with the config you'd pass to the 'script' tab. For instance you can set
a cookie value to bypass a Cookie wall (here in Europe it is a thing). Check the docs in 
https://sites.google.com/a/webpagetest.org/docs/using-webpagetest/scripting
    ````
    const customScripts = {
        Social: [
            {setCookie: ["https://www.facebook.com", "cookie=somevalue"]}
        ],
        "https://www.nytimes.com/": [
            {setCookie: ["https://www.nytimes.com/", "cookie2=someothervalue"]}
        ]
    };
    ````
    The `navigate` command is executed after, so you don't need to specify it. 



#### Precheck 
1. Now that everything is set up, you should be able to run everything, but first let's make sure that the connection
to webpagetest server and agent works. 
2. Check the config by running
    ````
    $ node checkConfig.js
    ````
    You should see the message `Config OK`, otherwise fix the issues.

Note: This guide doesn't help setting up a whole webpagetest.org stack, but if you have problems with your pivate
instance, check these guides: 
- wpt agent setup: https://github.com/WPO-Foundation/wptagent
- wpt server setup: https://github.com/WPO-Foundation/webpagetest-docs/blob/master/user/Private%20Instances/README.md

### Running

1. Easiest way is to start with the main script
    ````
    $ ./run.sh
    ````
2. This script basically runs the main js file `node start.js` and sets logrotate. You can set this script to
run on startup. I use crontab `reboot` functionality like so:
    ```
    @reboot  /path/to/run.sh
    ```
    so it will run when restarting.

3. There's also a `stop.sh` to stop the service (which is a normal process). If you know how to, you can add 
this as a system service (systemd or similar)

4. Open the url <http://localhost:3000> to see the dashboard (initially empty)

4. You can check the output in `/log/history.log`

After this, just wait a few hours, and you will start seeing tests in the dashboard, if everything is working
properly. The dashboard is more useful when you let it run for a few days. 

### Performance dashboard modules (and running them separatedly)

The dashboard has basically 2 parts: 
1. Automatic testing tool, that does all the communication with the wpt.org server and manages the history. Runs 
in nodeJS and uses the [webpagetest npm module](https://www.npmjs.com/package/webpagetest), written by Marcel Duran
2. Frontend dashboard, an ExpressJS application that shows tests history in the browser. Uses 
[Chartist](https://gionkunz.github.io/chartist-js/) to draw the graphs. 

To run the frontend dashboard only (if you already have history), you can do so with:
````
node Controller/dashboardService.js
````

The backend node application is composed by the following main controllers:
1. `launchTest.js` -> Starts performance tests on all the urls found in config. 
2. `checkForPendingTests.js` -> Since tests can take several minutes to finish, this script check for existing
tests, and gather results if finished. This should be run periodically, and some time later after `launchTest.js`
3. `saveTestHistory.js` -> Because after some time, data can become too big, this task gets old tests and summarizes
the info in much smaller format. In particular the raw test info for 7 days

You can run all these independently with the node cli. The `start.js` script basically runs all of them with
proper timing. By default:
1. `launchTest.js` is run once every hour (can be changed on the config)
2. `checkForPendingTests.js` is run once every 15 mins.
3. `saveTestHistory.js` is run once every 24h


Enjoy

