const TAG = _TAG('modules-load');

const path = require('path')

module.exports = function (app, next) {
  const LOCAL_MODULES_PATH = path.join(__dirname, '../modules');

  // Load Default Modules
  app.helpers.Modules.loadModules(LOCAL_MODULES_PATH);

  // Load dynamic extensions (Passed in from command line with)
  // Usage: TOURNAMENTER_EXTENSIONS="/path/to/extension:/path/to/otherextension"
  let extensions = process.env.TOURNAMENTER_EXTENSIONS || '';
  extensions = extensions.split(/[:;|]/g);

  // Remove empty values in array
  extensions = extensions.filter( a => !!a );

  // Load all included modules
  if (extensions.length > 0) {
    extensions.forEach( ext => {
      // Convert to relative extension if starts with `.`
      if(ext[0] == '.') {
        ext = path.join(app.config.root, ext);
      }
      
      app.helpers.Modules.loadModule(ext);
    })
  }

  next();
}
