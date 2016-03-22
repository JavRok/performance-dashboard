module.exports = function(grunt) {

	var curDate = new Date();
	var timestamp = '' + curDate.getFullYear() + '-' + curDate.getMonth() + '-' + curDate.getDay() + '-' + curDate.getHours() + 'h';


	grunt.initConfig({

		wpt: {   // Not working quite well, timeout
			options: {
				locations: ['ec2-eu-west-1:Chrome'],  // , 'EU_Ams_Wptdriver', 'Amsterdam_IISpeed', 'Brussels'],
				key: "A.436734427d77b65cb53d08490c1eab45"
			},
			tele2: {
				options: {
					url: [
						'https://www.tele2.nl/'
						// 'https://sideroad.secret.jp/articles/',
					]
				},
				dest: 'tmp/tele2nl/'
			}
		},

		/*shell: {
			options: {
				execOptions: {
					cwd: 'node_modules/webpagetest/bin/'
				}
			},
			runTests: {
				// command: 'mkdir test'
				command: 'node_modules/webpagetest/bin/webpagetest batch ../../../wpt.org.json/batch.txt'
			}
		}*/

		exec: {
			runTest: 'node node_modules/webpagetest/bin/webpagetest batch wpt.org.json/batch.txt > wpt.org.json/status/result_'+ timestamp +'.json'
		}

	});

	// node_modules/webpagetest/bin/webpagetest locations > ../../../wpt.org.json/locations2.json

	// grunt.loadNpmTasks('grunt-wpt');
	// require('load-grunt-tasks')(grunt); // npm install --save-dev load-grunt-tasks
	// grunt.loadNpmTasks('grunt-shell');

	grunt.loadNpmTasks('grunt-exec');

	grunt.registerTask('default', ['exec']);

};
