var TAG = _TAG('config.lift');

function config(app, next){
  console.log(TAG, 'Lifting...')

  // Set process title
  app.title = app.config.APP_NAME + ':' + app.config.APP_UID;

	// Bind server to port
	app.server.set('port', app.config.port);
	app.server.listen(app.server.get('port'));

	next();
}

module.exports = config;
