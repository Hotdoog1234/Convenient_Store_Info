import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { auth, db } from '../firebase';

const EMAILJS_SERVICE_ID  = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const EMAILJS_NOTIFY_TPL  = process.env.REACT_APP_EMAILJS_NOTIFY_TEMPLATE;
const EMAILJS_PUBLIC_KEY  = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
const emailjsReady        = !!EMAILJS_SERVICE_ID && !!EMAILJS_NOTIFY_TPL && !!EMAILJS_PUBLIC_KEY;

const ADMIN_NOTIFY_EMAIL  = 'robert_francis@shieldmw.com';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 15 * 60 * 1000;

const sanitizeText = (str) =>
  str.trim()
     .replace(/<[^>]*>/g, '')
     .replace(/[<>"'&]/g, '')
     .slice(0, 120);

const isValidEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

const friendlyError = (code) => {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Incorrect email or password.';
    case 'auth/too-many-requests':  return 'Too many attempts. Please try again later.';
    case 'auth/user-disabled':      return 'This account has been disabled. Contact your administrator.';
    case 'auth/invalid-email':      return 'Please enter a valid email address.';
    case 'auth/network-request-failed': return 'Network error. Check your connection and try again.';
    default:                        return 'Sign in failed. Please try again.';
  }
};

// Step indicator shown during form submission
const StepList = ({ steps }) => (
  <div style={{ margin: '12px 0', fontSize: 13, lineHeight: 1.7 }}>
    {steps.map((s, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 16, textAlign: 'center' }}>
          {s.status === 'pending' && <span className="spinner spinner--sm" style={{ display: 'inline-block' }} />}
          {s.status === 'ok'      && <span style={{ color: '#2d6a4f' }}>✓</span>}
          {s.status === 'error'   && <span style={{ color: '#991b1b' }}>✕</span>}
          {s.status === 'skip'    && <span style={{ color: '#999' }}>–</span>}
        </span>
        <span style={{
          color: s.status === 'error' ? '#991b1b'
               : s.status === 'ok'   ? '#2d6a4f'
               : s.status === 'skip' ? '#999'
               : 'var(--color-text)',
        }}>
          {s.label}
          {s.detail && (
            <span style={{ display: 'block', fontSize: 11, color: '#991b1b', marginLeft: 0 }}>
              {s.detail}
            </span>
          )}
        </span>
      </div>
    ))}
  </div>
);

