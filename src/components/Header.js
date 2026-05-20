import React, { useState, useRef, useEffect } from 'react';

const Header = ({ onUpdateData, onSignOut, onDeleteAccount, onAdmin, isAdmin }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleDeleteConfirm = () => {
    setConfirmDelete(false);
    setMenuOpen(false);
    onDeleteAccount();
  };

  return (
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
        <div className="header-menu" ref={menuRef}>
          <button
            className="btn-outline btn-outline--light header-btn header-menu-trigger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Account menu"
            aria-expanded={menuOpen}
          >
            ⚙
          </button>
          {menuOpen && (
            <div className="header-dropdown" role="menu">
              {isAdmin && onAdmin && (
                <button
                  className="header-dropdown-item"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); onAdmin(); }}
                >
                  Admin Panel
                </button>
              )}
              {onSignOut && (
                <button
                  className="header-dropdown-item"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); onSignOut(); }}
                >
                  Sign Out
                </button>
              )}
              {onDeleteAccount && (
                <button
                  className="header-dropdown-item header-dropdown-item--danger"
                  role="menuitem"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete Account
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="confirm-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <p className="confirm-title">Delete Account</p>
            <p className="confirm-body">
              This will permanently delete your account and all associated data. This cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="btn-outline" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleDeleteConfirm}>Delete Account</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
