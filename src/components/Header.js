import React from 'react';

const Header = ({ onUpdateData, onSignOut }) => (
  <header className="header">
    <img
      src={`${process.env.PUBLIC_URL}/shield-logo.jpg`}
      alt="Shield Environmental Associates logo"
      className="header-logo"
    />
    <span className="header-title">
      Shield Environmental Associates<br />KY Convenience Store Information
    </span>
    <span className="header-spacer" />
    {onUpdateData && (
      <button className="btn-accent" onClick={onUpdateData}>
        Update Data
      </button>
    )}
    {onSignOut && (
      <button className="btn-outline btn-outline--light" onClick={onSignOut}>
        Sign Out
      </button>
    )}
  </header>
);

export default Header;
