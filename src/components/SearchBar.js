import React, { useState, useEffect } from 'react';
import { getCurrentPosition } from '../utils/geoDistance';
import { TANK_STATUS_LABELS } from '../utils/tankStatusLabels';

const CATEGORIES = [
  { value: 'AI_NAME',           label: 'AI Name',              type: 'text'           },
  { value: 'AI_ID',             label: 'AI ID',                type: 'text'           },
  { value: 'ADDRESS_1',         label: 'Address',              type: 'text'           },
  { value: 'COUNTY',            label: 'County',               type: 'dropdown'       },
  { value: 'OWNER_NAME',        label: 'Owner',                type: 'owner-dual'     },
  { value: 'TANK_STATUS_CODE',  label: 'Tank Status',          type: 'status-only'    },
  { value: 'TANK_STATUS_COUNTY',label: 'Tank Status by County',type: 'status-county'  },
];

// Ordered dropdown options: "TAC — Active" etc.
const STATUS_OPTIONS = Object.entries(TANK_STATUS_LABELS).map(([code, desc]) => ({
  value: code,
  label: `${code} — ${desc}`,
}));

const GEO_ERRORS = {
  1: 'Location access was denied. Please allow location in your browser settings.',
  2: 'Your location could not be determined.',
  3: 'Location request timed out.',
};

const SearchBar = ({ onSearch, onLocateMe, getUniqueValues }) => {
  const [category,     setCategory]     = useState('');
  const [term,         setTerm]         = useState('');   // text / single dropdown
  const [countyOpts,   setCountyOpts]   = useState([]);
  const [ownerOpts,    setOwnerOpts]    = useState([]);
  const [ownerText,    setOwnerText]    = useState('');   // owner free-text input
  const [statusCode,   setStatusCode]   = useState('');   // for status-only / status-county
  const [countyTerm,   setCountyTerm]   = useState('');   // second term for status-county
  const [geoStatus,    setGeoStatus]    = useState('idle');
  const [geoError,     setGeoError]     = useState('');

  const selected = CATEGORIES.find((c) => c.value === category);

  // Reset all sub-state and pre-load dropdown options when category changes
  useEffect(() => {
    setTerm('');
    setOwnerText('');
    setStatusCode('');
    setCountyTerm('');

    const type = selected?.type;
    if (type === 'dropdown') {
      setCountyOpts(getUniqueValues(category));
    } else if (type === 'owner-dual') {
      setOwnerOpts(getUniqueValues('OWNER_NAME'));
    } else if (type === 'status-county') {
      setCountyOpts(getUniqueValues('COUNTY'));
    }
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (category && term) onSearch(category, term);
  };

  const handleDropdownChange = (val) => {
    setTerm(val);
    if (val) onSearch(category, val);
  };

  // Owner: free-text search
  const handleOwnerTextSubmit = (e) => {
    e.preventDefault();
    if (ownerText.trim()) onSearch('OWNER_NAME', ownerText.trim());
  };

  // Owner: browse-list dropdown (exact name → partial match finds it)
  const handleOwnerDropdown = (val) => {
    if (val) onSearch('OWNER_NAME', val);
  };

  // Tank Status (single)
  const handleStatusOnly = (code) => {
    setStatusCode(code);
    if (code) onSearch('TANK_STATUS_CODE', code);
  };

  // Tank Status by County — fire only when both are chosen
  const handleStatusCounty = (newCode, newCounty) => {
    const code   = newCode   ?? statusCode;
    const county = newCounty ?? countyTerm;
    if (newCode   !== undefined) setStatusCode(code);
    if (newCounty !== undefined) setCountyTerm(county);
    if (code && county) onSearch('TANK_STATUS_COUNTY', code, county);
  };

  // Geolocation
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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="card search-panel">
      <form onSubmit={handleTextSubmit}>
        <div className="search-row">

          {/* Category selector */}
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ maxWidth: 220 }}
          >
            <option value="">— Select category —</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* ── Text input (AI Name, AI ID, Address) ── */}
          {selected?.type === 'text' && (
            <>
              <input
                className="form-input"
                type="text"
                placeholder={`Search by ${selected.label}…`}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTextSubmit(e); }}
              />
              <button type="submit" className="btn-primary">Search</button>
            </>
          )}

          {/* ── County dropdown ── */}
          {selected?.type === 'dropdown' && (
            <select
              className="form-select"
              value={term}
              onChange={(e) => handleDropdownChange(e.target.value)}
            >
              <option value="">— Select County —</option>
              {countyOpts.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          )}

          {/* ── Owner: text search + browse dropdown side by side ── */}
          {selected?.type === 'owner-dual' && (
            <>
              <input
                className="form-input"
                type="text"
                placeholder="Search by owner name…"
                value={ownerText}
                onChange={(e) => setOwnerText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleOwnerTextSubmit(e); }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={handleOwnerTextSubmit}
              >
                Search
              </button>
              <select
                className="form-select"
                defaultValue=""
                onChange={(e) => handleOwnerDropdown(e.target.value)}
                title="Browse all owners"
                style={{ maxWidth: 200 }}
              >
                <option value="">Browse list…</option>
                {ownerOpts.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </>
          )}

          {/* ── Tank Status (single dropdown) ── */}
          {selected?.type === 'status-only' && (
            <select
              className="form-select"
              value={statusCode}
              onChange={(e) => handleStatusOnly(e.target.value)}
            >
              <option value="">— Select status —</option>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}

          {/* ── Tank Status by County (two dropdowns) ── */}
          {selected?.type === 'status-county' && (
            <>
              <select
                className="form-select"
                value={statusCode}
                onChange={(e) => handleStatusCounty(e.target.value, undefined)}
              >
                <option value="">— Select status —</option>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                className="form-select"
                value={countyTerm}
                onChange={(e) => handleStatusCounty(undefined, e.target.value)}
              >
                <option value="">— Select county —</option>
                {countyOpts.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </>
          )}

          {/* ── Locate Me ── */}
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

      {selected?.type === 'owner-dual' && (
        <p className="search-info-notice">
          Owner data may take a moment to load on first search. Please be patient.
        </p>
      )}
    </div>
  );
};

export default SearchBar;
