// Exercise the same tarball and executable used by npm installs. Keep everything
// under a hidden ancestor to cover user-level installations such as ~/.local.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawn } = require('node:child_process');
const { once } = require('node:events');

async function main() {
  const root = path.resolve(__dirname, '..');
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), '.tournamenter-pack-'));
  const target = path.join(temp, 'package');
  const npm = process.env.npm_execpath;
  if (!npm) throw new Error('Run npm run test:package');
  const runNpm = (args, cwd) => execFileSync(process.execPath, [npm, ...args], { cwd, encoding:'utf8' });
  let server;
  try {
    const [pack] = JSON.parse(runNpm(['pack','--json','--ignore-scripts','--pack-destination',temp], root));
    assert.ok(pack.files.some(file => file.path === 'client/out/index.html'), 'Missing Next.js export in npm tarball');
    execFileSync('tar', ['-xf',path.join(temp, pack.filename),'-C',temp]);
    await fs.copyFile(path.join(root, 'package-lock.json'), path.join(target, 'package-lock.json'));
    runNpm(['ci','--omit=dev','--ignore-scripts','--no-fund','--no-audit'], target);
    server = spawn(process.execPath, [path.join(target,'bin/tournamenter.js')], {
      cwd:temp, env:{...process.env, HOST:'127.0.0.1', PORT:'0', PASSWORD:'', DB_FOLDER:temp, DB_ADAPTER:'disk', TOURNAMENTER_EXTENSIONS_JSON:'[]'},
      stdio:['ignore','pipe','inherit'],
    });
    let logs = '';
    const port = await new Promise((resolve,reject) => {
      const timer = setTimeout(() => reject(new Error('CLI startup timed out')), 15000);
      server.stdout.on('data',chunk => {
        logs += chunk;
        const match = /listening on port (\d+)/.exec(logs);
        if (match) { clearTimeout(timer); resolve(match[1]); }
      });
      server.once('exit',code => { clearTimeout(timer); reject(new Error('CLI exited with ' + code)); });
      server.once('error',reject);
    });
    const base = 'http://127.0.0.1:' + port;
    for (const route of ['/health','/teams/manage','/branding.png','/views/view','/css/template.css']) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200, route);
      if (route === '/teams/manage') {
        const html = await response.text();
        const asset = html.match(/src="(\/_next\/[^"]+\.js)"/)?.[1];
        assert.ok(asset, 'Next.js asset missing from page');
        assert.equal((await fetch(base + asset)).status,200);
      }
    }
    console.log('Installed CLI served the offline application, branding and scripts.');
  } finally {
    if (server && server.exitCode == null && server.signalCode == null) {
      const stopped = once(server, 'exit');
      server.kill();
      await stopped;
    }
    await fs.rm(temp, {recursive:true, force:true});
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
