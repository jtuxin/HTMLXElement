/*jshint strict:false */

(function(g) {

// base path, that will be used to resolve files and exclude
g.basePath = '';

// list of files / patterns to load in the browser
g.files = [
  'components/chai/chai.js',

  g.MOCHA,
  g.MOCHA_ADAPTER,

  g.REQUIRE,
  g.REQUIRE_ADAPTER,
  
  { pattern: 'components/**',   included: false },
  { pattern: 'test/mocks/*',    included: false },
  { pattern: 'test/*.spec.*',   included: false },
  { pattern: 'HTMLXElement/**', included: false },

  //'dom-dock.js',

  'test/setup.js'
];


// list of files to exclude
g.exclude = [
  
];


// test results reporter to use
// possible values: 'dots', 'progress', 'junit'
g.reporters = ['progress'];


// web server port
g.port = 8080;


// cli runner port
g.runnerPort = 9100;


// enable / disable colors in the output (reporters and logs)
g.colors = true;


// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
g.logLevel = g.LOG_INFO;


// enable / disable watching file and executing tests whenever any file changes
g.autoWatch = true;


// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
g.browsers = [];


// If browser does not capture in given timeout [ms], kill it
g.captureTimeout = 5000;


// Continuous Integration mode
// if true, it capture browsers, run tests and exit
g.singleRun = false;

g.preprocessors = {
  //'**/*.coffee': 'coffee'
};

return g;

})(this);
