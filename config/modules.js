const path = require('path')

module.exports = function (app, next) {

  app.helpers.Modules.load(path.join(__dirname, '../modules'));

  next();
}
