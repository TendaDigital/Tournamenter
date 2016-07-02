var TAG = _TAG('config.express-assets');

var express = require('express');

function config(app, next){
  console.log(TAG, 'Setup static serving');

  // Serve assets
  _.forEach(app.config.assetPaths.serve, (path) => {
    app.server.use(express.static(path));
  })

	next();
}

module.exports = config;
