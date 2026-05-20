import React, { useState, useEffect } from 'react';
import './styles/global.css';

import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

import { useStoreData } from './hooks/useStoreData';
import Header       from './components/Header';
import SearchBar    from './components/SearchBar';
import FacilityCard from './components/FacilityCard';
import DataUpload   from './components/DataUpload';
import EmptyState   from './components/EmptyState';
import LoginScreen  from './components/LoginScreen';
import AdminPanel   from './components/AdminPanel';
import SplashScreen from './components/SplashScreen';

const ADMIN_EMAIL = 'robert_francis@shieldmw.com';

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const LoadingSpinner = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
    <div className="spinner" />
  </div>
);

const ErrorMessage = ({ message }) => (
  <div style={{
    background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
    padding: '16px 20px', color: '#991b1b', fontSize: 14, lineHeight: 1.5,
    maxWidth: 360, textAlign: 'center',
  }}>
    <strong style={{ display: 'block', marginBottom: 6 }}>Unable to load data</strong>
    {message}
    <button
      onClick={() => window.location.reload()}
      style={{ display: 'block', margin: '12px auto 0', padding: '6px 16px',
        background: '#991b1b', color: '#fff', border: 'none', borderRadius: 6,
        cursor: 'pointer', fontSize: 13 }}
    >
      Retry
    </button>
  </div>
);

