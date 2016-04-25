/**
 * Module dependencies.
 */

var path = require('path');
var extend = require('util')._extend;

var ENV = process.env.NODE_ENV || 'development';
var enviroment = require('./env/'+ENV);

var defaults = {
  root: path.normalize(__dirname + '/..'),
  env: ENV,
};

/**
 * Expose
 */

module.exports = extend(enviroment, defaults);