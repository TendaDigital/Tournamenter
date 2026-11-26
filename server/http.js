const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const session = require('express-session');
const { resources } = require('./controllers');

function configureHTTP(host, { sessionStore } = {}) {
  const { config, server } = host;
  const instanceKey = crypto.createHash('sha256').update([config.connection.filePath, config.connection.fileName, config.port].join('\0')).digest('hex').slice(0, 16);
  server.disable('x-powered-by');
  server.set('query parser', 'extended');
  server.set('views', []); // External modules can add directories of their own.
  server.use(express.urlencoded({ extended: true, limit: '500kb' }), express.json({ limit: '500kb' }));
  server.use(session({
    name: 'tournamenter_' + instanceKey,
    secret: config.sessionSecret || crypto.randomBytes(32).toString('hex'),
    store: sessionStore, resave: false, saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 12 * 60 * 60 * 1000 },
  }));
  server.use((req, res, next) => {
    req.param = (key, fallback) => req.params?.[key] ?? req.body?.[key] ?? req.query[key] ?? fallback;
    if (req.method === 'POST' && ['PUT','PATCH','DELETE'].includes(req.body?._method?.toUpperCase?.())) {
      req.method = req.body._method.toUpperCase();
      delete req.body._method;
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('origin')) {
      let origin;
      try { origin = new URL(req.get('origin')).host; } catch {}
      if (origin !== req.get('host')) return res.status(403).json({ error: 'Cross-origin write rejected' });
    }
    next();
  });
  server.get('/health', (req, res) => res.json({ status: 'ok', instance: config.instance }));
}

function registerRoutes(host) {
  const { config, server, controllers: ctrl } = host;
  const auth = host.helpers.isAuthenticated;
  const out = path.join(config.root, 'client/out');
  const html = (req, res) => res.sendFile('index.html', { root: out });
  server.get('/branding.png', (req, res) => res.sendFile(path.basename(config.appLogo), { root: path.dirname(path.resolve(config.appLogo)) }));
  server.use('/_next', express.static(path.join(out, '_next')));
  server.use(express.static(path.join(config.root, 'public'), {index: false}));
  const menu = [
    { name: 'Teams', path: '/teams/manage', order: 0 },
    { name: 'Groups', path: '/groups/manage', order: 1 },
    { name: 'Tables', path: '/tables/manage', order: 3 },
    { name: 'Views', path: '/views/manage', order: 5 },
    ...Object.values(host.helpers.Modules.get('menu') || {}).flatMap(mod => mod.menus || []),
  ];
  if (config.password) menu.push({ name: 'Logout', path: '/logout', order: 999 });
  menu.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
  const pageViews = Object.entries(host.helpers.Modules.get('pageview') || {}).flatMap(([module, plugin]) => {
    const entry = plugin.client?.entry;
    if (typeof entry !== 'string' || !entry.startsWith('/')) return [];
    const local = new URL(entry, 'http://tournamenter.local');
    if (local.origin !== 'http://tournamenter.local') return [];
    return [{ module, name: plugin.client.name || module, entry: local.pathname + local.search }];
  });
  server.get('/api/ui', (req, res) => res.json({
    appName: config.appName, version: config.version, menus: menu, pageViews,
    evaluateMethodsNames: [...new Set([...Object.keys(host.models.Table.evaluateMethods), host.models.Table.attributes.evaluateMethod.defaultsTo])],
  }));
  server.get('/login', (req, res) => !config.password || req.session.authentication === config.password ? res.redirect('/') : html(req, res));
  server.post('/login', (req, res, next) => {
    if (!config.password) return res.redirect('/');
    const hash = value => crypto.createHash('sha256').update(String(value ?? '')).digest();
    if (!crypto.timingSafeEqual(hash(req.body?.password), hash(config.password))) return res.redirect('/login?error=1');
    req.session.regenerate(error => {
      if (error) return next(error);
      req.session.authentication = config.password; // Server-side session, also used by existing plugins.
      req.session.save(error => error ? next(error) : res.redirect('/'));
    });
  });
  server.get('/logout', (req, res, next) => req.session.destroy(error => error ? next(error) : res.redirect(config.password ? '/login' : '/')));
  server.get(['/','/teams/manage','/groups/manage','/tables/manage{/:id}','/views/manage{/:id}','/matches/live/:id'], auth, html);
  server.get('/views/view{/:id}', html);
  server.get('/api/admin/views{/:id}', auth, ctrl.View.find);
  server.get('/views/find{/:id}', ctrl.View.associated);
  server.get('/teams/teamlist', ctrl.Team.teamlist);
  server.get('/teams/find', auth, ctrl.Team.teamlist);
  server.get('/groups/find{/:id}', auth, ctrl.Group.associated);
  server.get('/tables/find{/:id}', auth, ctrl.Table.associated);
  server.get('/tables/:id.csv', auth, ctrl.Table.csv);

  // Some existing integrations still use the Sails shortcut URLs.
  const sameSite = (req, res, next) => req.get('sec-fetch-site') === 'cross-site'
    ? res.status(403).json({ error: 'Cross-site write rejected' }) : next();
  server.get('/scores/:id/:number', auth, sameSite, (req, res, next) =>
    /^\d+$/.test(req.params.number) && !['destroy','update'].includes(req.params.id) ? ctrl.Scores.updateScore(req, res, next) : next());
  for (const [resource, name] of Object.entries(resources)) {
    const base = '/' + resource;
    const c = ctrl[name];
    server.post(base + '/post', auth, c.post);
    server.get(base + '/create', auth, sameSite, c.create);
    server.post(base + '/create', auth, c.create);
    server.get(base + '/update/:id', auth, sameSite, c.update);
    server.get(base + '/destroy/:id', auth, sameSite, c.destroy);
    server.get(base, auth, name === 'Match' ? c.find : c.associated || c.find);
    server.get(base + '/:id', name === 'View' ? (req,res,next) => next() : auth, c.associated || c.find);
    server.post(base, auth, c.create);
    server.put(base + '/:id', auth, c.update);
    server.patch(base + '/:id', auth, c.update);
    server.delete(base + '/:id', auth, c.destroy);
  }
  server.use((req, res) => res.status(404).json({ error: 'Not found' }));
  server.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status || 500;
    if (status >= 500) console.error('Tournamenter request failed:', error.message || error);
    res.status(status).json({ error: status < 500 ? error.message : 'Tournamenter could not complete the request' });
  });
}

module.exports = { configureHTTP, registerRoutes };
