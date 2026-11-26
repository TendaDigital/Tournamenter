module.exports = {
  type: 'pageview',
  client: { name: 'Arena announcement', entry: '/arena/display.mjs' },
  initialize(host) {
    host.server.get('/arena/display.mjs', (_req, res) =>
      res.type('text/javascript').send(`
      export function Display({ React, page }) {
        return React.createElement('h2', null, page.data);
      }
      export function Configure({ React, saveOptions }) {
        return React.createElement('button', {onClick: () => saveOptions({message:'Arena B'})}, 'Use Arena B');
      }
    `),
    );
  },
  process(page, done) {
    done(null, { ...page, data: page.options.message || 'Arena A' });
  },
};
