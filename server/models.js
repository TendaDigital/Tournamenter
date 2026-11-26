const path = require('node:path');
const { openDisk } = require('./storage/disk');
const { openMongo } = require('./storage/mongo');

const names = ['Team', 'Group', 'Match', 'Table', 'Scores', 'View', 'Config'];
const invalid = message => Object.assign(new Error(message), { status: 400 });
function validKey(key) {
  return key && !key.startsWith('$') && !key.includes('.') && !key.includes('\0') &&
    !['_id', '__proto__', 'prototype', 'constructor', 'toObject', 'toJSON'].includes(key);
}
function criteriaFor(input) {
  if (input == null) return {};
  if (typeof input !== 'object') return { id: input };
  const criteria = input.where ?? input;
  if (Array.isArray(criteria)) throw invalid('Invalid criteria');
  for (const [key, value] of Object.entries(criteria)) {
    if (!validKey(key) || (Array.isArray(value) ? value : [value]).some(item => item != null &&
        typeof item === 'object' && !(item instanceof Date))) throw invalid('Invalid search field');
  }
  return criteria;
}

// Most extensions await model operations. Older ones use callbacks or .exec().
function result(promise, callback) {
  promise.exec = cb => promise.then(value => cb(null, value), cb);
  if (callback) promise.exec(callback);
  return promise;
}

function collection(definition, store) {
  const attributes = structuredClone(Object.fromEntries(Object.entries(definition.attributes).filter(([, v]) => typeof v !== 'function')));
  class Record {
    constructor(fields) { Object.assign(this, fields); }
    toObject() { return { ...this }; }
  }
  for (const [name, value] of Object.entries(definition.attributes)) {
    if (typeof value === 'function') Record.prototype[name] = value;
  }
  function prepare(input, creating) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalid('Expected a record');
    const values = {};
    for (const [key, value] of Object.entries(input)) {
      if (!validKey(key) || typeof Record.prototype[key] === 'function' || ['createdAt','updatedAt'].includes(key)) continue;
      if (key !== 'id' || creating) values[key] = value;
    }
    for (const [key, attr] of Object.entries(attributes)) {
      if (creating && values[key] === undefined && 'defaultsTo' in attr) values[key] = structuredClone(attr.defaultsTo);
      if ((creating || key in values) && attr.required && (values[key] == null || values[key] === '')) throw invalid(key + ' is required');
      if (values[key] == null) continue;
      if (['integer','int'].includes(attr.type)) {
        if (values[key] === '' && attr.defaultsTo === null) { values[key] = null; continue; }
        values[key] = Number(values[key]);
        if (!Number.isInteger(values[key]) || values[key] < attr.min || values[key] > attr.max) throw invalid('Invalid ' + key);
      } else if (attr.type === 'string') {
        if (typeof values[key] === 'object') throw invalid('Invalid ' + key);
        values[key] = String(values[key]);
      } else if (attr.type === 'array' || attr.type === 'json') {
        if (typeof values[key] === 'string') {
          try { values[key] = JSON.parse(values[key]); } catch { throw invalid('Invalid ' + key); }
        }
        if (typeof values[key] !== 'object' || !values[key] || (attr.type === 'array' && !Array.isArray(values[key]))) throw invalid('Invalid ' + key);
      }
      if (attr.in && !attr.in.includes(values[key])) throw invalid('Invalid ' + key);
    }
    if ('id' in values && !['string','number'].includes(typeof values.id)) throw invalid('Invalid id');
    return values;
  }

  const name = definition.identity;
  const hydrate = row => row && new Record(row);
  async function write(input, creating, criteria) {
    const values = prepare(input, creating);
    for (const hook of ['beforeValidate', creating ? 'beforeCreate' : 'beforeUpdate']) {
      if (definition[hook]) await new Promise((resolve, reject) => definition[hook](values, err => err ? reject(err) : resolve()));
    }
    if (creating) return hydrate(await store.create(name, values, criteria));
    return (await store.update(name, criteria, values)).map(hydrate);
  }

  return {
    ...definition, attributes, _model: Record,
    find(criteria, cb) {
      if (typeof criteria === 'function') { cb = criteria; criteria = {}; }
      return result(store.find(name, criteriaFor(criteria)).then(rows => rows.map(hydrate)), cb);
    },
    findOne(criteria, cb) { return result(this.find(criteria).then(rows => rows[0]), cb); },
    findById(id, cb) { return this.find({ id }, cb); },
    create(values, cb) { return result(write(values, true), cb); },
    findOrCreate(criteria, values, cb) {
      if (typeof values === 'function') { cb = values; values = criteria; }
      return result(write(values ?? criteria, true, criteriaFor(criteria)), cb);
    },
    update(criteria, values, cb) { return result(write(values, false, criteriaFor(criteria)), cb); },
    destroy(criteria, cb) { return result(store.destroy(name, criteriaFor(criteria)).then(rows => rows.map(hydrate)), cb); },
  };
}

async function openModels(config) {
  let store;
  switch (config.adapter) {
    case 'sails-memory': case 'memory': store = await openDisk(); break;
    case 'sails-disk': case 'disk': store = await openDisk(path.join(config.connection.filePath, config.connection.fileName)); break;
    case 'sails-mongo': case 'mongo': store = await openMongo(config.connection.url); break;
    default: throw new Error('Unknown DB_ADAPTER: ' + config.adapter);
  }
  const models = Object.fromEntries(names.map(name => [name, collection(require('../models/' + name), store)]));
  return { models, close: store.close };
}

module.exports = { openModels, invalid };
