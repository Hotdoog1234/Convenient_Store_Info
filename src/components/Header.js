import React from 'react';

const Header = ({ onUpdateData, onSignOut, onAdmin, isAdmin }) => (
  <header className="header">
    <img
      src={`${process.env.PUBLIC_URL}/shield-logo.jpg`}
      alt="Shield Environmental Associates logo"
      className="header-logo"
    />
    <span className="header-title">
      <span className="header-title-full">Shield Environmental Associates</span>
      <span className="header-title-short">Shield UST App</span>
    </span>
    <span className="header-spacer" />
    <div className="header-actions">
      {onUpdateData && (
        <button className="btn-accent header-btn" onClick={onUpdateData}>
          <span className="header-btn-label">Update Data</span>
          <span className="header-btn-icon">↑</span>
        </button>
      )}
      {isAdmin && onAdmin && (
        <button className="btn-outline btn-outline--light header-btn" onClick={onAdmin}>
          <span className="header-btn-label">Admin</span>
          <span className="header-btn-icon">⚙</span>
        </button>
      )}
      {onSignOut && (
        <button className="btn-outline btn-outline--light header-btn" onClick={onSignOut}>
          <span className="header-btn-label">Sign Out</span>
          <span className="header-btn-icon">⏏</span>
        </button>
      )}
    </div>
  </header>
);

export default Header;
