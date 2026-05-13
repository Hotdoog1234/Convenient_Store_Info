import React, { useState, useEffect, useCallback } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import {
  initializeApp, deleteApp,
} from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import emailjs from '@emailjs/browser';
import { auth, db, firebaseConfig } from '../firebase';

const EMAILJS_PUBLIC_KEY = 'QEnhUmZl49thzCGKH';
const EMAILJS_SERVICE    = 'service_1q3jqtp';
const EMAILJS_APPROVAL   = 'template_5i06wqv';
const EMAILJS_DENIAL     = 'template_wfj2tmb';

// Admin email — must match Firebase Auth and Firestore rules exactly
const ADMIN_EMAIL = 'robert_francis@shieldmw.com';

const sendEmail = (templateId, params) => {
  emailjs.init(EMAILJS_PUBLIC_KEY);
  return emailjs.send(EMAILJS_SERVICE, templateId, params);
};

const randomInternalPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length: 20 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Creates a Firebase Auth account WITHOUT affecting the admin's current session
// by using a disposable secondary Firebase app instance.
const createUserAccount = async (email, password) => {
  const appName = `secondary-${Date.now()}`;
  const secondaryApp  = initializeApp(firebaseConfig, appName);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await firebaseSignOut(secondaryAuth);
    return cred.user;
  } finally {
    await deleteApp(secondaryApp);
  }
};

// ── Step list for approve progress ────────────────────────────────────────
const ApproveSteps = ({ steps }) => (
  <div style={{ fontSize: 12, lineHeight: 1.8 }}>
    {steps.map((s, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 14, textAlign: 'center', flexShrink: 0 }}>
          {s.status === 'pending' && <span className="spinner spinner--sm" style={{ display: 'inline-block' }} />}
          {s.status === 'ok'      && <span style={{ color: '#2d6a4f' }}>✓</span>}
          {s.status === 'error'   && <span style={{ color: '#991b1b' }}>✕</span>}
        </span>
        <span style={{
          color: s.status === 'error' ? '#991b1b'
               : s.status === 'ok'   ? '#2d6a4f'
               : 'var(--color-text)',
        }}>
          {s.label}
          {s.detail && (
            <span style={{ display: 'block', fontSize: 11, color: '#991b1b' }}>{s.detail}</span>
          )}
        </span>
      </div>
    ))}
  </div>
);

