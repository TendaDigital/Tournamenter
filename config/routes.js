var TAG = _TAG('config.routes');

function config(app, next){
  console.log(TAG, 'Configuring default route handlers')
	var server = app.server;

	/*
	 * We set the root route last, so that plugins can modify it
	 */
	const auth = app.helpers.isAuthenticated;
	server.get('/', auth, app.controllers.Team.manage);


	/**
	 * Error handling
	 */

	// Returns 500 if error
	server.use(function (err, req, res, next) {
		// treat as 404
		if ((err.message || err)
			&& ~(err.message || err).indexOf('not found')) {
			return next();
		}

		// error page
    console.log('----------');
		console.error(err.stack || err);
		res.status(500).render('500', {
      title: 'Internal error',
			code: 500,
			url: req.originalUrl,
			error: err.message || err,
			details: ''+err
		});
	});

	// Returns 404 if no middleware responded
	server.use(function (req, res, next) {
		res.status(404).render('404', {
      title: 'Not found',
			code: 404,
			url: req.originalUrl,
			method: req.method,
			error: 'Not found'
		});
	});

	next();
}

module.exports = config;
