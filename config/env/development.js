var env = process.env;
var port = process.env.PORT || 3000;
var domain = 'http://localhost:'+port;

module.exports = {
	port: port,
	domain: domain,

  appName: env.APP_NAME || require('../../package.json').name,
  version: env.APP_NAME || require('../../package.json').version,
  password: env.PASSWORD || null,

	session: {
		secret: 'somesecretstring',
	},

	adapter: env.DB_ADAPTER || 'sails-disk',

  connection: {
    filePath: env.DB_FILEPATH || './.tmp/default/',
    url: env.DB_URL || null,
  },

};
