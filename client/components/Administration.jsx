import { useState } from 'react';
import { Alert, Action, Button, Delete, Editable, Flag, Icon, Modal, Toggle } from './Controls';
import { choices, recordPath, request, useData } from '../lib/data';
import countries from '../lib/countries';

function MenuLink({ menu }) {
  return (
    <a href={menu.path || '#'}>
      {menu.icon && (
        <>
          <Icon name={menu.icon} />{' '}
        </>
      )}
      {menu.name} {menu.badge && <span className="badge">{menu.badge}</span>}
    </a>
  );
}
function MenuItems({ items }) {
  return items.map((item) =>
    item.childs?.length ? (
      <li key={item.name || item.path} role="presentation">
        <div className="dropdown-header">{item.name}</div>
        <ul className="list-unstyled">
          <MenuItems items={item.childs} />
        </ul>
      </li>
    ) : (
      <li key={item.path || item.name}>
        <MenuLink menu={item} />
      </li>
    ),
  );
}
export function Layout({ ui, path, children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div id="wrap">
        <nav className="navbar navbar-default navbar-fixed-top" style={{ opacity: 0.9 }}>
          <div className="container">
            <div className="navbar-header">
              <button
                className="navbar-toggle"
                aria-label="Toggle navigation"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
              >
                <span className="icon-bar" />
                <span className="icon-bar" />
                <span className="icon-bar" />
              </button>
              <img className="navbar-brand" src="/branding.png" alt="" />
              <a className="navbar-brand" href="/">
                {ui.appName}
              </a>
            </div>
            <div className={'navbar-collapse collapse' + (open ? ' in' : '')}>
              <ul className="nav navbar-nav">
                {(ui.menus || []).map((menu) => (
                  <li key={menu.name} className={menu.path && path.startsWith(menu.path) ? 'active' : ''}>
                    {menu.childs?.length ? (
                      <details className="tr-dropdown nav-dropdown">
                        <summary>
                          {menu.name} <b className="caret" />
                        </summary>
                        <ul className="dropdown-menu">
                          <MenuItems items={menu.childs} />
                        </ul>
                      </details>
                    ) : (
                      <MenuLink menu={menu} />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
        <main className="container">
          <div className="row">
            <div className="col-xs-12">{children}</div>
          </div>
        </main>
      </div>
      <div id="footer">
        <div className="container">
          <p className="text-muted credit">
            © 2014 | <a href="https://github.com/ivanseidel">Ivan Seidel</a>
            <small className="pull-right">v{ui.version}</small>
          </p>
        </div>
      </div>
    </>
  );
}
export function Login({ name }) {
  return (
    <>
      <div className="col-md-8 col-md-offset-2" style={{ paddingTop: 20 }}>
        <div className="alert alert-warning">
          <strong>You need to login first!</strong>
          <br />
          Please enter the Password for the League and click Login.
        </div>
        {new URLSearchParams(location.search).has('error') && <Alert>Wrong Password</Alert>}
      </div>
      <div className="col-md-8 col-md-offset-2">
        <div className="well">
          <form action="/login" method="post">
            <h2>Please sign in to "{name}"</h2>
            <input
              className="form-control input-lg"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Password"
              aria-label="Password"
              required
              autoFocus
            />
            <br />
            <button className="btn btn-lg btn-primary btn-block">Sign in</button>
          </form>
          <hr />
          <p className="lead">Or, select one of the following public actions:</p>
          <a href="/views/view" className="btn btn-sm btn-info">
            Open view list
          </a>
        </div>
      </div>
    </>
  );
}
export function useCollection(collection, readPath = '/' + collection) {
  const resource = useData(readPath);
  async function mutate(path, method, values) {
    await request(path, method, values);
    await resource.refresh();
  }
  return {
    ...resource,
    mutate,
    create: (values = {}) => mutate('/' + collection, 'POST', values),
    patch: (id, values) => mutate(recordPath(collection, id), 'PATCH', values),
    remove: (id) => mutate(recordPath(collection, id), 'DELETE'),
  };
}
export function Create({ name, run }) {
  return (
    <div className="clearfix">
      <p className="pull-right">
        <Action color="success" icon="plus" size="" run={run}>
          Create New {name}
        </Action>
      </p>
    </div>
  );
}
export function GroupStandings({ rows = [], publicView = false }) {
  return (
    <table
      className={
        publicView
          ? 'table-pretty table-orange table-bordered'
          : 'table table-striped table-bordered table-condensed'
      }
    >
      <thead>
        <tr>
          {['Rank', 'Team', 'P', 'S', 'W', 'D', 'L', 'Score'].map((k) => (
            <th key={k}>{k}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.teamId}>
            <td>{r.rank}</td>
            <td>
              <Flag country={r.team?.country} /> {r.team?.name || '-Team not found'}
            </td>
            {['P', 'S', 'W', 'D', 'L', 'score'].map((k) => (
              <td key={k}>{r[k]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const countryOptions = countries.map((c) => ({ value: c.id, text: c.text }));
function TeamRow({ team, store }) {
  const [json, setJson] = useState(null);
  const country = countries.find((c) => c.id === team.country);
  return (
    <tr>
      <td>
        <Editable label="Team name" value={team.name} onSave={(name) => store.patch(team.id, { name })} />
      </td>
      <td>
        <Editable
          label="Location"
          value={team.country}
          options={countryOptions}
          display={
            country ? (
              <>
                <Flag country={country.id} /> {country.text}
              </>
            ) : undefined
          }
          onSave={(country) => store.patch(team.id, { country: country || null })}
        />
      </td>
      <td className="text-right">
        <Button icon="pencil" onClick={() => setJson(JSON.stringify(team, null, 2))}>
          Edit JSON
        </Button>{' '}
        <Delete subject={team.name} remove={() => store.remove(team.id)} />
        {json !== null && (
          <Modal
            title={'Edit ' + team.name}
            close={() => setJson(null)}
            save={() => {
              const values = JSON.parse(json);
              if (!values || Array.isArray(values) || typeof values !== 'object')
                throw new Error('Enter a JSON object.');
              const { id, createdAt, updatedAt, ...fields } = values;
              return store.patch(team.id, fields);
            }}
          >
            <textarea
              rows="10"
              className="form-control"
              aria-label="Team JSON"
              value={json}
              onChange={(e) => setJson(e.target.value)}
            />
          </Modal>
        )}
      </td>
    </tr>
  );
}
export function Teams() {
  const store = useCollection('teams');
  return (
    <>
      <Alert>{store.error}</Alert>
      <section className="panel panel-info">
        <div className="panel-heading">
          <div className="pull-right">
            <Button icon="refresh" onClick={store.refresh}>
              Refresh
            </Button>{' '}
            <Action icon="plus" color="success" run={() => store.create()}>
              Create Team
            </Action>
          </div>
          <span className="panel-title">
            <strong>Teams</strong> <small>{store.data?.length ?? ''}</small>
          </span>
        </div>
        <table className="table table-striped table-responsive table-hover">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {store.data?.map((team) => (
              <TeamRow key={team.id} team={team} store={store} />
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function MatchRow({ match, teams, store }) {
  const path = recordPath('matches', match.id);
  const edit = (field, label, props = {}) => (
    <Editable
      label={label}
      value={match[field]}
      onSave={(v) => store.mutate(path, 'PATCH', { [field]: v })}
      {...props}
    />
  );
  return (
    <div className="list-group-item tr-match">
      {edit('state', 'Match state', { options: ['scheduled', 'playing', 'ended'] })}
      <span className="match-team text-right">{edit('teamAId', 'Team A', { options: teams })}</span>
      {edit('teamAScore', 'Team A score', { type: 'number' })} ×{' '}
      {edit('teamBScore', 'Team B score', { type: 'number' })}
      <span className="match-team">{edit('teamBId', 'Team B', { options: teams })}</span>
      <span className="label label-primary">{edit('day', 'Day', { type: 'number' })}</span>
      <span className="label label-info">{edit('hour', 'Hour')}</span>
      <span className="label label-warning">{edit('field', 'Field')}</span>
      <Delete label="" subject="this match" remove={() => store.mutate(path, 'DELETE')} />
    </div>
  );
}
function Group({ group, teams, store }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="panel panel-info">
      <div className="panel-heading">
        <div className="pull-right">
          <Button icon="refresh" onClick={store.refresh}>
            Refresh
          </Button>{' '}
          <Delete label="Delete Group" subject={group.name} remove={() => store.remove(group.id)} />
        </div>
        <h3 className="panel-title">
          <Editable
            label="Group name"
            value={group.name}
            onSave={(name) => store.patch(group.id, { name })}
          />
        </h3>
      </div>
      {open && (
        <div className="panel-body">
          <div className="row">
            <div className="col-md-5">
              <div className="panel panel-info">
                <div className="panel-heading">Group Table</div>
                <GroupStandings rows={group.table} />
              </div>
            </div>
            <div className="col-md-7">
              <div className="panel panel-info">
                <div className="panel-heading">
                  Matches <small>{group.matches?.length}</small>
                  <div className="pull-right">
                    <span className="label label-primary">DAY</span>{' '}
                    <span className="label label-info">HOUR</span>{' '}
                    <span className="label label-warning">FIELD</span>
                  </div>
                </div>
                <div className="list-group">
                  {group.matches?.map((m) => (
                    <MatchRow key={m.id} match={m} teams={teams} store={store} />
                  ))}
                </div>
                <Action
                  icon="plus"
                  color="success"
                  className="btn-block"
                  run={() => store.mutate('/matches', 'POST', { groupId: group.id })}
                >
                  Create New Match
                </Action>
              </div>
            </div>
          </div>
        </div>
      )}
      <Toggle open={open} onClick={() => setOpen(!open)} />
    </section>
  );
}
export function Groups() {
  const store = useCollection('groups', '/groups/find');
  const teams = useData('/teams/teamlist');
  return (
    <>
      <Alert>{store.error || teams.error}</Alert>
      <Create name="Group" run={() => store.create()} />
      {store.data?.map((group) => (
        <Group key={group.id} group={group} store={store} teams={choices(teams.data || [])} />
      ))}
    </>
  );
}
export function LiveMatch({ id }) {
  const matchPath = recordPath('matches', id);
  const { data, error, refresh } = useData(matchPath);
  async function change(side, amount) {
    const key = 'team' + side + 'Score';
    await request(matchPath, 'PATCH', {
      [key]: Math.max(0, Number(data[key] || 0) + amount),
      updatedAt: data.updatedAt,
    });
    await refresh();
  }
  return (
    <>
      <Alert>{error}</Alert>
      {data && (
        <>
          <h2>Soccer Match: {data.group?.name}</h2>
          {['A', 'B'].map((side, i) => (
            <div key={side} className={'col-md-6 ' + (i === 0 ? 'text-right' : '')}>
              <h3>{data['team' + side]?.name || 'Team ' + side}</h3>
              <Action color="success" size="lg" style={{ fontSize: '400%' }} run={() => change(side, 1)}>
                {data['team' + side + 'Score'] ?? 0}
              </Action>
              <div className="btn-toolbar">
                <Action color="default" size="" run={() => change(side, -1)}>
                  −
                </Action>{' '}
                <Action color="default" size="" run={() => change(side, 1)}>
                  +
                </Action>
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
