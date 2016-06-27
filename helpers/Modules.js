/*
	Module controller responsable for modularisation

	The process of loading modules:
	 + Seeking modules in given folder
	 + calling install for each of them

	The process of installing a module:
	 + requiring module
	 + registering module in modules object
	 + Initializing module (async)

	Here is a basic Module structure:
		/MyModule			<- Root folder
		/MyModule/index.js  <- Index file to be loaded (the module itself)
		/MyModule/public	<- assets folder that will be public (done by Grunt)

	Here is the basic class of a module:
		MyModule: {
			type: 'string'			<- type of module. Will install inside
									   types[type][moduleName], and also under
									   'modules' object

			initialize: function 	<- Called when module is installed

			[...]
		}
*/

var fs = require('fs');

var Modules = {

	/*
		Global variable to keep instaled modules

		MODULES - All modules loaded
		'pageview': {
			<moduleName>: <module>,
			<moduleName>: <module>,
		}
	*/
	modules: {},

	/*
		Global variable to keep modules grouped by type

		TYPES - Modules separated by type
		{
			'default': {
				<moduleName>: <module>,
			}
			'pageview': {
				<moduleName>: <module>,
				<moduleName>: <module>,
			}
		}
	*/
	types: {},

	/*
		Use this method to find a specific module, or
		get the entire group of modules of the same type
	*/
	get: function(type, moduleName){
		var types = this.types[type];
		// No type set, or type doesn't exists
		if(!type || !types)
			return null

		// type set, return module if moduleName set
		if(moduleName)
			return types[moduleName];

		// Return the entire type
		return types;
	},

	load: function(root){

		var files = [];
		try {
			// Save into files
			files = fs.readdirSync(root);
		} catch (e) {
			// If failed, stop here
			console.info('Directory not found: '.red + root);
			return {};
		}

		// Find directories only
		var moduleDirs = {};
		files.forEach(function(file){
			var dirPath = root + '/' + file;

			// Add module and path if it's a directory
			if(fs.statSync(dirPath).isDirectory())
				moduleDirs[file] = dirPath;
		});

		// Instal modules
		for(var moduleName in moduleDirs){
			var modulePath = moduleDirs[moduleName];

			// Install module
			this.install(moduleName, modulePath);
		}

	},

	/*
		Install a given module with the given path
	*/
	install: function(moduleName, modulePath){

		var module = null;

		try{
			module = require(modulePath);
		}catch(e){
			console.info('Could not require module: '.red + moduleName + ' at '.cyan + module, e);
			return;
		}

		// Register module
		var type = (module.type ? module.type : 'default');

		this.modules[moduleName] = module;

		// If first type this type is added, create an empty object
		if(!this.types[type])
			this.types[type] = {};
		this.types[type][moduleName] = module;

		// Initialize module
		if(module.initialize)
			module.initialize();

		// Do whatever else the type needs
		if(this.middlewares[type])
			this.middlewares[type](module);
	},

	middlewares: {},

}
module.exports = Modules;

/*
	MiddleWares for instalation
*/
