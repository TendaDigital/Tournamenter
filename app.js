var TAG = 'app';

/**
 * Module dependencies
 */

var async = require('async');

/**
 * Global App Object
 */
var app = {
	config: require('./config/config'),
};

/**
 * Define Globals
 */
global.app = app;

global._ = require('lodash');
global.async = require('async');
global.chalk = require('chalk');
global._TAG = function (tag, color = 'cyan'){
  return chalk[color](`[${tag}]`);
}


/*
 * Bootstrap Process
 */
var configSetps = [
	// Setup Logging
	// require('./config/log'),

	// Bootstrap Helpers
	require('./config/helpers'),

  // Load app modules
  require('./config/modules'),

	// Bootstrap Models and connect to DB
	require('./config/models'),

	// Bootstrap Controllers
	require('./config/controllers'),

  // Bootstrap application settings
	require('./config/express'),

  // Setup view engine (EJS)
	require('./config/view-engine'),

  // Setup express veiw Locals (global variables)
	require('./config/view-locals'),

  // Build Assets
  require('./config/build'),

	// Start static serving on /public folder
	require('./config/express-assets'),

  // Bootstrap API routes
	require('./config/routes-app'),

  // Bootstrap routes
  require('./config/routes'),

	// Start Server
	require('./config/lift'),
];

async.eachSeries(configSetps, function (config, next){
  // Call configuration step with the app, and the callback
	config(app, next);
}, function (err){
	if(err){
		console.error(_TAG(TAG), 'Failed to initialize Server: %s', err);
		throw err;
	}

  console.log(_TAG(TAG, 'green'), 'Lifted. Port:', app.config.port, '['+app.config.env+']');
});