// ── Access Requests tab ────────────────────────────────────────────────────
const RequestsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  // rowState shape: { [id]: { s: 'steps'|'approved'|'denied'|'error', steps?: array } }
  const [rowState, setRowState] = useState({});

  useEffect(() => {
    const q = query(
      collection(db, 'accessRequests'),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const pending = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(r => r.status === 'pending');
      setRequests(pending);
      setLoading(false);
    }, (err) => {
      console.error('[AdminPanel] accessRequests query failed:', err);
      setLoading(false);
    });
    return unsub;
  }, []);

  const setRow = (id, update) =>
    setRowState(prev => ({ ...prev, [id]: { ...prev[id], ...update } }));

  const setStep = (id, index, patch) =>
    setRowState(prev => {
      const steps = [...(prev[id]?.steps ?? [])];
      steps[index] = { ...steps[index], ...patch };
      return { ...prev, [id]: { ...prev[id], steps } };
    });

  const handleApprove = async (req) => {
    const initialSteps = [
      { label: 'Creating Firebase account…',    status: 'pending' },
      { label: 'Saving to database…',           status: 'idle' },
      { label: 'Sending password setup email…', status: 'idle' },
      { label: 'Sending approval email…',       status: 'idle' },
    ];
    setRow(req.id, { s: 'steps', steps: initialSteps });

    // Step 0 — create Firebase Auth account
    let newUser;
    try {
      newUser = await createUserAccount(req.email, randomInternalPassword());
      setStep(req.id, 0, { status: 'ok' });
    } catch (err) {
      const detail = err.message ?? String(err);
      setStep(req.id, 0, { status: 'error', detail });
      console.error('Approve — create account failed:', err);
      return;
    }

    // Step 1 — write Firestore records
    setStep(req.id, 1, { status: 'pending' });
    try {
      await setDoc(doc(db, 'approvedUsers', newUser.uid), {
        uid:        newUser.uid,
        name:       req.name,
        email:      req.email,
        createdAt:  serverTimestamp(),
        lastSignIn: null,
        disabled:   false,
      });
      await updateDoc(doc(db, 'accessRequests', req.id), { status: 'approved' });
      setStep(req.id, 1, { status: 'ok' });
    } catch (err) {
      const detail = err.message ?? String(err);
      setStep(req.id, 1, { status: 'error', detail });
      console.error('Approve — Firestore write failed:', err);
      return;
    }

    // Step 2 — Firebase password setup email
    setStep(req.id, 2, { status: 'pending' });
    try {
      await sendPasswordResetEmail(auth, req.email);
      setStep(req.id, 2, { status: 'ok' });
    } catch (err) {
      const detail = err.message ?? String(err);
      setStep(req.id, 2, { status: 'error', detail });
      console.error('Approve — password reset email failed:', err);
      // non-fatal: continue to approval email
    }

    // Step 3 — EmailJS approval notification
    setStep(req.id, 3, { status: 'pending' });
    try {
      await sendEmail(EMAILJS_APPROVAL, {
        to_email: req.email,
        to_name:  req.name,
      });
      setStep(req.id, 3, { status: 'ok', label: 'Approval email sent ✓' });
    } catch (err) {
      const detail = [err.status, err.text, err.message].filter(Boolean).join(' — ') || String(err);
      setStep(req.id, 3, { status: 'error', detail });
      console.error('Approve — approval email failed:', err);
    }

    setRow(req.id, { s: 'approved' });
  };

  const handleDeny = async (req) => {
    setRow(req.id, 'working');
    try {
      await updateDoc(doc(db, 'accessRequests', req.id), { status: 'denied' });

      sendEmail(EMAILJS_DENIAL, {
        to_email: req.email,
        to_name:  req.name,
      }).catch(() => {}); // best-effort — don't block on failure

      setRow(req.id, 'denied');
    } catch (err) {
      console.error('Deny failed:', err);
      setRow(req.id, 'error');
    }
  };

  if (loading) return <div className="admin-loading">Loading requests…</div>;
  if (requests.length === 0) return (
    <div className="admin-empty">No pending access requests.</div>
  );

  return (
    <div className="admin-table-wrap">
      <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--color-text-secondary)' }}>
        {requests.length} pending {requests.length === 1 ? 'request' : 'requests'}
      </p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Date Requested</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(req => {
            const row = rowState[req.id] ?? {};
            const s   = row.s;
            return (
              <tr key={req.id}>
                <td>{req.name}</td>
                <td>{req.email}</td>
                <td>{fmtDate(req.timestamp)}</td>
                <td>
                  {s === 'steps' && <ApproveSteps steps={row.steps ?? []} />}
                  {s === 'approved' && (
                    <div>
                      <ApproveSteps steps={row.steps ?? []} />
                      <span className="admin-status admin-status--ok" style={{ marginTop: 4, display: 'block' }}>
                        Done!
                      </span>
                    </div>
                  )}
                  {s === 'denied'  && <span className="admin-status admin-status--muted">✕ Denied</span>}
                  {!s && (
                    <div className="admin-actions">
                      <button
                        className="btn-primary admin-btn-sm"
                        onClick={() => handleApprove(req)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-outline admin-btn-sm admin-btn-deny"
                        onClick={() => handleDeny(req)}
                      >
                        Deny
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── Active Users tab ───────────────────────────────────────────────────────
const UsersTab = () => {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  // status shape: { [uid]: 'working'|'cancelled'|'resetting'|'reset-sent'|'error' }
  const [status,  setStatus]  = useState({});

  useEffect(() => {
    const q = query(
      collection(db, 'approvedUsers'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const handleCancel = useCallback(async (u) => {
    if (!window.confirm(`Cancel account for ${u.email}? They will be signed out immediately.`)) return;
    setStatus(prev => ({ ...prev, [u.uid]: 'working' }));
    try {
      await updateDoc(doc(db, 'approvedUsers', u.uid), { disabled: true });
      setStatus(prev => ({ ...prev, [u.uid]: 'cancelled' }));
    } catch (err) {
      console.error('Cancel failed:', err);
      setStatus(prev => ({ ...prev, [u.uid]: 'error' }));
    }
  }, []);

  if (loading) return <div className="admin-loading">Loading users…</div>;
  if (users.length === 0) return (
    <div className="admin-empty">No approved users yet.</div>
  );

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Date Created</th>
            <th>Last Sign In</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const s           = status[u.uid];
            const isDisabled  = u.disabled;
            const isAdmin     = u.email?.toLowerCase() === ADMIN_EMAIL;
            const displayName = u.name || u.email;
            return (
              <tr key={u.uid} className={isDisabled ? 'admin-row--disabled' : ''}>
                <td>{displayName}</td>
                <td>{u.email}</td>
                <td>{fmtDate(u.createdAt)}</td>
                <td>{fmtDate(u.lastSignIn)}</td>
                <td>
                  {s === 'working'   && <span className="admin-status">Working…</span>}
                  {s === 'cancelled' && <span className="admin-status admin-status--muted">Account cancelled</span>}
                  {s === 'error'     && <span className="admin-status admin-status--err">Error — retry</span>}
                  {!s && !isDisabled && !isAdmin && (
                    <button
                      className="btn-outline admin-btn-sm admin-btn-deny"
                      onClick={() => handleCancel(u)}
                    >
                      Cancel Account
                    </button>
                  )}
                  {isAdmin && <span className="admin-status admin-status--muted">Admin</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── Admin Panel shell ──────────────────────────────────────────────────────
const AdminPanel = ({ onClose }) => {
  const [tab, setTab] = useState('requests');

  // Server-side guard — verify admin identity against Firebase Auth,
  // not just the UI prop. Firestore rules enforce this again on every query.
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.email?.toLowerCase() !== ADMIN_EMAIL) {
    return (
      <div className="admin-overlay" onClick={onClose}>
        <div className="admin-panel" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--color-accent)', fontWeight: 500 }}>
            Access denied. Admin privileges required.
          </p>
          <button className="btn-outline" style={{ marginTop: 16 }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={e => e.stopPropagation()}>
        <div className="admin-panel-header">
          <h2 className="admin-panel-title">Admin Panel</h2>
          <button className="admin-close" onClick={onClose} title="Close">✕</button>
        </div>

        <div className="admin-tabs">
          <button
            className={`admin-tab${tab === 'requests' ? ' admin-tab--active' : ''}`}
            onClick={() => setTab('requests')}
          >
            Access Requests
          </button>
          <button
            className={`admin-tab${tab === 'users' ? ' admin-tab--active' : ''}`}
            onClick={() => setTab('users')}
          >
            Active Users
          </button>
        </div>

        <div className="admin-panel-body">
          {tab === 'requests' ? <RequestsTab /> : <UsersTab />}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
