var TAG = _TAG('Modules');
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
    /MyModule               <- Root folder
    /MyModule/index.js      <- Index file to be loaded (the module itself)
    /MyModule/public        <- assets folder that will be public (done by Grunt)

  Here is the basic class of a module:
    MyModule: {
      type: ['string']      <- type of module. Will install inside
                               types[type][moduleName], and also under
                               'modules' object.
                               Notice that a module can have multiple types

      initialize: function  <- Called when module is installed

      getAssets: function   <- Called to find out witch assets to compile/serve
      [...]
    }
*/
var fs = require('fs');
var path = require('path');

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

  loadModules: function(root){

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
    files.forEach(function(file){
      var dirPath = path.join(root, file);

      // Add module and path if it's a directory
      if(!fs.statSync(dirPath).isDirectory())
        return false;

      Modules.loadModule(dirPath);
    });
  },

  /*
    Installs a given module inside a folder
    The name of the module used is:
      1) The given name in the parameter
      2) The `name` attribute in package.json
      3) The basepath of the directory
  */
  loadModule: function (extPath, moduleName = null) {
    try {
      // Checks if it's a directory
      if(!fs.statSync(extPath).isDirectory())
        return false;
    } catch (e) {
      return false;
    }

    // Check for a package.json
    if (!moduleName) {
      try {
        let pkg = require(path.join(extPath, 'package.json'));
        moduleName = pkg.name;
      } catch (e) {
        // Could not load package.json, but that's expected if not an npm package
      }
    }

    // Check for the basepath of the directory
    if (!moduleName) {
      moduleName = path.basename(extPath);
    }

    return this.install(moduleName, extPath);
  },

  /*
    Install a given module with the given path
  */
  install: function(moduleName, modulePath){
    console.log(TAG, chalk.cyan(`Install`), chalk.yellow(`${moduleName}`));

    var module = null;

    try{
      module = require(modulePath);
    }catch(e){
      console.info('Could not require module: '.red + moduleName + ' at '.cyan + module, e);
      return;
    }

    // Register module
    var types = module.type || module.types || ['default'];

    // Make sure type is an array
    if(!_.isArray(types))
      types = [types];

    // Register module into main module keeper
    this.modules[moduleName] = module;

    var modTypes = this.types;

    // Register this module in every type
    types.forEach(type => {
      // If first type this type is added, create an empty object
      if (!(type in modTypes)) {
        modTypes[type] = {};
      }
      // Add to the types holder
      modTypes[type][moduleName] = module;
    })
  },

  /*
    Initialize all modules (Should be called before lifting)
  */
  initialize: function () {
    // Initialize modules
    for(var id in this.modules){
      let mod = this.modules[id];

      if(mod.initialize)
        mod.initialize(app);
    }
  },
}
module.exports = Modules;
