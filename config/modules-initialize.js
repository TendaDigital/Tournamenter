const TAG = _TAG('modules-initialize');

module.exports = function (app, next) {
  // Initialize modules
  app.helpers.Modules.initialize();

  next();
}
