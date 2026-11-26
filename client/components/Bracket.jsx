import { useEffect, useRef, useState } from 'react';
import $ from 'jquery';
import 'jquery-bracket/dist/jquery.bracket.min.js';
import { Alert } from './Controls';

const decorator = {
  render(node, team, score, state) {
    node.text(team == null ? (state === 'empty-bye' ? 'BYE' : 'TBD') : String(team));
  },
  edit(node, team, done) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = team ?? '';
    node.empty().append(input);
    input.focus();
    let finished = false;
    const finish = (cancel) => {
      if (!finished) {
        finished = true;
        done(cancel ? team : input.value);
      }
    };
    input.addEventListener('blur', () => finish(false));
    input.addEventListener('keydown', (e) => {
      if (['Enter', 'Tab', 'Escape'].includes(e.key)) {
        e.preventDefault();
        finish(e.key === 'Escape');
      }
    });
  },
};
export default function Bracket({ data, onChange }) {
  const host = useRef(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const el = $(host.current);
    try {
      const options = { decorator };
      if (data) options.init = structuredClone(data);
      if (onChange) options.save = onChange;
      el.bracket(options);
      setError('');
    } catch (e) {
      setError('Cannot display bracket: ' + e.message);
    }
    return () => {
      el.empty().removeData();
    };
  }, [data, onChange]);
  return (
    <>
      <Alert>{error}</Alert>
      <div className="bracket-container" ref={host} />
    </>
  );
}
