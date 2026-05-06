import React, { useState } from 'react';
import './styles/global.css';

import { useStoreData } from './hooks/useStoreData';
import Header     from './components/Header';
import SearchBar  from './components/SearchBar';
import FacilityCard from './components/FacilityCard';
import DataUpload from './components/DataUpload';
import EmptyState from './components/EmptyState';

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
    isInitializing, isLoaded, uploadedAt, saveData,
    search, findNearest, getUniqueValues, findOwner,
    facilityCount, tankCount,
  } = useStoreData();

  const [results,       setResults]       = useState(null); // null = no search yet
  const [showUpload,    setShowUpload]     = useState(false);

  const handleSearch = (category, term) => {
    setResults(search(category, term));
  };

  const handleLocateMe = (lat, lng) => {
    setResults(findNearest(lat, lng, 5));
  };

  const handleDataLoaded = (parsed) => {
    saveData(parsed);
    setShowUpload(false);
    setResults(null);
  };

  // ── Reading from IndexedDB on first render ─────────────────────────────────
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

  // ── No data: full-page upload ──────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="app-layout">
        <Header />
        <div className="upload-fullpage">
          <DataUpload onDataLoaded={handleDataLoaded} />
        </div>
        {footer}
      </div>
    );
  }

  // ── Data loaded: search UI ─────────────────────────────────────────────────
  return (
    <div className="app-layout">
      <Header onUpdateData={() => setShowUpload(true)} />

      {/* Update-data overlay — passcode required */}
      {showUpload && (
        <div className="upload-overlay">
          <DataUpload
            onDataLoaded={handleDataLoaded}
            onCancel={() => setShowUpload(false)}
            requirePasscode
          />
        </div>
      )}

      <main className="main-content">
        {/* Status bar */}
        <div className="status-bar">
          <span className="status-bar-text">
            Data loaded
            {uploadedAt && <span>— uploaded {formatDate(uploadedAt)}</span>}
            <span>· {facilityCount()} facilities · {tankCount} tank records</span>
          </span>
          <button className="btn-accent" onClick={() => setShowUpload(true)}>
            Update Data
          </button>
        </div>

        {/* Search panel */}
        <SearchBar
          onSearch={handleSearch}
          onLocateMe={handleLocateMe}
          getUniqueValues={getUniqueValues}
        />

        {/* Results */}
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
