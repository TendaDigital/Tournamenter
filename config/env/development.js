var env = process.env;
var port = process.env.PORT || 3000;
var domain = 'http://localhost:'+port;

module.exports = {
	port: port,
	domain: domain,

	session: {
		secret: 'somesecretstring',
	},

	db: env.MONGODB_URL || 'mongodb://localhost:27017/test',

};
