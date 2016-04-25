function config(app, next){
	var server = app.server;

	/*
	 * Routes applied to the Root Scope
	 */

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
		app.error(err.stack || err);
		res.status(500).send({
			code: 500,
			url: req.originalUrl,
			error: err.message || err,
			details: ''+err
		});
	});

	// Returns 404 if no middleware responded
	server.use(function (req, res, next) {
		res.status(404).send({
			code: 404,
			url: req.originalUrl,
			error: 'Not found'
		});
	});

	next();
}

module.exports = config;
