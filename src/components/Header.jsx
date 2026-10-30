import { useState } from 'react';
import PlanBadge from './PlanBadge.jsx';

export default function Header({ status, userId, onChangeUser, onUpgrade }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(userId);

  const submit = (event) => {
    event.preventDefault();
    const clean = draft.trim().replace(/[^A-Za-z0-9_.@-]/g, '').slice(0, 64);
    if (clean) onChangeUser(clean);
    setEditing(false);
  };

  return (
    <header className="header">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 17l7-11 7 11" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="17" r="1.6" fill="currentColor" /></svg>
        </div>
        <div>
          <h1>Proxy IA</h1>
          <p>Rate limiting y cuotas por plan</p>
        </div>
      </div>

      <div className="header-actions">
        {editing ? (
          <form className="user-form" onSubmit={submit}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus aria-label="ID de usuario" />
            <button type="submit" className="btn btn-small">Cambiar</button>
            <button type="button" className="btn btn-small btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>
          </form>
        ) : (
          <button className="user-chip" onClick={() => { setDraft(userId); setEditing(true); }} title="Cambiar de usuario">
            <span className="user-avatar">{userId.slice(0, 1).toUpperCase()}</span>
            <span className="user-name">{userId}</span>
          </button>
        )}
        <PlanBadge plan={status?.plan} />
        {status && status.plan !== 'ENTERPRISE' && (
          <button className="btn btn-primary btn-small" onClick={onUpgrade}>Mejorar plan</button>
        )}
      </div>
    </header>
  );
}
