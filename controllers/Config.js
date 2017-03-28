var GroupController = module.exports = {

  find: app.helpers.Restify(app.models.Config, 'find'),
  create: app.helpers.Restify(app.models.Config, 'create'),
  update: app.helpers.Restify(app.models.Config, 'update'),
  destroy: app.helpers.Restify(app.models.Config, 'destroy'),

};