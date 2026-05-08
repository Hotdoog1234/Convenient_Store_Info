import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { auth, db } from '../firebase';

// EmailJS from environment variables
const EMAILJS_SERVICE_ID    = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const EMAILJS_NOTIFY_TPL    = process.env.REACT_APP_EMAILJS_NOTIFY_TEMPLATE;
const EMAILJS_PUBLIC_KEY    = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
const emailjsReady          = !!EMAILJS_SERVICE_ID && !!EMAILJS_NOTIFY_TPL && !!EMAILJS_PUBLIC_KEY;

const ADMIN_NOTIFY_EMAIL    = 'rfortner@shieldenvironmental.com';

// Rate-limiting: lock after this many consecutive failures
const MAX_ATTEMPTS    = 5;
const LOCKOUT_MS      = 15 * 60 * 1000; // 15 minutes

// ── Input helpers ─────────────────────────────────────────────────────────
const sanitizeText = (str) =>
  str.trim()
     .replace(/<[^>]*>/g, '')      // strip HTML tags
     .replace(/[<>"'&]/g, '')      // strip remaining dangerous chars
     .slice(0, 120);               // max length

const isValidEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

// ── Friendly Firebase error messages ─────────────────────────────────────
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

const LoginScreen = () => {
  const [mode,     setMode]     = useState('login');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  // Rate limiting state
  const [failCount,    setFailCount]    = useState(0);
  const [lockedUntil,  setLockedUntil]  = useState(null);

  const reset = (nextMode) => {
    setMode(nextMode);
    setName(''); setEmail(''); setPassword('');
    setError(''); setSuccess('');
  };

  const isLockedOut = () => lockedUntil && Date.now() < lockedUntil;

  const lockoutMessage = () => {
    if (!lockedUntil) return '';
    const mins = Math.ceil((lockedUntil - Date.now()) / 60000);
    return `Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`;
  };

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLockedOut()) { setError(lockoutMessage()); return; }

    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true); setError('');
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      setFailCount(0);
      setLockedUntil(null);
      // onAuthStateChanged in App.js takes over
    } catch (err) {
      const next = failCount + 1;
      setFailCount(next);
      if (next >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        setLockedUntil(until);
        setError(`Account locked after ${MAX_ATTEMPTS} failed attempts. Try again in 15 minutes.`);
      } else {
        const remaining = MAX_ATTEMPTS - next;
        setError(
          friendlyError(err.code) +
          (remaining > 0 ? ` (${remaining} attempt${remaining !== 1 ? 's' : ''} remaining)` : '')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Register (access request only — no account created immediately) ───────
  const handleRegister = async (e) => {
    e.preventDefault();

    // Sanitize all inputs
    const cleanName  = sanitizeText(name);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError('Please enter your full name.'); return;
    }
    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address.'); return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }

    setLoading(true); setError('');
    try {
      // Save sanitized request to Firestore (password is NOT stored)
      await addDoc(collection(db, 'accessRequests'), {
        name:      cleanName,
        email:     cleanEmail,
        status:    'pending',
        timestamp: serverTimestamp(),
      });

      // Notify admin
      if (emailjsReady) {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_NOTIFY_TPL,
          { requester_name: cleanName, requester_email: cleanEmail, to_email: ADMIN_NOTIFY_EMAIL },
          EMAILJS_PUBLIC_KEY,
        ).catch(() => {}); // non-blocking — request is saved regardless
      }

      setSuccess(`Request submitted for ${cleanEmail}. You'll receive an email once your account is approved.`);
      setName(''); setEmail(''); setPassword('');
    } catch (err) {
      setError('Failed to submit request. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
            {error   && <p className="login-error">{error}</p>}
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
