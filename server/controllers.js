const _ = require('lodash');
const { invalid } = require('./models');
const makeStandings = require('./standings');

const resources = { teams: 'Team', matches: 'Match', groups: 'Group', tables: 'Table', scores: 'Scores', views: 'View', configs: 'Config' };
const missing = () => Object.assign(new Error('Record not found'), { status: 404 });
const conflict = () => Object.assign(new Error('This record changed. Reload and try again.'), { status: 409 });
const values = req => ({ ...req.query, ...req.body });

function controllers(host) {
  const standings = makeStandings(host);
  const result = {};
  for (const name of Object.values(resources)) {
    const model = host.models[name];
    result[name] = {
      async find(req, res) {
        const id = req.params.id ?? req.query.id;
        if (id != null) {
          const row = await model.findOne(id);
          if (!row) throw missing();
          return res.json(row);
        }
        const { limit, skip, sort, populate, where, ...fields } = req.query;
        let criteria = where || fields;
        if (typeof criteria === 'string') {
          try { criteria = JSON.parse(criteria); } catch { throw invalid('Invalid where criteria'); }
        }
        let rows = await model.find(criteria);
        if (sort) {
          const [field, direction] = String(sort).split(/\s+/);
          rows = _.orderBy(rows, [field], [direction?.toLowerCase() === 'desc' ? 'desc' : 'asc']);
        }
        const offset = Math.max(0, Number(skip) || 0);
        res.json(rows.slice(offset, limit == null ? undefined : offset + Math.max(0, Number(limit) || 0)));
      },
      async create(req, res) { res.json(await model.create(values(req))); },
      async update(req, res) {
        const data = values(req);
        const criteria = { id: req.params.id || data.id };
        if (!criteria.id) throw invalid('Missing id');
        if (data.updatedAt != null) criteria.updatedAt = data.updatedAt;
        const [row] = await model.update(criteria, data);
        if (!row) throw data.updatedAt != null && await model.findOne(criteria.id) ? conflict() : missing();
        res.json(row);
      },
      async destroy(req, res) {
        const [row] = await model.destroy(req.params.id);
        if (!row) throw missing();
        res.json(row);
      },
      async post(req, res) {
        const { pk, name, value } = req.body || {};
        if (!pk || !name) throw invalid('Missing pk or name');
        const [row] = await model.update(pk, { [name]: value });
        if (!row) throw missing();
        res.json(row);
      },
    };
  }

  const associated = read => async (req, res) => {
    const id = req.params.id;
    const rows = await read(id);
    if (id && !rows[0]) throw missing();
    res.json(id ? rows[0] : rows);
  };
  result.Table.associated = associated(standings.tables);
  result.Group.associated = associated(standings.groups);
  result.View.associated = associated(id => standings.views(id, true));
  result.Match.associated = async (req, res) => {
    const match = await standings.match(req.params.id);
    if (!match) throw missing();
    res.json(match);
  };
  result.Table._findAssociated = (id, done, options) => standings.tables(id, options).then(done);
  result.Group._findAssociated = (id, done) => standings.groups(id).then(done);
  result.Match._findAssociated = (id, done) => standings.match(id).then(match => done(null, match), done);
  result.View._associated = (id, done) => standings.views(id).then(views => done(null, views), done);
  result.Table.csv = async (req, res) => {
    const [table] = await standings.tables(req.params.id);
    if (!table) throw missing();
    const matrix = host.helpers.ConvertTableToMatrix(table);
    const metadata = { Table: table.name, Server: host.config.appName, 'Generated in': new Date().toISOString() };
    const csv = await new Promise((resolve, reject) => host.helpers.ConvertMatrixToCSV(matrix, metadata, (error, output) => error ? reject(error) : resolve(output)));
    res.attachment(table.name + '.csv').type('text/csv').send('\uFEFF' + csv);
  };
  result.Team.teamlist = async (req, res) => {
    const search = String(req.query.query || '').toLowerCase();
    const teams = await host.models.Team.find();
    res.json(teams.filter(team => team.name?.toLowerCase().includes(search)).map(team => ({ id: team.id, text: team.name })));
  };
  result.Scores.updateScore = async (req, res) => {
    const { id, number } = req.params;
    const value = req.param('value');
    const data = req.param('data');
    if (!/^\d+$/.test(number) || value == null || !Number.isFinite(Number(value)) || data == null) throw invalid('Invalid score');
    const row = await host.models.Scores.findOne(id);
    if (!row) throw missing();
    const scores = { ...row.scores, [number]: { value: Number(value), data } };
    const [saved] = await host.models.Scores.update({ id, updatedAt: row.updatedAt }, { scores });
    if (!saved) throw conflict();
    res.json(saved);
  };
  return result;
}

module.exports = { resources, controllers };
