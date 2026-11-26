const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { listen, createApplication } = require('../app');
const { openDisk } = require('../server/storage/disk');

test('legacy disk IDs, extension data and competing edits survive restart', async t => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'tournamenter-test-'));
  t.after(() => fs.rm(folder, {recursive: true, force: true}));
  const file = path.join(folder, 'existing.db');
  const stored = {
    data: {team: [{id: 5, name: 'Old team', country: 'br', integrationId: 'existing'}], external: [{id: 17}]},
    counters: {team: {id: 8}}, schema: {external: {id: {type: 'integer'}}},
  };
  await fs.writeFile(file, JSON.stringify(stored));
  const env = {DB_FOLDER: file};
  const host = await createApplication({env});
  const { Team } = host.models;
  assert.equal((await Team.findOne('5')).integrationId, 'existing');
  const added = await Team.create({name: 'New team'});
  assert.equal(added.id, 9);
  const [left, right] = await Promise.all([
    Team.update({id: added.id, updatedAt: added.updatedAt}, {name: 'One'}),
    Team.update({id: added.id, updatedAt: added.updatedAt}, {name: 'Two'}),
  ]);
  assert.equal(left.length + right.length, 1);
  await host.close();
  const reopened = await createApplication({env});
  assert.equal((await reopened.models.Team.find()).length, 2);
  await reopened.close();
  const persisted = JSON.parse(await fs.readFile(file, 'utf8'));
  assert.deepEqual(persisted.data.external, stored.data.external);
  assert.deepEqual(persisted.schema.external, stored.schema.external);
  assert.equal(persisted.counters.team.id, 9);
  // A failed open must leave the original bytes available for recovery.
  await fs.writeFile(file, '{"unexpected":true}');
  await assert.rejects(openDisk(file), /Unsupported/);
  assert.equal(await fs.readFile(file, 'utf8'), '{"unexpected":true}');
});

test('separate disk connections serialize writes to the same event', async t => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'tournamenter-share-'));
  t.after(() => fs.rm(folder, {recursive: true, force: true}));
  const file = path.join(folder, 'event.db');
  const [one, two] = await Promise.all([openDisk(file), openDisk(file)]);
  await Promise.all([one.create('team', {name:'A'}), two.create('team', {name:'B'})]);
  assert.deepEqual((await one.find('team', {})).map(team => team.id), [1, 2]);
});

test('HTTP event lifecycle, session, ranking, public projection, stale score, CSV and page configuration', async t => {
  const host = await listen({env: {DB_ADAPTER: 'memory', PORT: '0', HOST:'127.0.0.1', PASSWORD:'sample-test-password'}});
  t.after(() => host.close());
  const base = 'http://127.0.0.1:' + host.listener.address().port;
  let cookie;
  function request(route, method = 'GET', data, publicRequest = false) {
    const headers = {Accept:'application/json'};
    if (cookie && !publicRequest) headers.cookie = cookie;
    if (data) headers['Content-Type'] = 'application/json';
    return fetch(base + route, { method, headers, redirect:'manual', body: data && JSON.stringify(data) });
  }
  async function json(...args) {
    const response = await request(...args);
    assert.equal(response.status, 200, args[0] + ' returned ' + response.status);
    return response.json();
  }
  assert.equal((await request('/teams')).status, 401);
  assert.equal((await request('/api/admin/views')).status, 401);
  assert.equal((await request('/teams/manage')).status, 401);
  assert.equal((await json('/health')).status, 'ok');
  const login = await request('/login','POST',{password:'sample-test-password'});
  assert.equal(login.status, 302);
  cookie = login.headers.get('set-cookie').split(';')[0];
  const team = await json('/teams','POST',{name:'Brazil', token:'internal', country:'br'});
  const table = await json('/tables','POST',{name:'Rescue', columns:2, viewColumns:1});
  const score = await json('/scores','POST',{teamId:team.id,tableId:table.id,scores:{0:{value:4,data:{referee:'internal'}},1:{value:7}}});
  const [ranking] = await json('/tables/find');
  assert.equal(ranking.scores[0].final, 11);
  assert.equal(ranking.scores[0].team.name, 'Brazil');
  const csv = await request('/tables/' + table.id + '.csv');
  assert.match(await csv.text(), /Brazil,4,7,11/);
  const view = await json('/views','POST',{title:'Standings',pages:[
    {module:'pageview-table',options:{tables:table.id}},
    {module:'pageview-message',disabled:true,options:{message:'Hidden'}},
  ]});
  const publicView = await json('/views/find/' + view.id, 'GET', undefined, true);
  assert.equal(publicView.pages.length, 1);
  const row = publicView.pages[0].data[0].scores[0];
  assert.equal(row.final, 4);
  assert.deepEqual(row.scores, {0:{value:4}});
  assert.equal(row.team.token, undefined);
  assert.equal((await json('/api/admin/views/' + view.id)).pages.length, 2);
  await json('/scores/' + score.id,'PATCH',{updatedAt:score.updatedAt,scores:{0:{value:6}}});
  assert.equal((await request('/scores/' + score.id,'PATCH',{updatedAt:score.updatedAt,scores:{}})).status,409);
  await json('/tables/' + table.id,'PATCH',{evaluateMethod:'return scores[0] * 3;'});
  assert.equal((await json('/tables/' + table.id)).scores[0].final,18);
  const group = await json('/groups','POST',{name:'Pool A'});
  const match = await json('/matches','POST',{groupId:group.id,teamAId:team.id,state:'ended',teamAScore:2,teamBScore:1});
  assert.equal((await json('/matches/' + match.id)).teamA.name,'Brazil');
  assert.equal((await json('/groups/' + group.id)).table[0].score,3);
  await json('/groups/' + group.id,'DELETE');
  assert.equal((await request('/groups/' + group.id)).status,404);
  const logout = await request('/logout');
  assert.equal(logout.status,302);
  assert.equal((await request('/teams')).status,401);
});

test('MongoDB reads legacy ObjectIds and rejects concurrent stale writes',
  {skip: !process.env.TOURNAMENTER_TEST_MONGO_URL}, async t => {
    const { MongoClient, ObjectId } = require('mongodb');
    const uri = new URL(process.env.TOURNAMENTER_TEST_MONGO_URL);
    uri.pathname = '/tournamenter_test_' + require('node:crypto').randomUUID().replaceAll('-','');
    const client = await new MongoClient(uri.href).connect();
    t.after(async () => { await client.db().dropDatabase(); await client.close(); });
    const id = new ObjectId();
    await client.db().collection('team').insertOne({_id:id, name:'Existing', updatedAt:new Date()});
    const host = await createApplication({env:{DB_ADAPTER:'sails-mongo', DB_URL:uri.href}});
    t.after(() => host.close());
    const team = await host.models.Team.findOne(id.toHexString());
    assert.equal(team.name, 'Existing');
    const criteria = {id:team.id, updatedAt:team.updatedAt.toISOString()};
    const updated = await Promise.all(['one','two'].map(name => host.models.Team.update(criteria, {name})));
    assert.equal(updated.flat().length,1);
    const config = await host.models.Config.findOrCreate({id:'obr-sync'}, {id:'obr-sync', sync:false});
    assert.equal(config.sync,false);
    assert.equal((await host.models.Config.findOrCreate({id:'obr-sync'}, {id:'obr-sync', sync:true})).sync,false);
  });
