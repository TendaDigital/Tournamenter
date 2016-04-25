/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var PluginTimestamp = require('mongoose-timestamp');

var ImageManip = app.helpers.ImageManip;

/**
 * User schema
 */

var Model = new Schema({
	name: String,
	race: String,
	owner: String,

});

/**
 * User plugin
 */

Model.plugin(PluginTimestamp);

/**
 * Hooks
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */

Model.method({

});

/**
 * Statics
 */

Model.static({

});

/**
 * Register
 */

mongoose.model('Pet', Model);
