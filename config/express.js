/**
* Module dependencies.
*/

var methodOverride = require('method-override');
var cookieSession = require('cookie-session');
var cookieParser = require('cookie-parser');
var compression = require('compression');
var bodyParser = require('body-parser');
var session = require('express-session');
var express = require('express');
var morgan = require('morgan');
var csrf = require('csurf');
// var swig = require('swig');

var mongoStore = require('connect-mongo')(session);
var winston = require('winston');
var flash = require('connect-flash');
var pkg = require('../package.json');

function init(app, next){
	var server = app.server = express();
	var config = app.config;
	var env = app.config.env;
	var passport = app.passport;

	// Compression middleware (should be placed before express.static)
	server.use(compression({
		threshold: 512
	}));

	// Static files middleware
	server.use(express.static(config.root + '/public'));

	// Use winston on production
	var log;
	if (env !== 'development') {
		log = {
			stream: {
				write: function (message, encoding) {
					winston.info(message);
				}
			}
		};
	} else {
		log = 'dev';
	}

	// Don't log during tests
	// Logging middleware
	var logFormat = '[:method : :status] :date[iso]\t(:response-time ms :res[content-length]b) :url - :remote-addr';

	if (env == 'development')
		server.use(morgan(logFormat));
	else if (env == 'production')
		server.use(morgan(logFormat));

	// expose package.json to views
	server.use(function (req, res, next) {
		res.locals.pkg = pkg;
		res.locals.env = env;
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
