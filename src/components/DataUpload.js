import React, { useState, useRef } from 'react';
import { getSheetNames, parseSheet } from '../utils/excelParser';

// ── Change the passcode here ───────────────────────────────────────────────
const UPLOAD_PASSCODE = 'shield2024';
// ──────────────────────────────────────────────────────────────────────────

const STEPS = {
  PASSCODE:     'passcode',
  CHOOSE_TYPE:  'choose-type',
  UPLOAD:       'upload',
  SHEET_SELECT: 'sheet-select',
};

const TYPE_CONFIG = {
  tank: {
    label:       'Tank Data',
    icon:        '🛢️',
    description: 'Facility and tank records (one row per tank)',
    sheetLabel:  'Select the sheet containing facility / tank data',
    successMsg:  (rows, facs) => `Loaded ${facs} facilities · ${rows} tank records`,
  },
  owner: {
    label:       'Owner Data',
    icon:        '👤',
    description: 'Owner contact information',
    sheetLabel:  'Select the sheet containing owner data',
    successMsg:  (rows) => `Loaded ${rows} owner records`,
  },
};

const DataUpload = ({ onTankLoaded, onOwnerLoaded, onCancel, requirePasscode = false }) => {
  const initialStep = requirePasscode ? STEPS.PASSCODE : STEPS.CHOOSE_TYPE;

  const [step,          setStep]          = useState(initialStep);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [dataType,      setDataType]      = useState(null); // 'tank' | 'owner'
  const [dragOver,      setDragOver]      = useState(false);
  const [file,          setFile]          = useState(null);
  const [sheetNames,    setSheetNames]    = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [loading,       setLoading]       = useState(false);
  const [status,        setStatus]        = useState(null);

  const inputRef = useRef();
  const config = dataType ? TYPE_CONFIG[dataType] : null;

  // ── Step 1: Passcode ───────────────────────────────────────────────────────
  const handlePasscode = (e) => {
    e.preventDefault();
    if (passcodeInput === UPLOAD_PASSCODE) {
      setPasscodeError(false);
      setStep(STEPS.CHOOSE_TYPE);
    } else {
      setPasscodeError(true);
      setPasscodeInput('');
    }
  };

  // ── Step 2: Choose type ────────────────────────────────────────────────────
  const handleChooseType = (type) => {
    setDataType(type);
    setStatus(null);
    setStep(STEPS.UPLOAD);
  };

  // ── Step 3: File selection → read sheet names ──────────────────────────────
  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;
    setLoading(true);
    setStatus(null);
    try {
      const names = await getSheetNames(selectedFile);
      setFile(selectedFile);
      setSheetNames(names);
      setSelectedSheet(names[0] || '');
      setStep(STEPS.SHEET_SELECT);
    } catch (err) {
      setStatus({ type: 'error', message: `Could not read file: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Step 4: Confirm sheet → parse ─────────────────────────────────────────
  const handleConfirm = async () => {
    if (!selectedSheet) return;
    setLoading(true);
    setStatus(null);
    try {
      const rows = await parseSheet(file, selectedSheet);
      if (dataType === 'tank') {
        const facs = new Set(rows.map((r) => r.AI_ID)).size;
        setStatus({ type: 'success', message: config.successMsg(rows.length, facs) });
        onTankLoaded?.(rows);
      } else {
        setStatus({ type: 'success', message: config.successMsg(rows.length) });
        onOwnerLoaded?.(rows);
      }
    } catch (err) {
      setStatus({ type: 'error', message: `Failed to parse sheet: ${err.message}` });
      setStep(STEPS.UPLOAD);
    } finally {
      setLoading(false);
    }
  };

  const goBackToChoose = () => {
    setStep(STEPS.CHOOSE_TYPE);
    setDataType(null);
    setFile(null);
    setSheetNames([]);
    setStatus(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="upload-card">

      {/* ── Passcode ── */}
      {step === STEPS.PASSCODE && (
        <>
          <div className="upload-title">Enter Passcode</div>
          <p className="upload-subtitle">A passcode is required to update the data.</p>
          <form onSubmit={handlePasscode} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              className="form-input"
              type="password"
              placeholder="Passcode"
              value={passcodeInput}
              onChange={(e) => { setPasscodeInput(e.target.value); setPasscodeError(false); }}
              autoFocus
            />
            {passcodeError && <p className="upload-error" style={{ marginTop: 0 }}>⚠ Incorrect passcode.</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              {onCancel && <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>}
              <button type="submit" className="btn-primary">Continue</button>
            </div>
          </form>
        </>
      )}

      {/* ── Choose type ── */}
      {step === STEPS.CHOOSE_TYPE && (
        <>
          <div className="upload-title">What would you like to update?</div>
          <p className="upload-subtitle">Choose which dataset to upload. Each upload only replaces that dataset.</p>

          <div className="upload-type-grid">
            {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
              <button
                key={type}
                className="upload-type-btn"
                onClick={() => handleChooseType(type)}
              >
                <span className="upload-type-icon">{cfg.icon}</span>
                <span className="upload-type-label">{cfg.label}</span>
                <span className="upload-type-desc">{cfg.description}</span>
              </button>
            ))}
          </div>

          {onCancel && (
            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button className="btn-outline" onClick={onCancel}>Cancel</button>
            </div>
          )}
        </>
      )}

      {/* ── Drop zone ── */}
      {step === STEPS.UPLOAD && (
        <>
          <div className="upload-title">Upload {config.label}</div>
          <p className="upload-subtitle">{config.description}</p>

          <div
            className={`drop-zone${dragOver ? ' drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <span className="drop-zone-icon">{config.icon}</span>
            <div className="drop-zone-label">Drag & drop your .xlsx file here</div>
            <div className="drop-zone-hint">or click to browse files</div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {loading && <p style={{ color: 'var(--color-text-secondary)', marginTop: 12 }}>Reading file…</p>}
          {status?.type === 'error' && <p className="upload-error">⚠ {status.message}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 20 }}>
            <button className="btn-outline" onClick={goBackToChoose}>← Back</button>
            {onCancel && <button className="btn-outline" onClick={onCancel}>Cancel</button>}
          </div>
        </>
      )}

      {/* ── Sheet select ── */}
      {step === STEPS.SHEET_SELECT && (
        <>
          <div className="upload-title">Confirm Sheet</div>
          <p className="upload-subtitle">
            <strong style={{ color: 'var(--color-text)' }}>{file?.name}</strong> has{' '}
            {sheetNames.length} sheet{sheetNames.length !== 1 ? 's' : ''}.
          </p>

          <div style={{ textAlign: 'left', marginBottom: 24 }}>
            <label className="section-label" style={{ display: 'block', marginBottom: 6 }}>
              {config.sheetLabel}
            </label>
            <select
              className="form-select"
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
            >
              {sheetNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {loading && <p style={{ color: 'var(--color-text-secondary)', marginBottom: 12 }}>Parsing data…</p>}
          {status?.type === 'success' && <p className="upload-success">✓ {status.message}</p>}
          {status?.type === 'error'   && <p className="upload-error">⚠ {status.message}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            <button
              className="btn-outline"
              onClick={() => { setStep(STEPS.UPLOAD); setFile(null); setSheetNames([]); setStatus(null); }}
            >
              ← Back
            </button>
            <button
              className="btn-primary"
              onClick={handleConfirm}
              disabled={loading || !selectedSheet}
            >
              Load Data
            </button>
          </div>
        </>
      )}

    </div>
  );
};

export default DataUpload;
