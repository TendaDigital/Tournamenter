/**
 * Module dependencies.
 */
var path = require('path');
var chalk = require('chalk');

var TAG = chalk.white('[CONFIG]');

// Utility objects
var env = process.env
var package = require('../package.json')

// Server Configs
var port = env.PORT || 3000;
var domain = env.DOMAIN || 'localhost:' + port

// Custom Environment Configs
var ENV = env.NODE_ENV || 'development';

// General App configs
var root = path.join(__dirname, '/..')
var appUid = env.APP_UID || env.APP_NAME || 'tournamenter'
var appName = env.APP_NAME || package.name
var appLogo = env.APP_LOGO || path.join(__dirname, '/../public/img/branding.png')
var version = package.version
var password = env.PASSWORD || null

// Database Configs
var dbUrl = env.DB_URL || null
var dbAdapter = env.DB_ADAPTER || 'sails-disk'
var dbFilePath = env.DB_FOLDER || path.join(__dirname, '/../.tmp')
var dbFileName = '/' + appUid + '.db'
var dbFilePathIsFile = dbFilePath.endsWith('.db')

if (dbFilePathIsFile) {
  // DB_FOLDER was assigned a file. Set those to path and file
  dbFileName = '/' + path.basename(dbFilePath)
  dbFilePath = path.dirname(dbFilePath)
}

// Tmp Path Config
var tmpPath = env.TMP_PATH || path.join(__dirname, '/../.tmp')

// Expose configs
module.exports = {
  port: port,
  domain: domain,

  env: ENV,
  root: root,
  appUid: appUid,
  appName: appName,
  appLogo: appLogo,

  version: version,
  password: password,

  tmpPath: tmpPath,

  adapter: dbAdapter,
  connection: {
    fileName: dbFileName,
    filePath: dbFilePath,
    url: dbUrl,
  },

  session: {
    secret: 'somesecretstring',
  },

  requestSizeLimit: '500kb',
};

/**
 * Log Config information
 */
console.log();
console.log();
console.log(TAG, chalk.cyan('             SERVER [PORT|TMP_PATH]'));
console.log(TAG, chalk.blue('       root:'), module.exports.root);
console.log(TAG, chalk.blue('       port:'), module.exports.port);
console.log(TAG, chalk.blue('    tmpPath:'), module.exports.tmpPath);
console.log();
console.log(TAG, chalk.cyan('             TOURNAMENTER'));
console.log(TAG, chalk.blue('    version:'), module.exports.version);
console.log();
console.log(TAG, chalk.cyan('             SECURITY [PASSWORD]'));
console.log(TAG, chalk.blue('   password:'), module.exports.password || '<no authentication>');
console.log();
console.log(TAG, chalk.cyan('              APP [NODE_ENV|APP_UID|APP_NAME|APP_LOGO]'));
console.log(TAG, chalk.blue('        env:'), module.exports.env);
console.log(TAG, chalk.blue('     appUid:'), module.exports.appUid);
console.log(TAG, chalk.blue('    appName:'), module.exports.appName);
console.log(TAG, chalk.blue('    appLogo:'), module.exports.appLogo);
console.log();
console.log(TAG, chalk.cyan('             DATABASE [DB_URL|DB_ADAPTER|DB_FOLDER]'));
console.log(TAG, chalk.blue('        url:'), module.exports.connection.url || '<no url>');
console.log(TAG, chalk.blue('    adapter:'), module.exports.adapter);
console.log(TAG, chalk.blue('   filePath:'), module.exports.connection.filePath);
console.log(TAG, chalk.blue('   fileName:'), module.exports.connection.fileName);
console.log();
console.log(TAG, chalk.cyan('             EXTENSIONS [TOURNAMENTER_EXTENSIONS]'));
console.log(TAG, chalk.blue(' extensions:'), env.TOURNAMENTER_EXTENSIONS || '<no extensions>');
console.log();
console.log();