# Tournamenter client

The Next.js build exports static HTML and JavaScript into `out/`. The Tournamenter server delivers these files at the original management and presentation URLs. All fonts, styles and dependencies required for an event are included locally. A browser needs a connection to the event server on the LAN.

Run `npm ci` and `npm run build` in this directory, then start Tournamenter from its root. With the server's dependencies installed, run `npx playwright install chromium` and `npm run test:e2e` here to exercise the exported UI against a temporary event. Set `CHROMIUM_PATH` to use a locally installed Chrome or Chromium instead.

## Page view extensions

A CommonJS server extension with `type: 'pageview'` can declare a browser ES module under `client: {name, entry}`. The installed extension serves `entry` on the Tournamenter origin and includes its own offline assets. The server registers its package name (or directory name) as the page module identifier.

Export a React function component named `Display` from the ES module. It receives `{ React, page }`. The page includes the persisted options and the data returned by the extension's server-side `process(page, done)`. An optional `Configure` component receives `{ React, page, saveOptions }` in the administration screen. Call and await `saveOptions(updatedOptions)` to persist the complete options object. Components can use the supplied React instance for hooks and elements. See [the test extension](test/fixture-pageview/index.js).