const LoginScreen = () => {
  const [mode,     setMode]     = useState('login');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [steps,    setSteps]    = useState([]);

  const [failCount,   setFailCount]   = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);

  const reset = (nextMode) => {
    setMode(nextMode);
    setName(''); setEmail(''); setPassword('');
    setError(''); setSuccess(''); setSteps([]);
  };

  const isLockedOut   = () => lockedUntil && Date.now() < lockedUntil;
  const lockoutMessage = () => {
    if (!lockedUntil) return '';
    const mins = Math.ceil((lockedUntil - Date.now()) / 60000);
    return `Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`;
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLockedOut()) { setError(lockoutMessage()); return; }

    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidEmail(trimmedEmail)) { setError('Please enter a valid email address.'); return; }

    setLoading(true); setError('');
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      setFailCount(0); setLockedUntil(null);
    } catch (err) {
      const next = failCount + 1;
      setFailCount(next);
      if (next >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS);
        setError(`Account locked after ${MAX_ATTEMPTS} failed attempts. Try again in 15 minutes.`);
      } else {
        const rem = MAX_ATTEMPTS - next;
        setError(friendlyError(err.code) + (rem > 0 ? ` (${rem} attempt${rem !== 1 ? 's' : ''} remaining)` : ''));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();

    const cleanName  = sanitizeText(name);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName)                { setError('Please enter your full name.'); return; }
    if (!isValidEmail(cleanEmail)) { setError('Please enter a valid email address.'); return; }
    if (password.length < 6)       { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    setError('');
    setSuccess('');
    setSteps([{ label: 'Saving request to Firestore…', status: 'pending' }]);

    // ── Step 1: Firestore write ─────────────────────────────────────────────
    let docRef;
    try {
      docRef = await addDoc(collection(db, 'accessRequests'), {
        name:      cleanName,
        email:     cleanEmail,
        status:    'pending',
        timestamp: serverTimestamp(),
      });
      setSteps([{ label: `Request saved (ID: ${docRef.id})`, status: 'ok' },
                { label: 'Sending notification email…', status: 'pending' }]);
    } catch (err) {
      console.error('[Register] Firestore write failed:', err);
      setSteps([{ label: 'Saving request to Firestore…', status: 'error',
                  detail: `${err.code ?? ''} ${err.message}` }]);
      setError('Could not save your request. Please try again.');
      setLoading(false);
      return;
    }

    // ── Step 2: EmailJS notification ────────────────────────────────────────
    if (emailjsReady) {
      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_NOTIFY_TPL,
          { requester_name: cleanName, requester_email: cleanEmail, to_email: ADMIN_NOTIFY_EMAIL },
          EMAILJS_PUBLIC_KEY,
        );
        setSteps([
          { label: `Request saved (ID: ${docRef.id})`, status: 'ok' },
          { label: `Notification sent to ${ADMIN_NOTIFY_EMAIL}`, status: 'ok' },
        ]);
      } catch (err) {
        console.error('[Register] EmailJS send failed:', err);
        setSteps([
          { label: `Request saved (ID: ${docRef.id})`, status: 'ok' },
          { label: 'Notification email failed (request still saved)', status: 'error',
            detail: err.text ?? err.message ?? String(err) },
        ]);
      }
    } else {
      setSteps([
        { label: `Request saved (ID: ${docRef.id})`, status: 'ok' },
        { label: 'Email notification skipped (NOTIFY_TEMPLATE not configured)', status: 'skip' },
      ]);
    }

    setSuccess(`Request submitted for ${cleanEmail}. You'll receive an email once your account is approved.`);
    setName(''); setEmail(''); setPassword('');
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img
            src={`${process.env.PUBLIC_URL}/shield-logo.jpg`}
            alt="Shield Environmental logo"
            className="login-logo"
          />
          <h1 className="login-app-name">Shield UST App</h1>
          <p className="login-app-sub">Kentucky Underground Storage Tank Database</p>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab${mode === 'login' ? ' login-tab--active' : ''}`}
            onClick={() => reset('login')}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`login-tab${mode === 'register' ? ' login-tab--active' : ''}`}
            onClick={() => reset('register')}
            type="button"
          >
            Request Access
          </button>
        </div>

        {/* ── Login form ── */}
        {mode === 'login' && (
          <form className="login-form" onSubmit={handleLogin} noValidate>
            <div className="login-field">
              <label className="section-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                maxLength={254}
                autoFocus
              />
            </div>
            <div className="login-field">
              <label className="section-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                maxLength={128}
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button
              className="btn-primary login-submit"
              type="submit"
              disabled={loading || isLockedOut()}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* ── Register form ── */}
        {mode === 'register' && (
          <form className="login-form" onSubmit={handleRegister} noValidate>
            <p className="login-register-note">
              Fill in your details below. An administrator will review your request
              and create your account.
            </p>
            <div className="login-field">
              <label className="section-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                autoFocus
              />
            </div>
            <div className="login-field">
              <label className="section-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                maxLength={254}
              />
            </div>
            <div className="login-field">
              <label className="section-label">Desired Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                maxLength={128}
                autoComplete="new-password"
              />
            </div>

            {error && <p className="login-error">{error}</p>}
            {steps.length > 0 && <StepList steps={steps} />}
            {success && <p className="login-success">{success}</p>}

            {!success && (
              <button className="btn-primary login-submit" type="submit" disabled={loading}>
                {loading ? 'Submitting…' : 'Request Access'}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
