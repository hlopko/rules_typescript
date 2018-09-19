// Karma configuration
// GENERATED BY Bazel
const path = require('path');
const fs = require('fs');
const tmp = require('tmp');

const browsers = [];
let customLaunchers = null;

// WEB_TEST_METADATA is configured in rules_webtesting based on value
// of the browsers attribute passed to ts_web_test_suite
// We setup the karma configuration based on the values in this object
if (process.env['WEB_TEST_METADATA']) {
  const webTestMetadata = require(process.env['WEB_TEST_METADATA']);
  if (webTestMetadata['environment'] === 'sauce') {
    // If a sauce labs browser is chosen for the test such as
    // "@io_bazel_rules_webtesting//browsers/sauce:chrome-win10"
    // than the 'environment' will equal 'sauce'.
    // We expect that a SAUCE_USERNAME and SAUCE_ACCESS_KEY is available
    // from the environment for this test to run
    if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
      console.error('Make sure the SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables are set.');
      process.exit(1);
    }
    // 'capabilities' will specify the sauce labs configuration to use
    const capabilities = webTestMetadata['capabilities'];
    customLaunchers = {
        'sauce': {
        base: 'SauceLabs',
        browserName: capabilities['browserName'],
        platform: capabilities['platform'],
        version: capabilities['version'],
      }
    };
    browsers.push('sauce');
  } else if (webTestMetadata['environment'] === 'local') {
    // When a local chrome or firefox browser is chosen such as
    // "@io_bazel_rules_webtesting//browsers:chromium-local" or
    // "@io_bazel_rules_webtesting//browsers:firefox-local"
    // then the 'environment' will equal 'local' and
    // 'webTestFiles' will contain the path to the binary to use
    const webTestNamedFiles = webTestMetadata['webTestFiles'][0]['namedFiles'];
    if (webTestNamedFiles['CHROMIUM']) {
      // When karma is configured to use Chrome it will look for a CHROME_BIN
      // environment variable.
      process.env.CHROME_BIN = path.join('external', webTestNamedFiles['CHROMIUM']);
      browsers.push(process.env['DISPLAY'] ? 'Chrome': 'ChromeHeadless');
    }
    if (webTestNamedFiles['FIREFOX']) {
      // When karma is configured to use Firefox it will look for a FIREFOX_BIN
      // environment variable.
      process.env.FIREFOX_BIN = path.join('external', webTestNamedFiles['FIREFOX']);
      browsers.push(process.env['DISPLAY'] ? 'Firefox': 'FirefoxHeadless');
    }
  } else {
    console.warn(`Unknown WEB_TEST_METADATA environment '${webTestMetadata['environment']}'`);
  }
}

// Fallback to using the system local chrome if no valid browsers have been
// configured above
if (!browsers.length) {
  console.warn('No browsers configured. Configuring Karma to use system Chrome.');
  browsers.push(process.env['DISPLAY'] ? 'Chrome': 'ChromeHeadless');
}

const files = [
  TMPL_bootstrap_files
  TMPL_user_files
].map(f => require.resolve(f));

// static files are added to the files array but
// configured to not be included so karma-concat-js does
// not included them in the bundle
[
  TMPL_static_files
].forEach(f => {
  files.push({ pattern: require.resolve(f), included: false });
});

var requireConfigContent = `
// A simplified version of Karma's requirejs.config.tpl.js for use with Karma under Bazel.
// This does an explicit \`require\` on each test script in the files, otherwise nothing will be loaded.
(function(){
  var allFiles = [TMPL_user_files];
  var allTestFiles = [];
  allFiles.forEach(function (file) {
    if (/(spec|test)\\.js$/i.test(file) && !/\\/node_modules\\//.test(file)) {
      allTestFiles.push(file.replace(/\\.js$/, ''))
    }
  });
  require(allTestFiles, window.__karma__.start);
})();
`;

const requireConfigFile = tmp.fileSync(
    {keep: false, postfix: '.js', dir: process.env['TEST_TMPDIR']});
fs.writeFileSync(requireConfigFile.name, requireConfigContent);
files.push(requireConfigFile.name);

module.exports = function(config) {
  const configuration = {
    // list of karma plugins
    plugins: [
      'karma-*',
      'karma-concat-js',
      'karma-sourcemap-loader',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-sauce-launcher',
    ],

    // list of karma preprocessors
    preprocessors: {
      '**/*.js': ['sourcemap']
    },

    // list of test frameworks to use
    frameworks: ['jasmine', 'concat_js'],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: browsers,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    // note: run_karma.sh may override this as a command-line option.
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: 'TMPL_runfiles_path',

    // list of files passed to karma; these are concatenated into a single
    // file by karma-concat-js
    files,
  }

  if (process.env['IBAZEL_NOTIFY_CHANGES'] === 'y') {
    // Tell karma to only listen for ibazel messages on stdin rather than watch all the input files
    // This is from fork alexeagle/karma in the ibazel branch:
    // https://github.com/alexeagle/karma/blob/576d262af50b10e63485b86aee99c5358958c4dd/lib/server.js#L172
    configuration.watchMode = 'ibazel';
  }

  // Extra configuration is needed for saucelabs
  // See: https://github.com/karma-runner/karma-sauce-launcher
  if (customLaunchers) {
    // set the test name for sauce labs to use
    // TEST_BINARY is set by Bazel and contains the name of the test
    // target posfixed with the the browser name such as
    // 'examples/testing/testing_sauce_chrome-win10' for the
    // test target examples/testing:testing
    configuration.sauceLabs = {
      testName: process.env['TEST_BINARY'] || 'ts_web_test_suite'
    };

    // setup the custom launchers for saucelabs
    configuration.customLaunchers = customLaunchers;

    // add the saucelabs reporter
    configuration.reporters.push('saucelabs');
  }

  config.set(configuration);
}
