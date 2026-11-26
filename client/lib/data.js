import { useCallback, useEffect, useRef, useState } from 'react';

export const recordPath = (collection, id) => '/' + collection + '/' + encodeURIComponent(id);

export async function request(path, method = 'GET', body, signal) {
  const response = await fetch(path, {
    method,
    signal,
    credentials: 'same-origin',
    cache: 'no-store',
    headers:
      body === undefined
        ? { Accept: 'application/json' }
        : { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401 || (response.redirected && new URL(response.url).pathname === '/login')) {
    window.location.assign('/login');
    throw new Error('Please sign in.');
  }
  const raw = await response.text();
  let result;
  try {
    result = raw ? JSON.parse(raw) : null;
  } catch {
    result = raw;
  }
  if (!response.ok)
    throw Object.assign(
      new Error(result?.error || result?.message || 'Request failed (' + response.status + ')'),
      { status: response.status },
    );
  if (method === 'GET' && typeof result === 'string')
    throw new Error('The server did not return tournament data.');
  return result;
}

// Cancel obsolete reads. Public displays retain the last snapshot during LAN outages.
export function useData(path, poll = 0) {
  const [data, setData] = useState(null);
  const [failure, setFailure] = useState(null);
  const active = useRef(null);
  const refresh = useCallback(async () => {
    active.current?.abort();
    if (!path) return;
    const controller = new AbortController();
    active.current = controller;
    try {
      const result = await request(path, 'GET', undefined, controller.signal);
      if (!controller.signal.aborted) {
        setData(result);
        setFailure(null);
      }
    } catch (e) {
      if (!controller.signal.aborted) setFailure(e);
    }
  }, [path]);
  useEffect(() => {
    setData(null);
    let stopped = false;
    let timer;
    async function read() {
      await refresh();
      if (poll && !stopped) timer = setTimeout(read, poll);
    }
    read();
    return () => {
      stopped = true;
      clearTimeout(timer);
      active.current?.abort();
    };
  }, [refresh, poll]);
  return { data, error: failure?.message, status: failure?.status, refresh };
}

export const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);
export const choices = (entries) =>
  entries.map((entry) => ({ value: entry.id, text: entry.name || entry.text }));
