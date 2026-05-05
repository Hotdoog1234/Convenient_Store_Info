import React, { useState } from 'react';
import OwnerModal from './OwnerModal';

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

const label = (field) => field.replace(/_/g, ' ');

const FacilityCard = ({ facility, tanks, findOwner }) => {
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

  return (
    <div className="card facility-card">
      <div className="facility-card-header">
        <div className="facility-name">{facility.AI_NAME || 'Unknown Facility'}</div>
        <div className="facility-id">AI ID: {facility.AI_ID}</div>
        <div className="facility-address">
          {[
            facility.ADDRESS_1,
            facility.MAILING_ADDRESS_CITY,
            facility.MAILING_ADDRESS_STATE,
            facility.MAILING_ADDRESS_ZIP,
          ].filter(Boolean).join(', ')}
        </div>
        <div className="facility-meta">
          {facility.COUNTY && (
            <span className="county-badge">{facility.COUNTY}</span>
          )}
          <button className="btn-outline" onClick={openMaps}>
            View on Google Maps
          </button>
        </div>
      </div>

      <div className="tank-table-wrap">
        <table className="tank-table">
          <tbody>
            {TANK_FIELDS.map((field) => (
              <tr key={field}>
                <th>{label(field)}</th>
                {tanks.map((tank, i) => (
                  <td key={i}>{tank[field] != null && tank[field] !== '' ? tank[field] : 'N/A'}</td>
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
