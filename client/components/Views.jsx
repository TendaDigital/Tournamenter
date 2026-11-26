import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import ExtensionPage from './ExtensionPage';
import { Alert, Action, Button, Delete, Dropdown, Editable, Modal, Toggle } from './Controls';
import { Create, useCollection } from './Administration';
import { asList, choices, recordPath, useData } from '../lib/data';

const Bracket = dynamic(() => import('./Bracket'), { ssr: false });
const types = {
  'pageview-table': 'Table View',
  'pageview-group': 'Group View',
  'pageview-message': 'Message View',
  'pageview-image': 'Image View',
  'pageview-bracket': 'Bracket View',
  'pageview-live-match': 'Match Live View',
};
function BracketEditor({ data, save }) {
  const [editing, setEditing] = useState(false);
  const draft = useRef(data);
  const change = useCallback((d) => {
    draft.current = d;
  }, []);
  return (
    <>
      <link rel="stylesheet" href="/css/jquery.bracket.min.css" />
      <Button
        icon="pencil"
        onClick={() => {
          draft.current = data;
          setEditing(true);
        }}
      >
        Edit bracket
      </Button>
      {data && <Bracket data={data} />}
      {editing && (
        <Modal title="Edit bracket" close={() => setEditing(false)} save={() => save(draft.current)}>
          <Bracket data={data} onChange={change} />
        </Modal>
      )}
    </>
  );
}
function ImageUpload({ save }) {
  const [error, setError] = useState('');
  async function choose(event) {
    const input = event.currentTarget;
    const file = input.files[0];
    if (!file) return;
    try {
      if (file.size > 81920) throw new Error('Image cannot be larger than 80KB.');
      const url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Cannot read image.'));
        reader.readAsDataURL(file);
      });
      await save(url);
      setError('');
    } catch (e) {
      setError(e.message);
    }
    input.value = '';
  }
  return (
    <>
      <label>
        Image file <input type="file" accept="image/*" onChange={choose} />
      </label>
      <Alert>{error}</Alert>
    </>
  );
}
function PageOptions({ page, update, tables, groups, extensions }) {
  const opts = page.options || {};
  const save = (k, v) => update({ options: { ...opts, [k]: v } });
  const field = (name, label, props = {}) => (
    <div className="list-group-item" key={name}>
      <strong>{label}: </strong>
      <Editable label={label} value={opts[name]} onSave={(v) => save(name, v)} {...props} />
    </div>
  );
  switch (page.module) {
    case 'pageview-table':
    case 'pageview-group': {
      const isGroup = page.module === 'pageview-group';
      return (
        <div className="list-group">
          {field('tables', isGroup ? 'Group to show' : 'Table to show', {
            options: choices(isGroup ? groups : tables),
          })}
          {field('rows', 'Rows on table', { type: 'number', min: 1, empty: 'Automatic' })}
          {field('still', 'Duration of paginated table', {
            type: 'number',
            min: 0,
            step: 'any',
            empty: 'Automatic',
          })}
        </div>
      );
    }
    case 'pageview-live-match': {
      const matches = groups.flatMap((g) =>
        (g.matches || []).map((m) => ({
          value: m.id,
          text: g.name + ' · ' + (m.teamA?.name || '—') + ' × ' + (m.teamB?.name || '—'),
        })),
      );
      return (
        <>
          {field('match', 'Soccer Match', { options: matches })}
          {opts.match && typeof opts.match !== 'object' && (
            <a className="btn btn-xs btn-info" href={recordPath('matches/live', opts.match)}>
              Open live match controller
            </a>
          )}
        </>
      );
    }
    case 'pageview-bracket':
      return (
        <div className="panel-body">
          {field('title', 'Bracket Title')}
          <BracketEditor data={opts.data} save={(v) => save('data', v)} />
        </div>
      );
    case 'pageview-image':
      return (
        <div className="panel-body">
          <ImageUpload save={(v) => save('file', v)} />
          {opts.file && (
            <img
              className="pull-right img-thumbnail"
              height="100"
              style={{ maxHeight: 100 }}
              src={opts.file}
              alt="Page image"
            />
          )}
          {field('size', 'Image size', { options: ['small', 'medium', 'big'], empty: 'Automatic' })}
        </div>
      );
    case 'pageview-message':
      return (
        <div className="panel-body">
          <div className="col-md-6">
            {field('type', 'Message type', { options: ['primary', 'info', 'success', 'warning', 'danger'] })}
            {field('size', 'Message size', { type: 'number', min: 0.1, step: 'any' })}
            {field('align', 'Align', { options: ['left', 'center', 'right'] })}
          </div>
          <div className="col-md-6">
            {field('message', 'Message', { type: 'textarea', empty: 'Enter Markdown' })}
          </div>
        </div>
      );
    default:
      return (
        <div className="panel-body">
          <ExtensionPage
            page={page}
            descriptor={extensions.find((e) => e.module === page.module)}
            saveOptions={(options) => update({ options })}
          />
        </div>
      );
  }
}
function ViewPanel({ view, store, tables, groups, initiallyOpen, extensions }) {
  const [open, setOpen] = useState(initiallyOpen);
  const pages = view.pages || [];
  const names = { ...Object.fromEntries(extensions.map((e) => [e.module, e.name])), ...types };
  // Associated reads include rendered data. Only submit stored configuration.
  function savePages(nextPages) {
    return store.patch(view.id, {
      updatedAt: view.updatedAt,
      pages: nextPages.map(({ id, module, still, disabled, options }) => ({
        id,
        module,
        still,
        disabled,
        options,
      })),
    });
  }
  async function add(module) {
    await savePages([...pages, { module, still: '', disabled: 'false', options: {} }]);
    setOpen(true);
  }
  return (
    <section className="panel panel-info">
      <div className="panel-heading">
        <div className="pull-right">
          <Button icon="refresh" onClick={store.refresh}>
            Refresh
          </Button>{' '}
          <Delete label="Delete View" subject={view.title} remove={() => store.remove(view.id)} />{' '}
          <Dropdown title="New Page" color="success">
            {Object.entries(names).map(([key, title]) => (
              <Action key={key} color="default" run={() => add(key)}>
                {title}
              </Action>
            ))}
          </Dropdown>
        </div>
        <span className="panel-title">
          <strong>
            <Editable
              label="View title"
              value={view.title}
              onSave={(title) => store.patch(view.id, { title })}
            />
          </strong>
        </span>{' '}
        <small>
          <a href={recordPath('views/view', view.id)}>{recordPath('views/view', view.id)}</a>
        </small>
      </div>
      <Toggle label="Pages" open={open} color="warning" onClick={() => setOpen(!open)} />
      {open && (
        <div className="panel-body">
          {pages.map((p, i) => {
            const update = (patch) =>
              savePages(pages.map((item, j) => (i === j ? { ...item, ...patch } : item)));
            const hidden = String(p.disabled) === 'true';
            return (
              <section className="panel panel-info" key={p.id ?? i}>
                <div className="panel-heading">
                  <div className="pull-right">
                    <Delete
                      label="Remove"
                      subject={names[p.module] || p.module}
                      remove={() => savePages(pages.filter((_, j) => i !== j))}
                    />
                  </div>
                  <span className="label label-warning">{names[p.module] || p.module}</span> Duration:{' '}
                  <Editable
                    label="Duration in seconds"
                    value={p.still}
                    type="number"
                    min={0}
                    step="any"
                    empty="Automatic"
                    onSave={(still) => update({ still })}
                  />{' '}
                  <Action
                    color={hidden ? 'default' : 'success'}
                    run={() => update({ disabled: hidden ? 'false' : 'true' })}
                  >
                    {hidden ? 'Hidden' : 'Visible'}
                  </Action>
                </div>
                <PageOptions
                  page={p}
                  update={update}
                  tables={tables}
                  groups={groups}
                  extensions={extensions}
                />
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
export default function Views({ id, extensions = [] }) {
  const store = useCollection('views', id ? recordPath('api/admin/views', id) : '/api/admin/views');
  const tables = useData('/tables/find');
  const groups = useData('/groups/find');
  return (
    <>
      <Alert>{store.error || tables.error || groups.error}</Alert>
      <Create name="View" run={() => store.create()} />
      {asList(store.data).map((view) => (
        <ViewPanel
          key={view.id}
          view={view}
          store={store}
          tables={tables.data || []}
          extensions={extensions}
          groups={groups.data || []}
          initiallyOpen={Boolean(id)}
        />
      ))}
    </>
  );
}
