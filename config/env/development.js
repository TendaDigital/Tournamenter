var env = process.env;
var port = process.env.PORT || 3000;
var domain = 'http://localhost:'+port;

module.exports = {
	port: port,
	domain: domain,

	session: {
		secret: 'somesecretstring',
	},

	adapter: env.DB_ADAPTER || 'sails-disk',

  connection: {
    filePath: env.DB_FILEPATH || './.tmp/default/',
  },

};
