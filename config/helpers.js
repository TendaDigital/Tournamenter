var TAG = 'config.helpers';
var fs = require('fs');
var path = require('path');

// Load instantly, so that files can access helpers directly on root scope
var helpersDirectory = __dirname + '/..' + '/helpers/';

app.helpers = {};

fs.readdirSync(helpersDirectory).forEach(function (file) {
	if (file.indexOf('.js') < 0)
		return;

	var model = require(helpersDirectory + file);
	var name = path.basename(file, '.js');

	app.helpers[name] = model;
});

console.log(TAG, 'Installed Helpers:', _.keys(app.helpers).join(','));


function config(app, next){
	next();
}

module.exports = config;