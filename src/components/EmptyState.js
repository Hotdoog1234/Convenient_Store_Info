import React from 'react';

const EmptyState = () => (
  <div className="empty-state">
    <span className="empty-state-icon">🔍</span>
    <h3 className="empty-state-title">Search the database</h3>
    <p className="empty-state-text">
      Select a category above, then enter a search term or choose a value from the
      dropdown to find Kentucky UST facilities and tank details.
    </p>
  </div>
);

export default EmptyState;
