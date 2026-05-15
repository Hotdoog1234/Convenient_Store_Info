import React from 'react';

const SplashScreen = () => (
  <div className="splash-screen">
    <img
      src={`${process.env.PUBLIC_URL}/shield-logo.jpg`}
      alt="Shield Environmental Associates logo"
      className="splash-logo"
    />
    <h1 className="splash-title">Shield Environmental Associates</h1>
    <p className="splash-tagline">For all your environmental needs</p>
    <a href="tel:8592945155" className="splash-link">Call 859-294-5155</a>
    <a
      href="https://www.shieldenv.com"
      target="_blank"
      rel="noopener noreferrer"
      className="splash-link"
    >
      Visit us at www.shieldenv.com
    </a>
  </div>
);

export default SplashScreen;
