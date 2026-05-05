import React, { useState, useEffect } from 'react';

const CATEGORIES = [
  { value: 'AI_NAME',    label: 'AI Name',  type: 'text' },
  { value: 'AI_ID',      label: 'AI ID',    type: 'text' },
  { value: 'ADDRESS_1',  label: 'Address',  type: 'text' },
  { value: 'COUNTY',     label: 'County',   type: 'dropdown' },
  { value: 'OWNER_NAME', label: 'Owner',    type: 'dropdown' },
];

const SearchBar = ({ onSearch, getUniqueValues }) => {
  const [category, setCategory] = useState('');
  const [term,     setTerm]     = useState('');
  const [options,  setOptions]  = useState([]);

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
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
