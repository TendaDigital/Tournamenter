var path = require('path');

var env = process.env;
var port = process.env.PORT || 3000;
var domain = 'http://localhost:'+port;
var appUid = env.APP_UID || env.APP_NAME || 'tournamenter';
var dbPath = env.DB_FOLDER || './.tmp/'
var dbFile = dbPath.indexOf('.db') >= 0 ? dbPath : path.join(dbPath, appUid + '.db')

module.exports = {
	port: port,
	domain: domain,

  appUid: appUid,
  appName: env.APP_NAME || require('../../package.json').name,
  version: require('../../package.json').version,
  password: env.PASSWORD || null,

  appLogo: env.APP_LOGO || path.join(__dirname, '../../public/img/branding.png'),

	session: {
		secret: 'somesecretstring',
	},

	adapter: env.DB_ADAPTER || 'sails-disk',

  connection: {
    filePath: dbFile,
    url: env.DB_URL || null,
  },

};
