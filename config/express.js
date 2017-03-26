var TAG = _TAG('config.express');

var methodOverride = require('method-override');
var cookieSession = require('cookie-session');
var cookieParser = require('cookie-parser');
var compression = require('compression');
var bodyParser = require('body-parser');
var session = require('express-session');
var express = require('express');
var morgan = require('morgan');
var csrf = require('csurf');

var winston = require('winston');
var pkg = require('../package.json');

function init(app, next){
  console.log(TAG, 'Configuring Express')

	var server = app.server = express();
	var config = app.config;
	var passport = app.passport;

	// Compression middleware (should be placed before express.static)
	server.use(compression({
		threshold: 512
	}));

	// Static files middleware
	server.use(express.static(config.root + '/public'));

	// Logging middleware
	var logFormat = '[:method : :status] :date[iso]\t(:response-time ms :res[content-length]b) :url - :remote-addr';
	server.use(morgan(logFormat));

	// expose package.json to views
	server.use(function (req, res, next) {
		res.locals.pkg = pkg;
		next();
	});

	// bodyParser should be above methodOverride
	server.use(bodyParser.urlencoded({
		extended: true
	}));
	server.use(bodyParser.json());
	server.use(methodOverride(function (req, res) {
		if (req.body && typeof req.body === 'object' && '_method' in req.body) {
			// look in urlencoded POST bodies and delete it
			var method = req.body._method;
			delete req.body._method;
			return method;
		}
	}));

	// cookieParser should be above session
	server.use(cookieParser());
	server.use(cookieSession({ secret: 'secret' }));
	// server.use(session({
	// 	secret: config.session.secret,
	// 	proxy: true,
	// 	resave: true,
	// 	saveUninitialized: true,
	// 	store: new mongoStore({
	// 		url: config.db,
	// 		collection : 'sessions'
	// 	})
	// }));

	// use passport session
	// server.use(passport.initialize());
	// server.use(passport.session());

	next();
}

module.exports = init;
