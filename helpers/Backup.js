var fs = require('fs');

var TAG = _TAG('Backup');

/*
	Set backup interval for DB. By default, all models will be
	'backuped' in a single file.

	Options:
		interval: Time in minutes, between backups

		    path: Relative path to folder where backups will be saved,

		  models: Models to save. A comma separated string of model names
		  		  If none, all models will be backuped

		  indent: Optional indentation for stringification of JSON. Default set to '\t'

		  prefix: Optional file prefix. Will be saved in the format:
		  			prefix+'2014-03-20T21:39:48.438Z.json'

	   extension: Optional extension for file. Default is '.json'

	Usage:
		node app --backup.interval=5 --backup.path=/desktop/backupFolder
		node app --backup.interval=10 --backup.path=../backupFolder --backup.models="Team,Group"
*/
var _defaults = {
	interval: 5,
	path: 'backup/',
	models: [],
	indent: '\t',

	// File settings
	prefix: '',
	extension: '.json'
};

var Backup = {
	_defaults: _defaults,
	config: _defaults,
	interval: null,
};

Backup.start = function(config) {
	config = _.defaults({}, config, _defaults);

	// Split models string, and convert to array
	if(_.isString(config.models))
		config.models = config.models.split(',');

	// Save to global
	Backup.config = config;

	// Start interval
	var time = config.interval*1000*60;
	if(time < 60000) time = 60000;
	Backup.interval = clearInterval(Backup.interval);
	Backup.interval = setInterval(Backup.save, time);

	console.log(TAG, 'Settings'.grey +
		'\tinterval: '.green+(config.interval+' minutes').red +
		'\tpath: '.green+(config.path).red +
		'\tmodels: '.green+JSON.stringify(config.models).red);
}

Backup.ensureFolderExists = function(config){
	config = config || Backup.config;
	// Setup folder (create if empty)
	if(!fs.existsSync(config.path))
		fs.mkdirSync(config.path);
}

Backup.makeFileName = function(config){
	config = config || Backup.config;

	var dateString = new Date().toISOString();
	return config.prefix + dateString + config.extension;
}

Backup.getModels = function(models, next){

	// Get all models from sails if empty
	if((models || []).length == 0)
		models = _.keys(sails.models);

	// Create async function to find all models at once
	var finds = [];
	var output = {};

	_.each(models, function(key){

		// Normalize model name
		var modelName = key.toLowerCase();
		var model = sails.models[modelName];
		if(!model) return next('Non existent model: ' + modelName);

		// Create function to fetch data
		finds.push(function(next){

			// Find all models in collection
			model.find(function(err, data){
				if(err) return next(err);

				// Save data into output
				output[modelName] = data;

				return next(null);
			});

		});
	});

	// Make async calls
	async.parallel(finds, function(err){
		next(err, output);
	});
}

Backup.saveToFile = function(data, next){
	// Create a name and makeup full path
	var filePath = Backup.config.path;
	var fileName = Backup.makeFileName();
	var file = filePath + fileName;

	Backup.ensureFolderExists();

	fs.writeFile(file, data, function(err) {

		if(err) return next(err, file)
		next(null, file);

	});
}

/*
	Fetches and saves models into file
*/
Backup.save = function(config, next){
	config = config || Backup.config;

	// Get all models data from server
	Backup.getModels(config.models, afterGetModels);

	function afterGetModels(err, models){
		if(err){
			console.log(TAG, 'Could not fetch models to backup. '.red, err);
			if(next) next(err);
		}
		Backup.saveToFile(JSON.stringify(models, null, config.indent), afterSave);
	}

	function afterSave(err, file){
		if(err) {
			console.log(TAG, 'Could not save backup. '.red, err + ' Writing file: '.red + file.green);
			if(next) next(err, file);
		}
		console.log(TAG, 'Saved'.grey);
		if(next) next(null, file);
	}

}

/*
    Parses backup file and saves to model

    Options:
        path: path to the file where the DB backup is stored in JSON format


    Example usage:

        node app --restore.path=/tmp/something2014-07-18T00:46:47.645Z.json

*/
Backup.restore = function(config){
    if (!config.path)
        return console.log(TAG, 'Path for loading JSON data for restore procedure not specified'.red);

    fs.readFile(config.path, function(err, data){
        if (err)
            return console.log(TAG, 'Problem with reading from'.red + config.path.green, err);

        var jsonData = JSON.parse(data);
        var models = _.keys(json);

        // Destroy everything there currently is in the DB
        _.each(models, function(model){
            sails.models[model].find(function(err, data){
                if (err) return console.log(TAG, 'Problem with destroying models'.red, err);

                _.each(data, function(d){
                    d.destroy(function(err){
                        if (err) return console.log(TAG, 'Problem with destroying models'.red, err);
                    });
                });
            });
        });

        // Recreate data from the JSON file
        _.each(models, function(model){
            sails.models[model].create(jsonData[model]).done(function(err) {
                if (err) return console.log(TAG, 'Problem with creating model data'.red, err);
            });
        });
    })
}

// Set Backup as global var
module.exports = Backup;
