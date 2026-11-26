const _ = require('lodash');

const byId = rows => new Map(rows.map(row => [String(row.id), row]));
const selected = id => id == null || id === '' ? {} : { id };
const teamForPublic = team => team && _.pick(team, ['id', 'name', 'country', 'category']);

module.exports = function standings(host) {
  const { Table, Scores, Team, Group, Match, View } = host.models;

  async function tables(ids, { isView = false, publicDisplay = false } = {}) {
    const tables = await Table.find(selected(ids));
    const rows = await Scores.find({ tableId: tables.map(table => table.id) });
    const teams = byId(await Team.find({ id: [...new Set(rows.map(row => row.teamId))] }));
    const byTable = _.groupBy(rows, 'tableId');
    for (const table of tables) {
      if (isView) table.columns = table.viewColumns || table.columns;
      table.scores = byTable[table.id] || [];
      table.calculate();
      table.headers();
      for (const row of table.scores) {
        const team = teams.get(String(row.teamId));
        row.team = publicDisplay ? teamForPublic(team) || {} : team || {};
        if (publicDisplay) {
          row.scores = Object.fromEntries(Object.entries(row.scores || {})
            .filter(([column]) => Number(column) < table.columns)
            .map(([column, cell]) => [column, { value: cell?.value }]));
        }
      }
    }
    return tables;
  }

  async function groups(ids, publicDisplay = false) {
    const groups = await Group.find(selected(ids));
    const matches = await Match.find({ groupId: groups.map(group => group.id) });
    const teams = byId(await Team.find());
    const team = id => publicDisplay ? teamForPublic(teams.get(String(id))) : teams.get(String(id));
    const grouped = _.groupBy(_.orderBy(matches, ['state', 'day', 'hour', 'id'], ['desc','asc','asc','asc']), 'groupId');
    for (const group of groups) {
      group.matches = grouped[group.id] || [];
      group.table = group.table();
      for (const row of group.table) row.team = team(row.teamId);
      for (const match of group.matches) {
        match.teamA = team(match.teamAId);
        match.teamB = team(match.teamBId);
      }
    }
    return groups;
  }

  async function match(id, publicDisplay = false) {
    if (!id) return null;
    const row = await Match.findOne(id);
    if (!row) return null;
    const [teamA, teamB, group] = await Promise.all([
      row.teamAId && Team.findOne(row.teamAId), row.teamBId && Team.findOne(row.teamBId), Group.findOne(row.groupId),
    ]);
    return { ...row, teamA: (publicDisplay ? teamForPublic(teamA) : teamA) || null,
      teamB: (publicDisplay ? teamForPublic(teamB) : teamB) || null, group };
  }

  async function page(input, publicDisplay) {
    const options = input.options || {};
    const page = { ...input, options };
    switch (page.module) {
      case 'pageview-table':
        page.data = await tables(Array.isArray(options.tables) && !options.tables.length ? null : options.tables, { isView: true, publicDisplay });
        break;
      case 'pageview-group': {
        const ids = options.tables || options.group || options.groups;
        page.data = await groups(Array.isArray(ids) && !ids.length ? null : ids, publicDisplay);
        break;
      }
      case 'pageview-live-match':
        page.data = typeof options.match === 'object' ? options.match : await match(options.match, publicDisplay);
        break;
      default: {
        const plugin = host.helpers.Modules.get('pageview', page.module);
        if (plugin?.process) return new Promise((resolve, reject) => plugin.process(page, (error, result) => error ? reject(error) : resolve(result)));
      }
    }
    return page;
  }

  async function views(ids, publicDisplay = false) {
    const views = await View.find(selected(ids));
    return Promise.all(views.map(async view => ({
      ...view, name: host.config.appName, pages: await Promise.all((view.pages || [])
        .filter(item => !publicDisplay || String(item.disabled) !== 'true')
        .map(item => page(item, publicDisplay))),
    })));
  }
  return { tables, groups, match, views };
};
