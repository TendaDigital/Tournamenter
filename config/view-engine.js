var TAG = _TAG('config.view-engine');

const expressLayouts = require('express-ejs-layouts');

module.exports = function viewEngine(app, next){
  console.log(TAG, 'Configuring view engine');

  // Set EJS as default view engine
  app.server.set('view engine', 'ejs');

  // Layout rendering
  app.server.set('layout', 'layout')
  app.server.use(expressLayouts)

  next();
}
