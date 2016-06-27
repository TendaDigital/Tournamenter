var TAG = _TAG('config.lift');

function config(app, next){
  console.log(TAG, 'Lifting...')
	// Bind server to port
	app.server.set('port', app.config.port);
	app.server.listen(app.server.get('port'));

	next();
}

module.exports = config;
