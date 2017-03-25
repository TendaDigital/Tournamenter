var path = require('path');
var express = require('express');

module.exports = function build(app, next){

  const BUILD_PATH = path.join(app.config.tmpPath, app.config.appName);

  var assets = app.config.assetPaths = {
    js: [],
    css: [],
    jst: [],
    serve: [],
  };

  // Set tournamenter path server
  assets.serve.push(path.join(__dirname, '../public'));

  // Include Module Assets in compilation (CSS, Templates, ...)
  _.forEach(app.helpers.Modules.modules, (mod) => {
    // Check if module exposed getAssets method
    if(!_.isFunction(mod.getAssets))
      return;

    var modAssets = mod.getAssets && mod.getAssets();

    if(!modAssets)
      return;

    // Push module assets to global assets
    modAssets.js && assets.js.push(...modAssets.js)
    modAssets.css && assets.css.push(...modAssets.css)
    modAssets.jst && assets.jst.push(...modAssets.jst)
    modAssets.serve && assets.serve.push(...modAssets.serve)
  })


  // Set builded tmp folder
  assets.serve.push(BUILD_PATH);

  app.helpers.Builder(BUILD_PATH, assets, next);

}
