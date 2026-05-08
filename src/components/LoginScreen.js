import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { auth, db } from '../firebase';

// ── EmailJS config — create a free account at emailjs.com, then fill these in
// Service: connect your Gmail or other email provider
// Template variables used: {{requester_name}}, {{requester_email}}
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = 'rfortner@shieldenvironmental.com';

const LoginScreen = () => {
  const [mode,     setMode]     = useState('login'); // 'login' | 'register'
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const reset = (nextMode) => {
    setMode(nextMode);
    setName(''); setEmail(''); setPassword('');
    setError(''); setSuccess('');
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged in App.js takes over from here
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Register (access request only — no account created) ───────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      // Save request to Firestore
      await addDoc(collection(db, 'accessRequests'), {
        name,
        email,
        status:    'pending',
        timestamp: serverTimestamp(),
      });

      // Email notification to admin
      if (EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID') {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          { requester_name: name, requester_email: email, to_email: ADMIN_EMAIL },
          EMAILJS_PUBLIC_KEY,
        );
      }

      setSuccess(
        `Access request submitted for ${email}. You'll receive an email once your account is approved.`
      );
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

        {/* Mode toggle */}
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
          <form className="login-form" onSubmit={handleLogin}>
            <div className="login-field">
              <label className="section-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              />
            </div>
            {error   && <p className="login-error">{error}</p>}
            <button className="btn-primary login-submit" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* ── Register form ── */}
        {mode === 'register' && (
          <form className="login-form" onSubmit={handleRegister}>
            <p className="login-register-note">
              Fill in your details below. An administrator will review your request
              and set up your account.
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
              />
            </div>
            <div className="login-field">
              <label className="section-label">Desired Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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

const friendlyError = (code) => {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Incorrect email or password.';
    case 'auth/too-many-requests':  return 'Too many attempts. Please try again later.';
    case 'auth/user-disabled':      return 'This account has been disabled.';
    default:                        return 'Sign in failed. Please try again.';
  }
};

export default LoginScreen;
