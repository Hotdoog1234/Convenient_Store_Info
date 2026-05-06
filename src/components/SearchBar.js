import React, { useState, useEffect } from 'react';
import { getCurrentPosition } from '../utils/geoDistance';

const CATEGORIES = [
  { value: 'AI_NAME',    label: 'AI Name',  type: 'text' },
  { value: 'AI_ID',      label: 'AI ID',    type: 'text' },
  { value: 'ADDRESS_1',  label: 'Address',  type: 'text' },
  { value: 'COUNTY',     label: 'County',   type: 'dropdown' },
  { value: 'OWNER_NAME', label: 'Owner',    type: 'dropdown' },
];

const GEO_ERRORS = {
  1: 'Location access was denied. Please allow location in your browser settings.',
  2: 'Your location could not be determined.',
  3: 'Location request timed out.',
};

const SearchBar = ({ onSearch, onLocateMe, getUniqueValues }) => {
  const [category,   setCategory]   = useState('');
  const [term,       setTerm]       = useState('');
  const [options,    setOptions]    = useState([]);
  const [geoStatus,  setGeoStatus]  = useState('idle'); // 'idle' | 'loading' | 'error'
  const [geoError,   setGeoError]   = useState('');

  const selected = CATEGORIES.find((c) => c.value === category);

  useEffect(() => {
    setTerm('');
    if (selected?.type === 'dropdown') {
      setOptions(getUniqueValues(category));
    } else {
      setOptions([]);
    }
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e) => {
    e.preventDefault();
    if (category && term) onSearch(category, term);
  };

  const handleDropdownChange = (e) => {
    const val = e.target.value;
    setTerm(val);
    if (val) onSearch(category, val);
  };

  const handleLocate = async () => {
    setGeoStatus('loading');
    setGeoError('');
    try {
      const pos = await getCurrentPosition();
      setGeoStatus('idle');
      onLocateMe(pos.coords.latitude, pos.coords.longitude);
    } catch (err) {
      setGeoStatus('error');
      setGeoError(GEO_ERRORS[err.code] || 'Could not get your location.');
    }
  };

  return (
    <div className="card search-panel">
      <form onSubmit={handleSubmit}>
        <div className="search-row">
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">— Select category —</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {selected?.type === 'text' && (
            <>
              <input
                className="form-input"
                type="text"
                placeholder={`Search by ${selected.label}…`}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e); }}
              />
              <button type="submit" className="btn-primary">Search</button>
            </>
          )}

          {selected?.type === 'dropdown' && (
            <select
              className="form-select"
              value={term}
              onChange={handleDropdownChange}
            >
              <option value="">— Select {selected.label} —</option>
              {options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          )}

          <button
            type="button"
            className="btn-locate"
            onClick={handleLocate}
            disabled={geoStatus === 'loading'}
            title="Find 5 nearest facilities to my location"
          >
            {geoStatus === 'loading' ? '…' : '📍 Locate Me'}
          </button>
        </div>
      </form>

      {geoStatus === 'error' && (
        <p className="locate-error">{geoError}</p>
      )}
    </div>
  );
};

export default SearchBar;
