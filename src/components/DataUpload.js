import React, { useState, useRef } from 'react';
import { parseExcelFile } from '../utils/excelParser';

const DataUpload = ({ onDataLoaded, onCancel }) => {
  const [dragOver, setDragOver] = useState(false);
  const [status,   setStatus]   = useState(null); // { type: 'success'|'error', message }
  const [loading,  setLoading]  = useState(false);
  const inputRef = useRef();

  const processFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    try {
      const { tankData, ownerData } = await parseExcelFile(file);
      const facilityCount = new Set(tankData.map((r) => r.AI_ID)).size;
      setStatus({
        type: 'success',
        message: `Loaded ${facilityCount} facilities across ${tankData.length} tanks`,
      });
      onDataLoaded({ tankData, ownerData });
    } catch (err) {
      setStatus({ type: 'error', message: `Failed to parse file: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  return (
    <div className="upload-card">
      <div className="upload-title">Upload Quarterly Data</div>
      <p className="upload-subtitle">
        Upload the quarterly Excel file.<br />
        Sheet 1 = facility/tank data. Sheet 2 = owner data.
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
          onChange={handleFileInput}
        />
      </div>

      {loading && (
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 12 }}>
          Parsing file…
        </p>
      )}

      {status?.type === 'success' && (
        <p className="upload-success">✓ {status.message}</p>
      )}
      {status?.type === 'error' && (
        <p className="upload-error">⚠ {status.message}</p>
      )}

      {onCancel && (
        <div style={{ marginTop: 20 }}>
          <button className="btn-outline" onClick={onCancel}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default DataUpload;
