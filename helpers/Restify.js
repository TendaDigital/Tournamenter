module.exports = function Restify(Model, action){
  var Blueprints = app.helpers.Blueprints;
  if(!(action in Blueprints))
    throw new Error('Blueprint action `'+action+'` not found.');

  return function (req, res, options) {
    req.options = _.defaults({}, options || {});

    Blueprints[action](req, res, Model);
  }
}
