import React, { useState } from 'react';
import './styles/global.css';

import { useStoreData } from './hooks/useStoreData';
import Header       from './components/Header';
import SearchBar    from './components/SearchBar';
import FacilityCard from './components/FacilityCard';
import DataUpload   from './components/DataUpload';
import EmptyState   from './components/EmptyState';

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

const App = () => {
  const {
    isInitializing, isLoaded,
    tankUploadedAt, ownerUploadedAt,
    saveTankData, saveOwnerData,
    search, findNearest, getUniqueValues, findOwner,
    facilityCount, tankCount, ownerCount,
  } = useStoreData();

  const [results,    setResults]    = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const handleSearch   = (category, term, term2) => setResults(search(category, term, term2));
  const handleLocateMe = (lat, lng)       => setResults(findNearest(lat, lng, 5));

  const handleTankLoaded = (tankData) => {
    saveTankData(tankData);
    setShowUpload(false);
    setResults(null);
  };

  const handleOwnerLoaded = (ownerData) => {
    saveOwnerData(ownerData);
    setShowUpload(false);
  };

  const footer = (
    <footer className="app-footer">
      Shield Environmental Associates, Inc. {new Date().getFullYear()}
    </footer>
  );

  if (isInitializing) {
    return (
      <div className="app-layout">
        <Header />
        <div className="upload-fullpage">
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 15 }}>Loading…</div>
        </div>
        {footer}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="app-layout">
        <Header />
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
      <Header onUpdateData={() => setShowUpload(true)} />

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
        {/* Status bar */}
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
          <button className="btn-accent" onClick={() => setShowUpload(true)}>
            Update Data
          </button>
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
