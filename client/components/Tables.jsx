import { Fragment, useRef, useState } from 'react';
import { Alert, Action, Button, Delete, Dropdown, Editable, Flag, Modal, Toggle } from './Controls';
import { Create, useCollection } from './Administration';
import { asList, choices, recordPath, request, useData } from '../lib/data';

function ImportTeams({ table, teams, close, refresh }) {
  const [prefix, setPrefix] = useState('');
  const [contains, setContains] = useState('');
  const [skip, setSkip] = useState(true);
  const imported = useRef(new Set());
  async function save() {
    // Keep successful writes on retry, even when duplicates were explicitly requested.
    const latest = await request(recordPath('tables/find', table.id));
    const present = new Set((latest.scores || []).map((row) => String(row.teamId)));
    try {
      for (const team of teams) {
        const id = String(team.value);
        if (!team.text.startsWith(prefix) || !team.text.includes(contains)) continue;
        if (imported.current.has(id) || (skip && present.has(id))) continue;
        await request('/scores', 'POST', { tableId: table.id, teamId: team.value });
        imported.current.add(id);
      }
    } finally {
      await refresh();
    }
  }
  return (
    <Modal title="Import From Teams" action="Import" save={save} close={close}>
      <div className="form-group">
        <label>
          Only team names that start with
          <input className="form-control" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
        </label>
      </div>
      <div className="form-group">
        <label>
          Only team names that include
          <input className="form-control" value={contains} onChange={(e) => setContains(e.target.value)} />
        </label>
      </div>
      <label>
        <input type="checkbox" checked={skip} onChange={(e) => setSkip(e.target.checked)} /> Don't import
        teams already on table.
      </label>
    </Modal>
  );
}
function EditScore({ cell, store, close }) {
  const { row, index, title } = cell;
  const [value, setValue] = useState(String(row.scores?.[index]?.value ?? ''));
  async function save() {
    const scores = { ...row.scores };
    if (value === '') delete scores[index];
    else scores[index] = { ...scores[index], value: Number(value), data: scores[index]?.data ?? {} };
    await store.mutate(recordPath('scores', row.id), 'PATCH', { scores, updatedAt: row.updatedAt });
  }
  return (
    <Modal title={title} close={close} save={save}>
      <label>
        Score
        <input
          type="number"
          step="any"
          autoFocus
          className="form-control input-lg"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
    </Modal>
  );
}

function TableOptions({ table, patch }) {
  const [help, setHelp] = useState(false);
  const fields = [
    [
      'sort',
      'Final Score sort',
      {
        options: [
          { value: 'desc', text: 'Descending' },
          { value: 'asc', text: 'Ascending' },
        ],
      },
    ],
    ['evaluateMethod', 'Final Score function', { list: 'score-functions' }],
    ['columns', 'Score Columns', { type: 'number', min: 1, max: 20, required: true }],
    ['viewColumns', 'Score Columns (View)', { type: 'number', min: 1, max: 20, empty: 'Automatic' }],
    ['headerScore', 'Score Column names', {}],
  ];
  return (
    <div className="panel-body">
      <div className="col-md-6">
        <p className="lead">Options</p>
        <dl className="dl-horizontal tr-columns">
          {fields.map(([key, label, props]) => (
            <Fragment key={key}>
              <dt>{label}:</dt>
              <dd>
                <Editable value={table[key]} label={label} onSave={(v) => patch({ [key]: v })} {...props} />
              </dd>
            </Fragment>
          ))}
          <dt>Other column names:</dt>
          <dd>
            <em>Click on the column header in the table below.</em>
          </dd>
        </dl>
      </div>
      <div className="col-md-6">
        <p className="lead">Help</p>
        <Toggle open={help} label="Help" onClick={() => setHelp(!help)} />
        {help && (
          <dl>
            <dt>Final Score sort</dt>
            <dd>Descending ranks high scores first. Ascending ranks low scores first.</dd>
            <dt>Final Score function</dt>
            <dd>
              Choose a registered method or combine methods using periods. For example,{' '}
              <code>remove:worst.avg.round:2</code>.
            </dd>
            <dt>Score Columns (View)</dt>
            <dd>Sets how many columns are used to calculate and display rankings on public views.</dd>
            <dt>Score Column names</dt>
            <dd>Use a single prefix, or enter individual column names separated by commas.</dd>
          </dl>
        )}
      </div>
    </div>
  );
}

