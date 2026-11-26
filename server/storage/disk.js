const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const lockfile = require('proper-lockfile');

const empty = () => ({ data: {}, counters: {}, schema: {} });
const timestamp = previous => new Date(Math.max(Date.now(), (Date.parse(previous) || 0) + 1)).toISOString();

function matches(row, criteria) {
  return Object.entries(criteria).every(([key, expected]) => {
    const values = Array.isArray(expected) ? expected : [expected];
    return values.some(value => row[key] === value ||
      (row[key] != null && value != null && String(row[key]) === String(value)));
  });
}

// Read and write the sails-disk envelope in place so existing IDs, counters,
// plugin attributes and collections survive a round trip through the desktop app.
async function openDisk(file) {
  if (file) await fs.mkdir(path.dirname(file), { recursive: true });
  let memory = empty();
  let queue = Promise.resolve();

  async function read() {
    if (!file) return structuredClone(memory);
    let source;
    try { source = await fs.readFile(file, 'utf8'); }
    catch (error) { if (error.code === 'ENOENT') return empty(); throw error; }
    if (!source.length) return empty(); // sails-disk creates empty files on first startup.
    const state = JSON.parse(source);
    if (!state?.data || typeof state.data !== 'object' || Array.isArray(state.data) ||
        !Object.values(state.data).every(Array.isArray) || !state.counters || !state.schema) {
      throw new Error('Unsupported Tournamenter database format');
    }
    return state;
  }

  async function transact(operation) {
    const release = file && await lockfile.lock(file, { realpath: false, retries: { retries: 30, minTimeout: 10, maxTimeout: 250 } });
    try {
      const state = await read();
      const result = operation(state);
      if (!file) memory = state;
      else {
        const temp = file + '.' + randomUUID() + '.tmp';
        try {
          await fs.writeFile(temp, JSON.stringify(state), { mode: 0o600, flag: 'wx', flush: true });
          await fs.rename(temp, file);
        } finally { await fs.rm(temp, { force: true }); }
      }
      return result;
    } finally { if (release) await release(); }
  }

  function change(operation) {
    const result = queue.then(() => transact(operation));
    queue = result.catch(() => {});
    return result;
  }

  await read(); // Fail startup on an unreadable or unrecognized existing event.
  return {
    async find(name, criteria) { return ((await read()).data[name] || []).filter(row => matches(row, criteria)); },
    create(name, values, existingCriteria) {
      return change(state => {
        const rows = state.data[name] ||= [];
        if (existingCriteria) {
          const existing = rows.find(row => matches(row, existingCriteria));
          if (existing) return existing;
        }
        const counter = state.counters[name] ||= {};
        const last = rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), Number(counter.id) || 0);
        const id = values.id ?? last + 1;
        if (rows.some(row => String(row.id) === String(id))) throw Object.assign(new Error('Duplicate ID'), {status: 409});
        counter.id = Math.max(last, Number(id) || 0);
        const now = timestamp();
        const row = { ...values, id, createdAt: now, updatedAt: now };
        rows.push(row);
        return row;
      });
    },
    update(name, criteria, values) {
      return change(state => (state.data[name] || []).filter(row => matches(row, criteria)).map(row =>
        Object.assign(row, values, { updatedAt: timestamp(row.updatedAt) })));
    },
    destroy(name, criteria) {
      return change(state => {
        const rows = state.data[name] || [];
        const removed = rows.filter(row => matches(row, criteria));
        state.data[name] = rows.filter(row => !removed.includes(row));
        return removed;
      });
    },
    close: () => queue,
  };
}

module.exports = { openDisk, timestamp };
