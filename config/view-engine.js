var TAG = _TAG('config.view-engine');

module.exports = function viewEngine(app, next){
  console.log(TAG, 'Configuring Express view engine');

  app.server.set('view engine', 'ejs');
  next();
}
