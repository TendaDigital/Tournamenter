![Tournamenter](media/Tournamenter.png)

# Tournamenter

Run a tournament on a local network. Organizers manage teams, matches, scoring tables and rotating displays. Spectators open the public views from a browser on the same network. The server, fonts, styles, flags, scripts and ranking engine run on the event computer.

## Run from source

Use Node.js 22.11 or newer. The maintained desktop build uses Node.js 24.

```sh
npm ci
npm run build
npm start
```

Open `http://localhost:3000`. Other devices use the server computer's LAN address and port. Installing dependencies needs internet. Starting the built server, managing an event and displaying local slides work offline. Online imports and synchronization in extensions need their external services.

The browser interface uses React and Next.js static export. The desktop launcher packages the export and the Node server together. To install the companion application, see [TournamenterApp](https://github.com/TendaDigital/TournamenterApp).

## Event administration

| Page | Use |
| --- | --- |
| `/teams/manage` | Create teams and edit names and locations |
| `/groups/manage` | Schedule games and manage group standings |
| `/tables/manage` | Configure columns, import teams, enter scores and download CSV |
| `/views/manage` | Compose and order slides for a display |
| `/views/view` | Open a public presentation |

The administrative ranking uses the full column count. **Score Columns (View)** limits the columns used to compute and display public results. Existing named ranking methods, method chains and score-only JavaScript formulas are supported. Custom JavaScript runs in an embedded QuickJS interpreter with the score array as input. Extensions register named methods for scoring rules that need host services.

## Server settings

| Variable | Purpose |
| --- | --- |
| `PORT`, `HOST` | Defaults to port 3000 on all interfaces |
| `APP_UID`, `APP_NAME`, `APP_LOGO` | Event identifier, display name and path to a local logo |
| `PASSWORD` | Organizer password. Leave empty for an open local event |
| `DB_FOLDER` or `DB_PATH` | Event directory or full path to a .db file. The default is .tmp/&lt;APP_UID&gt;.db in the application directory |
| `DB_ADAPTER` | disk (default), mongo or memory. The original sails-disk, sails-mongo and sails-memory values also work |
| `DB_URL` | MongoDB connection string including the event database name when using mongo |
| `SESSION_SECRET` | Optional signing secret. Local sessions otherwise use a fresh secret at startup |
| `TOURNAMENTER_EXTENSIONS_JSON` | JSON array of local extension paths, including Windows paths |
| `TOURNAMENTER_EXTENSIONS` | Legacy path list, separated by the platform path delimiter, comma or semicolon |

The disk adapter reads the original sails-disk file format. Writes retain the other collections, schema metadata, counters and extension fields in that file. For an existing event, stop its old server and copy its .db file before opening it with the new version. The desktop app keeps a separate event file per server profile. MongoDB uses the native driver and retains legacy collection names and ObjectId lookup.

## Extensions

The [OBR plugin](https://github.com/ivanseidel/tournamenter-obr) provides judging, OBR ranking methods and Olimpo integration. Build the React version of that plugin before starting the server with its directory in the extension list.

An extension exports a CommonJS object. The host creates its models and controllers, calls `getAssets(host)` to register guards and serve local asset roots, then calls `initialize(host)` before the core routes. Extensions can contribute menus and replace the home route. Model reads and writes support promises, callbacks and `.exec(callback)`. Run one event per process when using extensions that depend on the legacy global app.

A presentation extension may provide `type: 'pageview'` and `client: { name, entry }`. Serve the ES module at the same-origin path named by `entry`. Its `Display` and optional `Configure` components receive React and the current page. The configuration editor can call `saveOptions`. The server-side `process(page, callback)` hook supplies the display data. See the [tested page extension](client/test/fixture-pageview/index.js).

## Hosted edition

`require('tournamenter').createApplication({ env, sessionStore })` initializes the Express request handler as `host.server`. It opens storage without binding a TCP port. The desktop CLI calls `listen()` around that handler. A future Vercel function can reuse the initialized application within an instance. Serve the exported client assets from the CDN and send the application paths and API requests to the handler.

Use a persistent event database and a shared Express session store for hosted instances. Configure a stable session signing secret and organizer authentication. The local OBR volunteer credential file, in-memory sessions and interval-based synchronization need shared persistence and a scheduled job for an online edition. Vercel Functions use instance-local temporary storage. See [Vercel runtime storage](https://vercel.com/docs/functions/runtimes#file-system-support) and [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports).

## Verification

`npm test` covers legacy disk data, concurrent edits, login, CRUD, standings, presentations and CSV. Set `TOURNAMENTER_TEST_MONGO_URL` to test the native driver against MongoDB. The suite creates a uniquely named test database and removes it when the test finishes.

After a client build, run `npx --prefix client playwright install chromium` and `npm --prefix client run test:e2e` for browser tests. The CI workflow also checks the packed CLI.

## Credits

Created by [Ivan Seidel](https://github.com/ivanseidel). Released under the MIT license.
