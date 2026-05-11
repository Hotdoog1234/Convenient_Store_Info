import React, { useState, useEffect } from 'react';
import './styles/global.css';

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

import { useStoreData } from './hooks/useStoreData';
import Header       from './components/Header';
import SearchBar    from './components/SearchBar';
import FacilityCard from './components/FacilityCard';
import DataUpload   from './components/DataUpload';
import EmptyState   from './components/EmptyState';
import LoginScreen  from './components/LoginScreen';
import AdminPanel   from './components/AdminPanel';

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

const LoadingSpinner = ({ message = 'Loading…' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
    <div className="spinner" />
    <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, margin: 0 }}>{message}</p>
  </div>
);

const App = () => {
  const [user,       setUser]       = useState(undefined);
  const [authReady,  setAuthReady]  = useState(false);
  const [results,    setResults]    = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showAdmin,  setShowAdmin]  = useState(false);

  const {
    isInitializing, isLoaded,
    tankUploadedAt, ownerUploadedAt,
    saveTankData, saveOwnerData,
    search, findNearest, getUniqueValues, findOwner,
    facilityCount, tankCount, ownerCount,
  } = useStoreData();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u && u.email?.toLowerCase() !== ADMIN_EMAIL) {
        try {
          const userDoc = await getDoc(doc(db, 'approvedUsers', u.uid));
          if (userDoc.exists() && userDoc.data().disabled) {
            await signOut(auth);
            return;
          }
          if (userDoc.exists()) {
            await updateDoc(doc(db, 'approvedUsers', u.uid), {
              lastSignIn: serverTimestamp(),
            });
          }
        } catch (e) {
          console.error('Firestore user check failed:', e);
        }
      }
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  const handleSignOut = () => { setShowAdmin(false); signOut(auth); };

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;

  if (!authReady) {
    return (
      <div className="app-layout">
        <div className="upload-fullpage">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  const handleSearch   = (category, term, term2) => setResults(search(category, term, term2));
  const handleLocateMe = (lat, lng)              => setResults(findNearest(lat, lng, 5));

  const handleTankLoaded = async (rows) => {
    await saveTankData(rows);
    setResults(null);
    // DataUpload shows success and lets admin close via its own Cancel/Close button
  };

  const handleOwnerLoaded = async (rows) => {
    await saveOwnerData(rows);
  };

  const footer = (
    <footer className="app-footer">
      Shield Environmental Associates, Inc. {new Date().getFullYear()}
    </footer>
  );

  if (isInitializing) {
    return (
      <div className="app-layout">
        <Header onSignOut={handleSignOut} isAdmin={isAdmin} onAdmin={() => setShowAdmin(true)} />
        <div className="upload-fullpage">
          <LoadingSpinner message="Loading data from Firestore…" />
        </div>
        {footer}
      </div>
    );
  }

  if (!isLoaded) {
    if (!isAdmin) {
      return (
        <div className="app-layout">
          <Header onSignOut={handleSignOut} isAdmin={isAdmin} onAdmin={() => setShowAdmin(true)} />
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
        <Header onSignOut={handleSignOut} isAdmin={isAdmin} onAdmin={() => setShowAdmin(true)} />
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

  return (
    <div className="app-layout">
      <Header
        onUpdateData={isAdmin ? () => setShowUpload(true) : undefined}
        onSignOut={handleSignOut}
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
