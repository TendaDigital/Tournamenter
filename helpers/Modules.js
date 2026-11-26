const path = require('node:path');
const fs = require('node:fs');

module.exports = function registry() {
  const modules = Object.create(null);
  const types = Object.create(null);
  return {
    modules, types,
    get(type, name) { return name ? types[type]?.[name] : types[type]; },
    loadModule(dir) {
      const manifest = path.join(dir, 'package.json');
      const name = fs.existsSync(manifest) ? require(manifest).name : path.basename(dir);
      const extension = require(dir);
      modules[name] = extension;
      for (const type of [extension.type || extension.types || 'default'].flat()) {
        (types[type] ||= Object.create(null))[name] = extension;
      }
    },
  };
};
