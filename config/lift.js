var TAG = 'config.lift';

function config(app, next){
	
	// Bind server to port
	app.server.set('port', app.config.port);
	app.server.listen(app.server.get('port'));

	next();
}

module.exports = config;