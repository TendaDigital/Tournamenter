const express = require('express');
const { getQuickJS } = require('quickjs-emscripten');
const configuration = require('./config/config');
const { openModels } = require('./server/models');
const { controllers } = require('./server/controllers');
const { configureHTTP, registerRoutes } = require('./server/http');

async function createApplication({ env = process.env, sessionStore } = {}) {
  const config = configuration(env);
  await getQuickJS();
  const { models, close } = await openModels(config);
  const host = { config, models, server: express(), helpers: {}, close };
  try {
    // The CommonJS extension API historically provides these process globals.
    global.app = host;
    global._ = require('lodash');
    global.async = require('async');
    global._TAG = tag => '[' + tag + ']';
    host.helpers.Modules = require('./helpers/Modules')();
    host.helpers.isAuthenticated = (req, res, next) => {
      if (!config.password || req.session?.authentication === config.password) return next();
      if (req.accepts(['html','json']) === 'json') return res.status(401).json({error: 'Login required'});
      return res.redirect('/login');
    };
    host.helpers.ConvertTableToMatrix = require('./helpers/ConvertTableToMatrix');
    host.helpers.ConvertMatrixToCSV = require('./helpers/ConvertMatrixToCSV');
    host.controllers = controllers(host);
    configureHTTP(host, { sessionStore });
    for (const dir of config.extensions) host.helpers.Modules.loadModule(dir);
    const extensions = Object.values(host.helpers.Modules.modules);
    for (const extension of extensions) {
      const assets = extension.getAssets?.(host);
      for (const dir of assets?.serve || []) host.server.use(express.static(dir));
    }
    for (const extension of extensions) await extension.initialize?.(host);
    registerRoutes(host);
    return host;
  } catch (error) {
    await close();
    throw error;
  }
}

async function listen(options) {
  const host = await createApplication(options);
  try {
    const listener = await new Promise((resolve, reject) => {
      const server = host.server.listen(host.config.port, host.config.host, error => error ? reject(error) : resolve(server));
    });
    const closeStore = host.close;
    host.close = async () => {
      await new Promise((resolve, reject) => listener.close(error => error ? reject(error) : resolve()));
      await closeStore();
    };
    host.listener = listener;
    return host;
  } catch (error) { await host.close(); throw error; }
}

function lift(callback) {
  const started = listen();
  if (callback) started.then(host => callback(null, host), callback);
  return started;
}

module.exports = Object.assign(lift, { createApplication, listen });
if (require.main === module) require('./bin/tournamenter').start();
