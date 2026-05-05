import React from 'react';

const OwnerModal = ({ owner, ownerName, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      <h2 className="modal-title">Owner Information</h2>

      {owner ? (
        <>
          <div className="modal-field"><strong>Name</strong>{owner.OWNER_NAME || 'N/A'}</div>
          <div className="modal-field"><strong>Address</strong>{owner.OWNER_ADDR1 || 'N/A'}</div>
          <div className="modal-field"><strong>City</strong>{owner.OWNER_CITY || 'N/A'}</div>
          <div className="modal-field"><strong>State</strong>{owner.OWNER_STATE || 'N/A'}</div>
          <div className="modal-field"><strong>ZIP</strong>{owner.OWNER_ZIP || 'N/A'}</div>
          <div className="modal-field"><strong>Phone</strong>{owner.OWNER_PHONE || 'N/A'}</div>
        </>
      ) : (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
          Owner information not available{ownerName ? ` for "${ownerName}"` : ''}.
        </p>
      )}

      <div className="modal-actions">
        <button className="btn-primary" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

export default OwnerModal;
