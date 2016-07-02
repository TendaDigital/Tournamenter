/**
 * Module dependencies
 */

var _ = require('lodash');
var util = require('util');
// var pluralize = require('pluralize');
// var STRINGFILE = require('sails-stringfile');
var BlueprintController = {
  create: require('./actions/create'),
  find: require('./actions/find'),
  findone: require('./actions/findOne'),
  update: require('./actions/update'),
  destroy: require('./actions/destroy'),
  populate: require('./actions/populate'),
};

module.exports = BlueprintController;
