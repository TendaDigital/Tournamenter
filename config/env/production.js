var env = process.env;
var port = process.env.PORT || 8000;
var domain = 'http://yourwebsite.com.br';
var appUid = env.APP_UID || env.APP_NAME || 'tournamenter';

module.exports = {
  port: port,
	domain: domain,

  appUid: appUid,
  appName: env.APP_NAME || require('../../package.json').name,
  version: env.APP_NAME || require('../../package.json').version,
  password: env.PASSWORD || null,

  appLogo: env.APP_LOGO || (__dirname + '/../../public/img/branding.png'),

	session: {
		secret: 'somesecretstring',
	},

	adapter: env.DB_ADAPTER || 'sails-disk',

  connection: {
    filePath: env.DB_FILEPATH || './.tmp/'+appUid,
    url: env.DB_URL || null,
  },

};
