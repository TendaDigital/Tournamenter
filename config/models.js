var mongoose = require('mongoose');

var TAG = 'config.models';
var fs = require('fs');
var path = require('path');

// Load instantly, so that files can access models directly on root scope
var modelsDirectory = __dirname + '/..' + '/models/';

app.models = {};

fs.readdirSync(modelsDirectory).forEach(function (file) {
	if (file.indexOf('.js') < 0)
		return;

	var modelBuilt = require(modelsDirectory + file);
	var name = path.basename(file, '.js');

	app.models[name] = mongoose.model(name);
});

console.log(TAG, 'Installed Models:', _.keys(app.models).join(','));


function config(app, next){
	next();
}

module.exports = config;