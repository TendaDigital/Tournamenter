/**
 * Module dependencies.
 */
var chalk = require('chalk');
var TAG = chalk.white('[CONFIG]');

var path = require('path');
var extend = require('util')._extend;

var ENV = process.env.NODE_ENV || 'development';
var enviroment = require('./env/'+ENV);

var defaults = {
  root: path.join(__dirname, '/..'),
  env: ENV,
  tmpPath: process.env.TMP_PATH || path.join(__dirname, '/../.tmp'),
};

/**
 * Expose
 */

module.exports = extend(enviroment, defaults);

/**
 * Log Config information
 */
console.log();
console.log();
console.log(TAG, chalk.cyan('             SERVER'));
console.log(TAG, chalk.blue('       root:'), module.exports.root);
console.log(TAG, chalk.blue('       port:'), module.exports.port);
console.log(TAG, chalk.blue('    tmpPath:'), module.exports.tmpPath);
console.log();
console.log(TAG, chalk.cyan('             TOURNAMENTER'));
console.log(TAG, chalk.blue('    version:'), module.exports.version);
console.log();
console.log(TAG, chalk.cyan('             SECURITY'));
console.log(TAG, chalk.blue('   password:'), module.exports.password || '<no authentication>');
console.log();
console.log(TAG, chalk.cyan('              APP'));
console.log(TAG, chalk.blue('        env:'), module.exports.env);
console.log(TAG, chalk.blue('     appUid:'), module.exports.appUid);
console.log(TAG, chalk.blue('    appLogo:'), module.exports.appLogo);
console.log(TAG, chalk.blue('    appName:'), module.exports.appName);
console.log();
console.log(TAG, chalk.cyan('             DATABASE'));
console.log(TAG, chalk.blue('        url:'), module.exports.connection.url || '<no url>');
console.log(TAG, chalk.blue('    adapter:'), module.exports.adapter);
console.log(TAG, chalk.blue('   fileName:'), module.exports.connection.fileName);
console.log();
console.log(TAG, chalk.cyan('             EXTENSIONS [TOURNAMENTER_EXTENSIONS]'));
console.log(TAG, chalk.blue(' extensions:'), process.env.TOURNAMENTER_EXTENSIONS || '<no extensions>');
console.log();
console.log();