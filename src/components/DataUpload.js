import React, { useState, useRef } from 'react';
import { getSheetNames, parseExcelFile } from '../utils/excelParser';

// ── Change the passcode here ───────────────────────────────────────────────
const UPLOAD_PASSCODE = 'shield2024';
// ──────────────────────────────────────────────────────────────────────────

// Steps: 'passcode' → 'upload' → 'sheet-select' → (loading) → 'done'
const STEPS = { PASSCODE: 'passcode', UPLOAD: 'upload', SHEET_SELECT: 'sheet-select' };

const DataUpload = ({ onDataLoaded, onCancel, requirePasscode = false }) => {
  const initialStep = requirePasscode ? STEPS.PASSCODE : STEPS.UPLOAD;

  const [step,           setStep]           = useState(initialStep);
  const [passcodeInput,  setPasscodeInput]  = useState('');
  const [passcodeError,  setPasscodeError]  = useState(false);
  const [dragOver,       setDragOver]       = useState(false);
  const [file,           setFile]           = useState(null);
  const [sheetNames,     setSheetNames]     = useState([]);
  const [tankSheet,      setTankSheet]      = useState('');
  const [ownerSheet,     setOwnerSheet]     = useState('');
  const [loading,        setLoading]        = useState(false);
  const [status,         setStatus]         = useState(null); // { type, message }

  const inputRef = useRef();

  // ── Step 1: Passcode ───────────────────────────────────────────────────────
  const handlePasscode = (e) => {
    e.preventDefault();
    if (passcodeInput === UPLOAD_PASSCODE) {
      setPasscodeError(false);
      setStep(STEPS.UPLOAD);
    } else {
      setPasscodeError(true);
      setPasscodeInput('');
    }
  };

  // ── Step 2: File selection → read sheet names ──────────────────────────────
  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;
    setLoading(true);
    setStatus(null);
    try {
      const names = await getSheetNames(selectedFile);
      setFile(selectedFile);
      setSheetNames(names);
      setTankSheet(names[0] || '');
      setOwnerSheet(names[1] || names[0] || '');
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

  // ── Step 3: Confirm sheets → parse ────────────────────────────────────────
  const handleConfirm = async () => {
    if (!tankSheet || !ownerSheet) return;
    setLoading(true);
    setStatus(null);
    try {
      const { tankData, ownerData } = await parseExcelFile(file, tankSheet, ownerSheet);
      const facilityCount = new Set(tankData.map((r) => r.AI_ID)).size;
      setStatus({
        type: 'success',
        message: `Loaded ${facilityCount} facilities across ${tankData.length} tanks`,
      });
      onDataLoaded({ tankData, ownerData });
    } catch (err) {
      setStatus({ type: 'error', message: `Failed to parse file: ${err.message}` });
      setStep(STEPS.UPLOAD); // let user try again
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="upload-card">

      {/* ── Passcode step ── */}
      {step === STEPS.PASSCODE && (
        <>
          <div className="upload-title">Enter Passcode</div>
          <p className="upload-subtitle">
            A passcode is required to update the data.
          </p>
          <form onSubmit={handlePasscode} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              className="form-input"
              type="password"
              placeholder="Passcode"
              value={passcodeInput}
              onChange={(e) => { setPasscodeInput(e.target.value); setPasscodeError(false); }}
              autoFocus
            />
            {passcodeError && (
              <p className="upload-error" style={{ marginTop: 0 }}>
                ⚠ Incorrect passcode. Please try again.
              </p>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              {onCancel && <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>}
              <button type="submit" className="btn-primary">Continue</button>
            </div>
          </form>
        </>
      )}

      {/* ── Upload / drop-zone step ── */}
      {step === STEPS.UPLOAD && (
        <>
          <div className="upload-title">Upload Quarterly Data</div>
          <p className="upload-subtitle">
            Select your Excel file. You'll confirm which sheet is which before it loads.
          </p>

          <div
            className={`drop-zone${dragOver ? ' drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <span className="drop-zone-icon">📂</span>
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

          {onCancel && (
            <div style={{ marginTop: 20 }}>
              <button className="btn-outline" onClick={onCancel}>Cancel</button>
            </div>
          )}
        </>
      )}

      {/* ── Sheet selection step ── */}
      {step === STEPS.SHEET_SELECT && (
        <>
          <div className="upload-title">Confirm Sheets</div>
          <p className="upload-subtitle">
            <strong style={{ color: 'var(--color-text)' }}>{file?.name}</strong> has{' '}
            {sheetNames.length} sheet{sheetNames.length !== 1 ? 's' : ''}. Select which sheet
            contains each type of data.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left', marginBottom: 24 }}>
            <div>
              <label className="section-label" style={{ display: 'block', marginBottom: 6 }}>
                Facility / Tank data sheet
              </label>
              <select
                className="form-select"
                value={tankSheet}
                onChange={(e) => setTankSheet(e.target.value)}
              >
                {sheetNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="section-label" style={{ display: 'block', marginBottom: 6 }}>
                Owner data sheet
              </label>
              <select
                className="form-select"
                value={ownerSheet}
                onChange={(e) => setOwnerSheet(e.target.value)}
              >
                {sheetNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {loading && <p style={{ color: 'var(--color-text-secondary)', marginBottom: 12 }}>Parsing data…</p>}
          {status?.type === 'success' && <p className="upload-success">✓ {status.message}</p>}
          {status?.type === 'error'   && <p className="upload-error">⚠ {status.message}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              className="btn-outline"
              onClick={() => { setStep(STEPS.UPLOAD); setFile(null); setSheetNames([]); setStatus(null); }}
            >
              ← Back
            </button>
            <button
              className="btn-primary"
              onClick={handleConfirm}
              disabled={loading || !tankSheet || !ownerSheet}
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
