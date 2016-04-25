var express = require('express');

function config(app, next){

	app.server.use(express.static('../public'));

	next();
}

module.exports = config;