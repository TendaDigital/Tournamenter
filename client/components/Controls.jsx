import { useEffect, useId, useRef, useState } from 'react';

export function Icon({ name }) {
  return <span aria-hidden="true" className={'glyphicon glyphicon-' + name} />;
}
export function Button({ children, icon, color = 'info', size = 'xs', className = '', ...props }) {
  return (
    <button
      type="button"
      className={['btn', 'btn-' + color, size && 'btn-' + size, className].filter(Boolean).join(' ')}
      {...props}
    >
      {icon && (
        <>
          <Icon name={icon} />{' '}
        </>
      )}
      {children}
    </button>
  );
}
export function Flag({ country }) {
  return /^[a-z]{2}$/i.test(country || '') ? (
    <span aria-hidden="true" className={'flag-icon flag-icon-' + country.toLowerCase()} />
  ) : null;
}
export function Alert({ children }) {
  return children ? (
    <div role="alert" className="alert alert-danger">
      {children}
    </div>
  ) : null;
}

export function Modal({ title, children, close, save, action = 'Save', color = 'success' }) {
  const id = useId();
  const dialog = useRef(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await save();
      close();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="tr-dialog"
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) close();
      }}
    >
      <form className="modal-content" onSubmit={submit}>
        <div className="modal-header">
          <button type="button" className="close" aria-label="Close" onClick={close} disabled={busy}>
            ×
          </button>
          <h4 id={id} className="modal-title">
            {title}
          </h4>
        </div>
        <div className="modal-body">
          <Alert>{error}</Alert>
          {children}
        </div>
        <div className="modal-footer">
          <Button color="default" size="" onClick={close} disabled={busy}>
            Close
          </Button>{' '}
          <button className={'btn btn-' + color} disabled={busy}>
            {action}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function Editable({
  value,
  onSave,
  label,
  options,
  display,
  type = 'text',
  empty = 'Empty',
  ...props
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  if (!editing) {
    const selected = options?.find((o) => String(o.value ?? o) === String(value));
    return (
      <button
        type="button"
        className="tr-editable"
        aria-label={'Edit ' + label}
        title={label}
        onClick={() => {
          setDraft(String(value ?? ''));
          setEditing(true);
        }}
      >
        {display ?? selected?.text ?? (String(value ?? '') || empty)}
      </button>
    );
  }
  const inputProps = {
    value: draft,
    onChange: (e) => setDraft(e.target.value),
    'aria-label': label,
    autoFocus: true,
    className: 'form-control',
    ...props,
  };
  return (
    <Modal
      title={label}
      close={() => setEditing(false)}
      save={() => onSave(type === 'number' ? (draft === '' ? null : Number(draft)) : draft)}
    >
      {options ? (
        <select {...inputProps}>
          <option value="">{empty}</option>
          {options.map((o) => (
            <option key={o.value ?? o} value={o.value ?? o}>
              {o.text ?? o}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea rows="8" {...inputProps} />
      ) : (
        <input type={type} {...inputProps} />
      )}
    </Modal>
  );
}

export function Delete({ label = 'Delete', subject, remove }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        color="danger"
        icon="trash"
        aria-label={label || 'Delete ' + subject}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      {open && (
        <Modal
          title="Confirm Deletion"
          action="Confirm"
          color="danger"
          close={() => setOpen(false)}
          save={remove}
        >
          Are you sure you want to delete {subject}?
        </Modal>
      )}
    </>
  );
}

export function Action({ run, ...props }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <>
      <Button
        {...props}
        disabled={busy || props.disabled}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            await run();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      />
      <Alert>{error}</Alert>
    </>
  );
}

export function Dropdown({ title, children, color = 'info' }) {
  return (
    <details className="btn-group tr-dropdown">
      <summary className={'btn btn-xs btn-' + color}>
        {title} <span className="caret" />
      </summary>
      <div className="dropdown-menu dropdown-menu-right">{children}</div>
    </details>
  );
}
export function Toggle({ open, onClick, label = '', color = 'info' }) {
  return (
    <Button className="btn-block" color={color} aria-expanded={open} onClick={onClick}>
      {open ? 'Hide' : 'Show'} {label}
    </Button>
  );
}