function TablePanel({ table, store, teams, initiallyOpen }) {
  const [options, setOptions] = useState(false);
  const [show, setShow] = useState(initiallyOpen);
  const [importing, setImporting] = useState(false);
  const [cell, setCell] = useState(null);
  const columns = table.headers?.scores || [];
  const patch = (fields) => store.patch(table.id, fields);
  const header = (key, label) => (
    <Editable label={label} value={table[key]} onSave={(v) => patch({ [key]: v })} />
  );
  return (
    <section className="panel panel-info">
      <div className="panel-heading">
        <div className="pull-right">
          <Button icon="refresh" onClick={store.refresh}>
            Refresh
          </Button>{' '}
          <Dropdown title="Table Actions">
            <Delete label="Delete Table" subject={table.name} remove={() => store.remove(table.id)} />
            <a href={recordPath('tables', table.id) + '.csv'}>Export to CSV</a>
            <a href={recordPath('tables/manage', table.id)}>On new page</a>
          </Dropdown>
        </div>
        <span className="panel-title">
          <strong>{header('name', 'Table name')}</strong>
        </span>
      </div>
      {options && <TableOptions table={table} patch={patch} />}
      <Toggle open={options} label="Options" color="primary" onClick={() => setOptions(!options)} />
      {show && (
        <div className="table-responsive">
          <table className="table table-striped table-condensed" style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th>{header('headerRank', 'Rank header')}</th>
                <th>{header('headerTeam', 'Team header')}</th>
                {columns.map((title, i) => (
                  <th key={i}>{title}</th>
                ))}
                <th>{header('headerFinal', 'Final score header')}</th>
                <th className="text-right">
                  <Action
                    color="success"
                    icon="plus"
                    run={() => store.mutate('/scores', 'POST', { tableId: table.id })}
                  >
                    Add Team
                  </Action>{' '}
                  <Dropdown color="success" title="Import/Export">
                    <Button color="default" onClick={() => setImporting(true)}>
                      Import teams
                    </Button>
                  </Dropdown>
                </th>
              </tr>
            </thead>
            <tbody>
              {(table.scores || []).map((row) => (
                <tr key={row.id}>
                  <td>{row.rank}</td>
                  <td>
                    <Flag country={row.team?.country} />{' '}
                    <Editable
                      label="Team"
                      value={row.teamId}
                      options={teams}
                      empty="Select Team"
                      onSave={(v) =>
                        store.mutate(recordPath('scores', row.id), 'PATCH', { teamId: v || null })
                      }
                    />
                  </td>
                  {columns.map((title, i) => (
                    <td key={i}>
                      <Button
                        aria-label={'Edit ' + title + ' for ' + (row.team?.name || 'team')}
                        icon="pencil"
                        color={row.scores?.[i] ? 'info' : 'default'}
                        onClick={() =>
                          setCell({
                            row,
                            index: i,
                            title: [table.name, row.team?.name, title].filter(Boolean).join(' · '),
                          })
                        }
                      >
                        {row.scores?.[i]?.value}
                      </Button>
                    </td>
                  ))}
                  <td>{row.final}</td>
                  <td className="text-right">
                    <Delete
                      label="Remove"
                      subject="this score row"
                      remove={() => store.mutate(recordPath('scores', row.id), 'DELETE')}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Toggle open={show} onClick={() => setShow(!show)} />
      {importing && (
        <ImportTeams table={table} teams={teams} close={() => setImporting(false)} refresh={store.refresh} />
      )}
      {cell && <EditScore cell={cell} store={store} close={() => setCell(null)} />}
    </section>
  );
}

export default function Tables({ id, methods = [] }) {
  const store = useCollection('tables', id ? recordPath('tables/find', id) : '/tables/find');
  const teams = useData('/teams/teamlist');
  return (
    <>
      <Alert>{store.error || teams.error}</Alert>
      <Create name="Table" run={() => store.create()} />
      <datalist id="score-functions">
        {(Array.isArray(methods) ? methods : Object.keys(methods)).map((k) => (
          <option key={k} value={k} />
        ))}
      </datalist>
      {asList(store.data).map((table) => (
        <TablePanel
          key={table.id}
          table={table}
          store={store}
          teams={choices(teams.data || [])}
          initiallyOpen={Boolean(id)}
        />
      ))}
    </>
  );
}
