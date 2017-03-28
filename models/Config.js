/**
 * Config
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs    :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  identity: 'config',
  connection: 'default',

  attributes: {
    id: {
      type: 'string',
    },

    value: {
      defaultsTo: null,
    },
  }

};
