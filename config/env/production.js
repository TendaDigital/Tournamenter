var path = require('path');

var env = process.env;
var port = process.env.PORT || 8000;
var domain = 'http://yourwebsite.com.br';
var appUid = env.APP_UID || env.APP_NAME || 'tournamenter';

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
    filePath: path.join(env.DB_FOLDER || './.tmp/', appUid + '.db'),
    url: env.DB_URL || null,
  },

};
