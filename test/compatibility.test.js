const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createApplication } = require('../app');
const standings = require('../server/standings');

test('partially populated legacy tables and empty score rows can be projected and exported', async t => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'tournamenter-legacy-'));
  t.after(() => fs.rm(folder, {recursive:true, force:true}));
  const file = path.join(folder, 'event.db');
  const archived = JSON.stringify({ data: {
    table: [{id:1, name:'Old ranking'}],
    scores: [{id:1, tableId:'1', scores:null}, {id:2, tableId:'1', scores:{0:{value:6}}}],
  }, counters:{}, schema:{}});
  await fs.writeFile(file, archived);
  const host = await createApplication({env:{DB_FOLDER:file}});
  t.after(() => host.close());
  const [table] = await standings(host).tables(1);
  assert.deepEqual(table.headers, {rank:'Rank',team:'Team',scores:['Score 1'],final:'Final'});
  const matrix = host.helpers.ConvertTableToMatrix(table);
  assert.deepEqual(matrix.map(row => [row[2],row[3]]), [['Score 1','Final'],[6,6],['-',0]]);
  const [publicTable] = await standings(host).tables(1, { isView:true, publicDisplay:true });
  assert.equal(publicTable.scores[0].scores[0].value, 6);
  assert.equal(await fs.readFile(file, 'utf8'), archived);
});

test('a later extension failing at startup releases previously initialized extensions', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tournamenter-init-'));
  t.after(() => fs.rm(dir, {recursive:true, force:true}));
  const first = path.join(dir,'first.cjs'), second = path.join(dir,'second.cjs');
  await fs.writeFile(first, `module.exports = {
    initialize(host) {
      const close = host.close;
      host.close = async () => { module.exports.closed = true; await close(); };
    }
  };`);
  await fs.writeFile(second, "module.exports = { initialize() { throw new Error('Plugin unavailable'); } };");
  await assert.rejects(createApplication({env:{
    DB_ADAPTER:'memory', TOURNAMENTER_EXTENSIONS_JSON:JSON.stringify([first,second]),
  }}), /Plugin unavailable/);
  assert.equal(require(first).closed, true);
});
