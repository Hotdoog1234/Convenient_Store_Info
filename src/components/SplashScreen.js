import React from 'react';

const SplashScreen = ({ fading }) => (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: '#1a4a2e',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 9998,
    overflow: 'hidden',
    opacity: fading ? 0 : 1,
    transition: 'opacity 0.6s ease-out',
    paddingTop: 'env(safe-area-inset-top)',
    boxSizing: 'border-box',
  }}>

    {/* Shield logo */}
    <div style={{ flexShrink: 0, padding: '28px 20px 8px', textAlign: 'center' }}>
      <img
        src="./shield-logo.jpg"
        alt="Shield Environmental Associates"
        style={{ width: 195, maxWidth: '52vw', borderRadius: 8 }}
      />
    </div>

    {/* Animated UST scene */}
    <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
      <svg
        viewBox="0 0 360 240"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="splashHPipe">
            <rect x="147" y="158" width="66" height="5"/>
          </clipPath>
          <clipPath id="splashVPipe">
            <rect x="173" y="128" width="5" height="30"/>
          </clipPath>
        </defs>

        {/* ── ABOVE GROUND ───────────────────────────────── */}
        <rect x="0" y="0" width="360" height="120" fill="#1a4a2e"/>

        {/* Pump canopy */}
        <rect x="126" y="48" width="102" height="6" rx="2" fill="#96281b"/>
        <rect x="144" y="48" width="6" height="10" fill="#922b21"/>
        <rect x="206" y="48" width="6" height="10" fill="#922b21"/>

        {/* Pump body */}
        <rect x="148" y="56" width="58" height="64" rx="5" fill="#c0392b"/>
        <rect x="154" y="63" width="46" height="33" rx="3" fill="#d5dbdb"/>
        <rect x="157" y="66" width="40" height="27" rx="2" fill="#0a2e1a"/>
        <text x="177" y="77" textAnchor="middle" fill="#4ade80" fontSize="6.5" fontFamily="monospace">UNLEADED</text>
        <text x="177" y="87" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace" fontWeight="bold">$3.45</text>
        <rect x="148" y="96" width="58" height="7" fill="#e74c3c"/>

        {/* Nozzle + hose */}
        <path d="M 206 80 Q 222 80 222 96 L 222 108" stroke="#7f8c8d" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <rect x="219" y="106" width="7" height="14" rx="3" fill="#5d6d7e"/>
        <path d="M 206 100 Q 215 100 215 108" stroke="#5d6d7e" strokeWidth="2.5" fill="none"/>

        {/* Pump base plate */}
        <rect x="148" y="118" width="58" height="4" rx="1" fill="#96281b"/>

        {/* Vertical fill pipe above-ground stub */}
        <rect x="173" y="118" width="7" height="12" fill="#4e342e"/>

        {/* Left monitoring vent */}
        <rect x="64" y="88" width="5" height="32" fill="#78909c"/>
        <rect x="61" y="87" width="11" height="4" rx="1" fill="#78909c"/>

        {/* Right monitoring vent */}
        <rect x="291" y="83" width="5" height="37" fill="#78909c"/>
        <rect x="288" y="82" width="11" height="4" rx="1" fill="#78909c"/>

        {/* Vapor rings – left vent (two staggered) */}
        <circle cx="66" cy="85" r="2" fill="none" stroke="#a5d6a7" strokeWidth="1.2">
          <animate attributeName="r" values="2;9" dur="2.4s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0" dur="2.4s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="85;68" dur="2.4s" repeatCount="indefinite"/>
        </circle>
        <circle cx="66" cy="85" r="2" fill="none" stroke="#a5d6a7" strokeWidth="1.2">
          <animate attributeName="r" values="2;9" dur="2.4s" begin="1.2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0" dur="2.4s" begin="1.2s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="85;68" dur="2.4s" begin="1.2s" repeatCount="indefinite"/>
        </circle>

        {/* Vapor rings – right vent */}
        <circle cx="293" cy="80" r="2" fill="none" stroke="#a5d6a7" strokeWidth="1.2">
          <animate attributeName="r" values="2;9" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="80;63" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="293" cy="80" r="2" fill="none" stroke="#a5d6a7" strokeWidth="1.2">
          <animate attributeName="r" values="2;9" dur="3s" begin="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0" dur="3s" begin="1.5s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="80;63" dur="3s" begin="1.5s" repeatCount="indefinite"/>
        </circle>

        {/* ── GROUND SURFACE ─────────────────────────────── */}
        <rect x="135" y="118" width="84" height="10" fill="#546e7a" opacity="0.35"/>
        <rect x="0" y="118" width="360" height="6" fill="#33691e"/>
        <rect x="0" y="121" width="360" height="7" fill="#1b5e20"/>

        {/* Grass – left of pump */}
        {[16, 32, 50, 68, 88, 106, 122, 133].map((x, i) => (
          <g key={`gl${i}`}>
            <line x1={x} y1="120" x2={x - 4} y2={107 + (i % 3) * 3} stroke="#4caf50" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1={x + 5} y1="120" x2={x + 3} y2={104 + (i % 2) * 4} stroke="#388e3c" strokeWidth="1.8" strokeLinecap="round"/>
          </g>
        ))}
        {/* Grass – right of pump */}
        {[224, 242, 260, 278, 296, 314, 332, 348].map((x, i) => (
          <g key={`gr${i}`}>
            <line x1={x} y1="120" x2={x - 4} y2={107 + (i % 3) * 3} stroke="#4caf50" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1={x + 5} y1="120" x2={x + 3} y2={104 + (i % 2) * 4} stroke="#388e3c" strokeWidth="1.8" strokeLinecap="round"/>
          </g>
        ))}

        {/* ── UNDERGROUND ────────────────────────────────── */}
        <rect x="0" y="128" width="360" height="112" fill="#2c1a0a"/>

        {/* Soil texture */}
        {[22, 52, 78, 112, 162, 200, 242, 272, 312, 345].map((x, i) => (
          <circle key={`st${i}`} cx={x} cy={140 + (i % 4) * 12} r="1.8" fill="#5d3d1e" opacity="0.55"/>
        ))}
        <ellipse cx="40" cy="150" rx="7" ry="4" fill="#3d2a12" opacity="0.65"/>
        <ellipse cx="318" cy="145" rx="6" ry="3.5" fill="#3d2a12" opacity="0.6"/>
        <ellipse cx="185" cy="215" rx="8" ry="4" fill="#3d2a12" opacity="0.55"/>

        {/* ── TANK 1 ─────────────────────────────────────── */}
        <ellipse cx="87" cy="184" rx="63" ry="30" fill="#1a0d04" opacity="0.45"/>
        <ellipse cx="85" cy="180" rx="63" ry="29" fill="#4e342e"/>
        <ellipse cx="85" cy="169" rx="57" ry="19" fill="#5d4037"/>
        <path d="M 36 173 Q 85 166 134 173" stroke="#8d6e63" strokeWidth="1.5" fill="none" opacity="0.4"/>
        <text x="85" y="181" textAnchor="middle" fill="#d7ccc8" fontSize="7.5" fontFamily="DM Sans,sans-serif" fontWeight="600">TANK 1</text>
        <text x="85" y="191" textAnchor="middle" fill="#bcaaa4" fontSize="6" fontFamily="DM Sans,sans-serif">10,000 GAL</text>
        <ellipse cx="85" cy="153" rx="11" ry="5.5" fill="#3e2723" stroke="#6d4c41" strokeWidth="1.5"/>
        <ellipse cx="85" cy="152" rx="7" ry="3.5" fill="#4a3728"/>

        {/* ── TANK 2 ─────────────────────────────────────── */}
        <ellipse cx="277" cy="184" rx="63" ry="30" fill="#1a0d04" opacity="0.45"/>
        <ellipse cx="275" cy="180" rx="63" ry="29" fill="#4e342e"/>
        <ellipse cx="275" cy="169" rx="57" ry="19" fill="#5d4037"/>
        <path d="M 226 173 Q 275 166 324 173" stroke="#8d6e63" strokeWidth="1.5" fill="none" opacity="0.4"/>
        <text x="275" y="181" textAnchor="middle" fill="#d7ccc8" fontSize="7.5" fontFamily="DM Sans,sans-serif" fontWeight="600">TANK 2</text>
        <text x="275" y="191" textAnchor="middle" fill="#bcaaa4" fontSize="6" fontFamily="DM Sans,sans-serif">8,000 GAL</text>
        <ellipse cx="275" cy="153" rx="11" ry="5.5" fill="#3e2723" stroke="#6d4c41" strokeWidth="1.5"/>
        <ellipse cx="275" cy="152" rx="7" ry="3.5" fill="#4a3728"/>

        {/* ── PIPES ──────────────────────────────────────── */}
        {/* Horizontal product pipe */}
        <rect x="147" y="155" width="66" height="9" rx="2.5" fill="#3e2723"/>
        <rect x="147" y="156" width="66" height="3" fill="#6d4c41" opacity="0.4"/>

        {/* Vertical fill pipe underground */}
        <rect x="173" y="128" width="7" height="29" fill="#3e2723"/>
        <rect x="174" y="128" width="2.5" height="29" fill="#6d4c41" opacity="0.35"/>

        {/* Vent pipe underground stubs */}
        <rect x="64" y="128" width="5" height="22" fill="#546e7a" opacity="0.6"/>
        <rect x="291" y="128" width="5" height="22" fill="#546e7a" opacity="0.6"/>

        {/* ── ANIMATED LIQUID ────────────────────────────── */}
        {/* Horizontal flow – first blob */}
        <rect x="127" y="159" width="24" height="4" fill="#f59e0b" clipPath="url(#splashHPipe)">
          <animate attributeName="x" from="127" to="215" dur="1.9s" repeatCount="indefinite"/>
        </rect>
        {/* Horizontal flow – second blob (offset) */}
        <rect x="105" y="159" width="18" height="4" fill="#d97706" clipPath="url(#splashHPipe)" opacity="0.75">
          <animate attributeName="x" from="105" to="215" dur="1.9s" begin="0.65s" repeatCount="indefinite"/>
        </rect>

        {/* Vertical drip – first drop */}
        <circle cx="176" cy="130" r="3" fill="#f59e0b" clipPath="url(#splashVPipe)">
          <animate attributeName="cy" values="130;156" dur="1.1s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0.2" dur="1.1s" repeatCount="indefinite"/>
        </circle>
        {/* Vertical drip – second drop */}
        <circle cx="176" cy="130" r="2.5" fill="#fbbf24" clipPath="url(#splashVPipe)" opacity="0.85">
          <animate attributeName="cy" values="130;156" dur="1.1s" begin="0.55s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.85;0.1" dur="1.1s" begin="0.55s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>

    {/* Bottom info */}
    <div style={{
      flexShrink: 0,
      padding: '8px 20px calc(28px + env(safe-area-inset-bottom))',
      textAlign: 'center',
    }}>
      <p style={{
        color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: '0 0 10px',
        fontFamily: 'DM Sans, sans-serif', fontStyle: 'italic',
      }}>
        For all your environmental needs
      </p>
      <a href="tel:8592945155" style={{
        display: 'block', color: '#6ee7b7', fontSize: 16, fontWeight: 600,
        textDecoration: 'none', marginBottom: 6, fontFamily: 'DM Sans, sans-serif',
      }}>
        859-294-5155
      </a>
      <a href="https://www.shieldenv.com" target="_blank" rel="noopener noreferrer" style={{
        color: '#6ee7b7', fontSize: 13, textDecoration: 'none', fontFamily: 'DM Sans, sans-serif',
      }}>
        www.shieldenv.com
      </a>
    </div>
  </div>
);

export default SplashScreen;
