var TAG = _TAG('config.express-assets');

var path = require('path');
var express = require('express');

function config(app, next){
  console.log(TAG, 'Setup static serving');

  // Serve main logo
  app.server.get('/branding.png', app.controllers.Api.branding)

  // Serve assets
  _.forEach(app.config.assetPaths.serve, (path) => {
    app.server.use(express.static(path));
  })

	next();
}

module.exports = config;
