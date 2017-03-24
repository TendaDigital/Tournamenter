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
  root: path.normalize(__dirname + '/..'),
  env: ENV,
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
console.log(TAG, chalk.blue('   filePath:'), module.exports.connection.filePath);
console.log();
console.log(TAG, chalk.cyan('             EXTENSIONS [TOURNAMENTER_EXTENSIONS]'));
console.log(TAG, chalk.blue(' extensions:'), process.env.TOURNAMENTER_EXTENSIONS || '<no extensions>');
console.log();
console.log();