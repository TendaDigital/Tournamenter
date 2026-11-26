const path = require('node:path');
const pkg = require('../package.json');

module.exports = function configuration(env = process.env) {
  const root = path.resolve(__dirname, '..');
  const uid = env.APP_UID || env.APP_NAME || 'tournamenter';
  const location = path.resolve(env.DB_FOLDER || env.DB_PATH || path.join(root, '.tmp'));
  const file = /\.db$/i.test(location) ? location : path.join(location, path.basename(uid) + '.db');
  const extensions = env.TOURNAMENTER_EXTENSIONS_JSON
    ? JSON.parse(env.TOURNAMENTER_EXTENSIONS_JSON)
    : (env.TOURNAMENTER_EXTENSIONS || '').split(process.platform === 'win32' ? /[;,|]/ : /[:,;|]/).filter(Boolean);
  if (!Array.isArray(extensions) || extensions.some(item => typeof item !== 'string' || !item)) {
    throw new Error('TOURNAMENTER_EXTENSIONS_JSON must be an array of extension paths');
  }
  return {
    root, appUid: uid, appName: env.APP_NAME || pkg.name, version: pkg.version,
    port: Number(env.PORT || 3000), host: env.HOST || '0.0.0.0',
    password: env.PASSWORD || null, sessionSecret: env.SESSION_SECRET,
    appLogo: env.APP_LOGO || path.join(root, 'public/img/branding.png'),
    tmpPath: env.TMP_PATH || path.dirname(file),
    connection: { filePath: path.dirname(file), fileName: path.basename(file), url: env.DB_URL },
    adapter: env.DB_ADAPTER || 'sails-disk',
    extensions: extensions.map(item => path.resolve(root, item)),
    instance: env.TOURNAMENTER_INSTANCE_TOKEN,
  };
};
