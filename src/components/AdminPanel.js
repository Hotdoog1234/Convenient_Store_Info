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
} from 'firebase/auth';
import emailjs from '@emailjs/browser';
import { auth, db, firebaseConfig } from '../firebase';

const EMAILJS_PUBLIC_KEY = 'QEnhUmZl49thzCGKH';
const EMAILJS_SERVICE   = 'service_1q3jqtp';
const EMAILJS_APPROVAL  = 'template_5i06wqv';
const EMAILJS_DENIAL    = 'template_wfj2tmb';

// Admin email — must match Firebase Auth and Firestore rules exactly
const ADMIN_EMAIL = 'robert_francis@shieldmw.com';

const sendEmail = (templateId, params) => {
  emailjs.init(EMAILJS_PUBLIC_KEY);
  return emailjs.send(EMAILJS_SERVICE, templateId, params);
};

const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 12 }, () =>
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

// ── Access Requests tab ────────────────────────────────────────────────────
const RequestsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [status,   setStatus]   = useState({}); // { [id]: 'working'|'done'|'error' }

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

  const setRowStatus = (id, s) => setStatus(prev => ({ ...prev, [id]: s }));

  const handleApprove = async (req) => {
    setRowStatus(req.id, 'working');
    try {
      const tempPassword = generateTempPassword();
      const newUser = await createUserAccount(req.email, tempPassword);

      await setDoc(doc(db, 'approvedUsers', newUser.uid), {
        uid:        newUser.uid,
        name:       req.name,
        email:      req.email,
        createdAt:  serverTimestamp(),
        lastSignIn: null,
        disabled:   false,
      });

      await updateDoc(doc(db, 'accessRequests', req.id), { status: 'approved' });

      await sendEmail(EMAILJS_APPROVAL, {
        to_email:      req.email,
        to_name:       req.name,
        temp_password: tempPassword,
      });

      setRowStatus(req.id, 'approved');
    } catch (err) {
      console.error('Approve failed:', err);
      setRowStatus(req.id, 'error');
    }
  };

  const handleDeny = async (req) => {
    setRowStatus(req.id, 'working');
    try {
      await updateDoc(doc(db, 'accessRequests', req.id), { status: 'denied' });

      sendEmail(EMAILJS_DENIAL, {
        to_email: req.email,
        to_name:  req.name,
      }).catch(() => {}); // denial email is best-effort — don't block on failure

      setRowStatus(req.id, 'denied');
    } catch (err) {
      console.error('Deny failed:', err);
      setRowStatus(req.id, 'error');
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
            const s = status[req.id];
            return (
              <tr key={req.id}>
                <td>{req.name}</td>
                <td>{req.email}</td>
                <td>{fmtDate(req.timestamp)}</td>
                <td>
                  {s === 'working' && <span className="admin-status">Working…</span>}
                  {s === 'approved' && <span className="admin-status admin-status--ok">✓ Approved</span>}
                  {s === 'denied'   && <span className="admin-status admin-status--muted">✕ Denied</span>}
                  {s === 'error'    && <span className="admin-status admin-status--err">Error — retry</span>}
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
            const s          = status[u.uid];
            const isDisabled = u.disabled;
            const isAdmin    = u.email?.toLowerCase() === ADMIN_EMAIL;
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