const App = () => {
  const [showSplash,   setShowSplash]   = useState(true);
  const [user,         setUser]         = useState(undefined);
  const [authReady,    setAuthReady]    = useState(false);
  const [results,      setResults]      = useState(null);
  const [showUpload,   setShowUpload]   = useState(false);
  const [showAdmin,    setShowAdmin]    = useState(false);
  const [wasCancelled, setWasCancelled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const {
    isInitializing, isLoaded,
    loadError,
    tankUploadedAt, ownerUploadedAt,
    saveTankData, saveOwnerData,
    search, findNearest, getUniqueValues, findOwner,
    facilityCount, tankCount, ownerCount,
  } = useStoreData(authReady && !!user);

  useEffect(() => {
    // Safety net: if onAuthStateChanged never fires (e.g. iOS WebView network delay),
    // mark auth ready after 5s so the UI doesn't stay gated forever.
    const timeout = setTimeout(() => setAuthReady(true), 5000);

    const unsub = onAuthStateChanged(auth, async (u) => {
      clearTimeout(timeout);
      if (u) {
        const ref = doc(db, 'approvedUsers', u.uid);
        if (u.email?.toLowerCase() === ADMIN_EMAIL) {
          // Keep admin's own approvedUsers record current so they appear in Active Users tab
          try {
            const snap = await getDoc(ref);
            if (!snap.exists()) {
              await setDoc(ref, {
                uid:       u.uid,
                name:      u.displayName || '',
                email:     u.email,
                createdAt: serverTimestamp(),
                lastSignIn: serverTimestamp(),
                disabled:  false,
              });
            } else {
              await updateDoc(ref, { lastSignIn: serverTimestamp() });
            }
          } catch (e) {
            console.error('Admin record update failed:', e);
          }
        } else {
          try {
            const userDoc = await getDoc(ref);
            if (userDoc.exists() && userDoc.data().disabled) {
              await signOut(auth);
              return;
            }
            if (userDoc.exists()) {
              await updateDoc(ref, { lastSignIn: serverTimestamp() });
            }
          } catch (e) {
            console.error('Firestore user check failed:', e);
          }
        }
      }
      setUser(u);
      setAuthReady(true);
    });
    return () => { clearTimeout(timeout); unsub(); };
  }, []);

  // ── Real-time block check — signs out cancelled users immediately ──────────
  useEffect(() => {
    if (!user || user.email?.toLowerCase() === ADMIN_EMAIL) return;
    const unsub = onSnapshot(doc(db, 'blockedUsers', user.uid), (snap) => {
      if (snap.exists()) {
        setWasCancelled(true);
        signOut(auth);
      }
    });
    return unsub;
  }, [user]);

  const handleSignOut = () => { setShowAdmin(false); setWasCancelled(false); signOut(auth); };

  const handleDeleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      await deleteUser(currentUser);
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        alert('For security, please sign out and sign back in before deleting your account.');
        signOut(auth);
        return;
      }
      console.error('Failed to delete account:', err);
    }
    setShowAdmin(false);
    setWasCancelled(false);
  };

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;

  if (showSplash) return <SplashScreen />;

  // Show login screen immediately — no spinner while waiting for Firebase Auth.
  // authReady gates data fetching; the login screen handles the not-yet-resolved state.
  if (!user) return (
    <LoginScreen cancelledMessage={wasCancelled
      ? 'Your account has been cancelled. Please contact the administrator.'
      : null}
    />
  );

  const handleSearch   = (category, term, term2) => setResults(search(category, term, term2));
  const handleLocateMe = (lat, lng)              => setResults(findNearest(lat, lng, 5));

  const handleTankLoaded = async (rows) => {
    await saveTankData(rows);
    setResults(null);
  };

  const handleOwnerLoaded = async (rows) => {
    await saveOwnerData(rows);
  };

  const footer = (
    <footer className="app-footer">
      Shield Environmental Associates, Inc. {new Date().getFullYear()}
    </footer>
  );

  // ── Fetching from Firestore ───────────────────────────────────────────────
  if (isInitializing) {
    return (
      <div className="app-layout">
        <Header onSignOut={handleSignOut} onDeleteAccount={handleDeleteAccount} isAdmin={isAdmin} onAdmin={() => setShowAdmin(true)} />
        <div className="upload-fullpage">
          {loadError ? <ErrorMessage message={loadError} /> : <LoadingSpinner />}
        </div>
        {footer}
      </div>
    );
  }

  // ── Firebase error after init ─────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="app-layout">
        <Header onSignOut={handleSignOut} onDeleteAccount={handleDeleteAccount} isAdmin={isAdmin} onAdmin={() => setShowAdmin(true)} />
        <div className="upload-fullpage">
          <ErrorMessage message={loadError} />
        </div>
        {footer}
      </div>
    );
  }

  // ── No data in Firestore ──────────────────────────────────────────────────
  if (!isLoaded) {
    if (!isAdmin) {
      return (
        <div className="app-layout">
          <Header onSignOut={handleSignOut} onDeleteAccount={handleDeleteAccount} isAdmin={isAdmin} onAdmin={() => setShowAdmin(true)} />
          <div className="upload-fullpage">
            <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 15 }}>
              <p style={{ marginBottom: 8 }}>Data has not been loaded yet.</p>
              <p style={{ margin: 0 }}>Please contact the administrator.</p>
            </div>
          </div>
          {footer}
        </div>
      );
    }
    return (
      <div className="app-layout">
        <Header onSignOut={handleSignOut} onDeleteAccount={handleDeleteAccount} isAdmin={isAdmin} onAdmin={() => setShowAdmin(true)} />
        <div className="upload-fullpage">
          <DataUpload
            onTankLoaded={handleTankLoaded}
            onOwnerLoaded={handleOwnerLoaded}
          />
        </div>
        {footer}
      </div>
    );
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  return (
    <div className="app-layout">
      <Header
        onUpdateData={isAdmin ? () => setShowUpload(true) : undefined}
        onSignOut={handleSignOut}
        onDeleteAccount={handleDeleteAccount}
        isAdmin={isAdmin}
        onAdmin={() => setShowAdmin(true)}
      />

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      {showUpload && (
        <div className="upload-overlay">
          <DataUpload
            onTankLoaded={handleTankLoaded}
            onOwnerLoaded={handleOwnerLoaded}
            onCancel={() => setShowUpload(false)}
            requirePasscode
          />
        </div>
      )}

      <main className="main-content">
        <div className="status-bar">
          <span className="status-bar-text">
            <span className="status-dataset">
              <strong>Tank data:</strong>{' '}
              {tankUploadedAt
                ? <>{formatDate(tankUploadedAt)} · {tankCount.toLocaleString()} records</>
                : <em>not uploaded</em>}
            </span>
            <span className="status-divider" aria-hidden="true">|</span>
            <span className="status-dataset">
              <strong>Owner data:</strong>{' '}
              {ownerUploadedAt
                ? <>{formatDate(ownerUploadedAt)} · {ownerCount.toLocaleString()} records</>
                : <em>not uploaded</em>}
            </span>
          </span>
        </div>

        <SearchBar
          onSearch={handleSearch}
          onLocateMe={handleLocateMe}
          getUniqueValues={getUniqueValues}
        />

        {results === null ? (
          <EmptyState />
        ) : results.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">😶</span>
            <h3 className="empty-state-title">No facilities found</h3>
            <p className="empty-state-text">Try a different search term or category.</p>
          </div>
        ) : (
          <>
            <p className="results-count">
              {results[0]?.distanceMiles != null
                ? `${results.length} nearest ${results.length === 1 ? 'facility' : 'facilities'} to your location`
                : `${results.length} ${results.length === 1 ? 'facility' : 'facilities'} found`}
            </p>
            {results.map(({ facility, tanks, distanceMiles }) => (
              <FacilityCard
                key={facility.AI_ID}
                facility={facility}
                tanks={tanks}
                findOwner={findOwner}
                distanceMiles={distanceMiles ?? null}
              />
            ))}
          </>
        )}
      </main>

      {footer}
    </div>
  );
};

export default App;
