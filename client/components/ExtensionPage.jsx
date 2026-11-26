import React, { useEffect, useState } from 'react';
import { Alert } from './Controls';

class ExtensionBoundary extends React.Component {
  state = { error: '' };
  static getDerivedStateFromError(error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? <Alert>{this.state.error}</Alert> : this.props.children;
  }
}

// Only load entries declared by installed extensions. Persisted view data selects a
// module by name and cannot supply executable code or choose a URL to import.
export default function ExtensionPage({ descriptor, page, saveOptions }) {
  const [loaded, setLoaded] = useState(null);
  const entry = descriptor?.entry;
  useEffect(() => {
    if (!entry) return;
    let active = true;
    async function load() {
      try {
        const url = new URL(entry, location.origin);
        if (!entry.startsWith('/') || url.origin !== location.origin)
          throw new Error('Invalid extension URL.');
        const module = await import(/* webpackIgnore: true */ url.href);
        if (active) setLoaded({ entry, module });
      } catch (err) {
        if (active) setLoaded({ entry, error: err.message });
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [entry]);
  if (!entry) return <Alert>Page module unavailable ({page.module})</Alert>;
  if (loaded?.entry !== entry) return null;
  if (loaded.error) return <Alert>{loaded.error}</Alert>;
  const Component = saveOptions ? loaded.module.Configure : loaded.module.Display;
  if (!Component) return saveOptions ? null : <Alert>Page module has no Display component.</Alert>;
  return (
    <ExtensionBoundary key={entry}>
      <Component React={React} page={page} saveOptions={saveOptions} />
    </ExtensionBoundary>
  );
}
