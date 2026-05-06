import React, { useState } from 'react';
import OwnerModal from './OwnerModal';
import { formatMiles } from '../utils/geoDistance';
import { TANK_STATUS_LABELS } from '../utils/tankStatusLabels';

const TANK_FIELDS = [
  'SUBJECT_ITEM_ID',
  'COMPARTMENT_NUMBER',
  'TANK_SUBSTANCE_CODE',
  'CAPACITY_MSR',
  'TANK_STATUS_CODE',
  'TANK_INSTALL_DATE',
  'TEMP_CLOSE_DATE',
  'LAST_CONT_PRODUCT_DATE',
  'CLOSED_IN_PLACE_DATE',
  'REMOVAL_DATE',
  'SERVICE_CHANGE_DATE',
  'TANK_MATERIAL_CODE',
  'TANK_EXT_CORR_PROTECT_CODE',
  'LAST_CP_TEST_DATE',
  'TANK_MANUFCTR_CODE',
  'TANK_RELEASE_DETECT_CODE',
  'LAST_TANK_TEST_DATE',
  'PIPE_MATERIAL_CODE',
  'PIPE_EXT_CORR_PROTECT_CODE',
  'PIPE_TYPE_CODE',
  'LINE_LEAK_DETECT_CODE',
];

// Use the shared label map (imported above)
const STATUS_LABELS = TANK_STATUS_LABELS;

const DATE_FIELDS = new Set([
  'TANK_INSTALL_DATE', 'TEMP_CLOSE_DATE', 'LAST_CONT_PRODUCT_DATE',
  'CLOSED_IN_PLACE_DATE', 'REMOVAL_DATE', 'SERVICE_CHANGE_DATE',
  'LAST_CP_TEST_DATE', 'LAST_TANK_TEST_DATE',
]);

// Excel serial dates count days from Dec 30 1899 (accounts for Excel's leap-year bug).
// If the value is already a string date, return it unchanged.
const formatCellValue = (field, value) => {
  if (value == null || value === '') return 'N/A';
  if (!DATE_FIELDS.has(field)) return value;
  const num = Number(value);
  if (isNaN(num) || !Number.isInteger(num) || num <= 0) return value;
  const date = new Date(Date.UTC(1899, 11, 30) + num * 86400000);
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${m}/${d}/${date.getUTCFullYear()}`;
};

const label = (field) => field.replace(/_/g, ' ');

const buildStatusSummary = (tanks) => {
  const counts = {};
  tanks.forEach((tank) => {
    const code = tank.TANK_STATUS_CODE?.trim();
    if (!code) return;
    const name = STATUS_LABELS[code] || code;
    counts[name] = (counts[name] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1]) // most common first
    .map(([name, n]) => `${n} ${name}`)
    .join(', ');
};

const FacilityCard = ({ facility, tanks, findOwner, distanceMiles }) => {
  const [modalOwnerName, setModalOwnerName] = useState(null);

  const openMaps = () => {
    const lat = parseFloat(facility.LATITUDE);
    const lon = parseFloat(facility.LONGITUDE);
    if (!isNaN(lat) && !isNaN(lon)) {
      window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
    } else {
      alert('Location not available for this site.');
    }
  };

  const owner = modalOwnerName ? findOwner(modalOwnerName) : null;

  console.log('ADDRESS_1=' + facility.ADDRESS_1
    + ' | MAILING_ADDRESS_CITY=' + facility.MAILING_ADDRESS_CITY
    + ' | MAILING_ADDRESS_STATE=' + facility.MAILING_ADDRESS_STATE
    + ' | MAILING_ADDRESS_ZIP=' + facility.MAILING_ADDRESS_ZIP);

  const ACTIVE_CODES = new Set(['TAC', 'TTC']);
  const uniqueTankCount = new Set(
    tanks
      .filter((t) => ACTIVE_CODES.has(t.TANK_STATUS_CODE?.trim()))
      .map((t) => t.SUBJECT_ITEM_ID)
      .filter(Boolean)
  ).size;
  const statusSummary   = buildStatusSummary(tanks);

  return (
    <div className="card facility-card">
      <div className="facility-card-header">
        <div className="facility-name">{facility.AI_NAME || 'Unknown Facility'}</div>
        <div className="facility-id">AI ID: {facility.AI_ID}</div>
        <div className="facility-address">
          {[
            facility.ADDRESS_1,
            facility.MAILING_ADDRESS_CITY,
            [facility.MAILING_ADDRESS_STATE, facility.MAILING_ADDRESS_ZIP]
              .filter(Boolean).join(' '),
          ].filter(Boolean).join(', ')}
        </div>
        <div className="facility-meta">
          {facility.COUNTY && (
            <span className="county-badge">{facility.COUNTY}</span>
          )}
          {distanceMiles != null && (
            <span className="distance-badge">📍 {formatMiles(distanceMiles)}</span>
          )}
          <button className="btn-outline" onClick={openMaps}>
            View on Google Maps
          </button>
        </div>
      </div>

      {/* ── Summary section ── */}
      <div className="facility-summary">
        <div className="facility-summary-item">
          <span className="section-label">Active / In-Service Tanks</span>
          <span className="facility-summary-value">{uniqueTankCount}</span>
        </div>
        <div className="facility-summary-item facility-summary-item--wide">
          <span className="section-label">Tank Status Summary</span>
          <span className="facility-summary-value">{statusSummary || '—'}</span>
        </div>
      </div>

      <div className="tank-table-wrap">
        <table className="tank-table">
          <tbody>
            {TANK_FIELDS.map((field) => (
              <tr key={field}>
                <th>{label(field)}</th>
                {tanks.map((tank, i) => (
                  <td key={i}>{formatCellValue(field, tank[field])}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th>OWNER NAME</th>
              {tanks.map((tank, i) => (
                <td key={i}>
                  <div className="owner-cell">
                    <span>{tank.OWNER_NAME || 'N/A'}</span>
                    {tank.OWNER_NAME && (
                      <button
                        className="btn-outline"
                        onClick={() => setModalOwnerName(tank.OWNER_NAME)}
                      >
                        View Owner Info
                      </button>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {modalOwnerName && (
        <OwnerModal
          owner={owner}
          ownerName={modalOwnerName}
          onClose={() => setModalOwnerName(null)}
        />
      )}
    </div>
  );
};

export default FacilityCard;
