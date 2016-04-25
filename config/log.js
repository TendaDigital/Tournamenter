var winston = require('winston');

function config(app, next){

	if(app.config.env == 'development')
		winston.level = 'debug';

	if(app.config.env == 'production')
		winston.level = 'debug';

	if(app.config.env == 'test')
		winston.level = 'error';
	
	app.debug = winston.debug;
	app.info = winston.info;
	app.error = winston.error;

	next();
}

module.exports = config;