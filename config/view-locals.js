var TAG = _TAG('config.view-locals')

module.exports = function (app, next){
  console.log(TAG, 'Configure')

  // Find all menu configurations
  var menus = [];
  _.forEach(app.controllers, (ctrl) => {
    if('_config' in ctrl && 'menus' in ctrl._config)
      menus.push(...ctrl._config.menus);
  });

  // Include menus from extensions that required that
  _.forEach(app.helpers.Modules.types['menu'] || [], mod => {
    if('menus' in mod)
      menus.push(...mod.menus);
  });

  menus = _.sortBy(menus, 'order');

  // Set Locals that are constant
  app.server.locals.title = app.config.appName;
	app.server.locals._projectName = app.config.appName;
	app.server.locals._rootUrl = '';
	app.server.locals._menus = menus;
	app.server.locals.sideMenu = false;
	app.server.locals.path = '/';
	app.server.locals._version = app.config.version;

  next()
}
