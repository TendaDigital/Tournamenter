var TAG = _TAG('config.express-assets');

var express = require('express');

function config(app, next){
  console.log(TAG, 'Configuring express assets')
  
	app.server.use(express.static('../public'));

	next();
}

module.exports = config;
