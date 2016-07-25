const path = require('path')

module.exports = function (app, next) {
  const LOCAL_MODULES_PATH = path.join(__dirname, '../modules');

  // Load Default Modules
  app.helpers.Modules.load(LOCAL_MODULES_PATH);

  // Load dynamic modules (Passed in from command line)

  next();
}
