import React from 'react';

const SplashScreen = ({ fading }) => (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 9998,
    overflow: 'hidden',
    opacity: fading ? 0 : 1,
    transition: 'opacity 0.6s ease-out',
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
    boxSizing: 'border-box',
  }}>

    {/* Shield logo */}
    <div style={{ flexShrink: 0, padding: '16px 20px 0', textAlign: 'center' }}>
      <img
        src="./shield-logo.jpg"
        alt="Shield Environmental Associates"
        style={{ width: 170, maxWidth: '45vw', borderRadius: 8 }}
      />
    </div>

    {/* SVG scene — grows to fill space between logo and footer */}
    <div style={{ flex: '1 1 0', width: '100%', minHeight: 0, maxHeight: '65vh' }}>
      <svg
        viewBox="0 0 360 300"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Clip liquid to the horizontal pipe interior */}
          <clipPath id="hPipeClip">
            <rect x="148" y="153" width="64" height="6"/>
          </clipPath>
          {/* Clip drips to the vertical pipe */}
          <clipPath id="vPipeClip">
            <rect x="173" y="120" width="6" height="34"/>
          </clipPath>
          {/* Tank 1 body clip for shading strips */}
          <clipPath id="tank1Clip">
            <rect x="22" y="148" width="116" height="46"/>
          </clipPath>
          {/* Tank 2 body clip */}
          <clipPath id="tank2Clip">
            <rect x="222" y="148" width="116" height="46"/>
          </clipPath>
        </defs>

        {/* ── SKY / ABOVE GROUND ─────────────────────────── */}
        <rect x="0" y="0" width="360" height="112" fill="#ffffff"/>

        {/* Pump canopy */}
        <rect x="124" y="44" width="106" height="7" rx="2" fill="#7b241c"/>
        <rect x="142" y="44" width="7" height="12" fill="#7b241c"/>
        <rect x="205" y="44" width="7" height="12" fill="#7b241c"/>
        <rect x="122" y="50" width="110" height="4" rx="1" fill="#922b21"/>

        {/* Pump body */}
        <rect x="148" y="53" width="58" height="62" rx="5" fill="#c0392b"/>
        {/* Screen bezel */}
        <rect x="153" y="60" width="48" height="34" rx="3" fill="#ccd1d1"/>
        {/* Screen */}
        <rect x="156" y="63" width="42" height="28" rx="2" fill="#071a0e"/>
        <text x="177" y="74" textAnchor="middle" fill="#4ade80" fontSize="6" fontFamily="monospace">UNLEADED</text>
        <text x="177" y="84" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="monospace" fontWeight="bold">$3.45</text>
        {/* Pump brand stripe */}
        <rect x="148" y="94" width="58" height="8" fill="#e74c3c"/>
        {/* Pump base */}
        <rect x="148" y="112" width="58" height="5" rx="1" fill="#7b241c"/>

        {/* Nozzle arm */}
        <path d="M 206 77 Q 224 77 224 93 L 224 106" stroke="#808b96" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <rect x="221" y="104" width="7" height="13" rx="3" fill="#566573"/>

        {/* Vertical fill pipe stub above ground */}
        <rect x="173" y="115" width="7" height="8" fill="#5d4037"/>

        {/* Left vent pipe */}
        <rect x="60" y="82" width="5" height="30" fill="#78909c"/>
        <rect x="57" y="81" width="11" height="5" rx="1" fill="#607d8b"/>

        {/* Right vent pipe */}
        <rect x="293" y="77" width="5" height="35" fill="#78909c"/>
        <rect x="290" y="76" width="11" height="5" rx="1" fill="#607d8b"/>

        {/* Vapor – left vent, 2 staggered rings */}
        <circle cx="62" cy="79" r="2" fill="none" stroke="#a5d6a7" strokeWidth="1.2">
          <animate attributeName="r"   values="2;10"    dur="2.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0" dur="2.5s" repeatCount="indefinite"/>
          <animate attributeName="cy"  values="79;60"   dur="2.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="62" cy="79" r="2" fill="none" stroke="#a5d6a7" strokeWidth="1.2">
          <animate attributeName="r"   values="2;10"    dur="2.5s" begin="1.25s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0" dur="2.5s" begin="1.25s" repeatCount="indefinite"/>
          <animate attributeName="cy"  values="79;60"   dur="2.5s" begin="1.25s" repeatCount="indefinite"/>
        </circle>

        {/* Vapor – right vent */}
        <circle cx="295" cy="74" r="2" fill="none" stroke="#a5d6a7" strokeWidth="1.2">
          <animate attributeName="r"   values="2;10"    dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="cy"  values="74;55"   dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="295" cy="74" r="2" fill="none" stroke="#a5d6a7" strokeWidth="1.2">
          <animate attributeName="r"   values="2;10"    dur="3s" begin="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0" dur="3s" begin="1.5s" repeatCount="indefinite"/>
          <animate attributeName="cy"  values="74;55"   dur="3s" begin="1.5s" repeatCount="indefinite"/>
        </circle>

        {/* ── GROUND SURFACE ─────────────────────────────── */}
        {/* Concrete pad under pump */}
        <rect x="134" y="112" width="86" height="10" fill="#5d6d7e" opacity="0.3"/>
        {/* Topsoil band */}
        <rect x="0" y="112" width="360" height="6" fill="#2e7d32"/>
        <rect x="0" y="116" width="360" height="6" fill="#1b5e20"/>

        {/* Grass – left of pump */}
        {[14, 30, 46, 64, 82, 100, 118, 130].map((x, i) => (
          <g key={`gl${i}`}>
            <line x1={x}   y1="114" x2={x - 4} y2={101 + (i % 3) * 3} stroke="#4caf50" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1={x+5} y1="114" x2={x + 2} y2={98  + (i % 2) * 4} stroke="#388e3c" strokeWidth="1.8" strokeLinecap="round"/>
          </g>
        ))}
        {/* Grass – right of pump */}
        {[222, 240, 258, 275, 292, 310, 328, 346].map((x, i) => (
          <g key={`gr${i}`}>
            <line x1={x}   y1="114" x2={x - 4} y2={101 + (i % 3) * 3} stroke="#4caf50" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1={x+5} y1="114" x2={x + 2} y2={98  + (i % 2) * 4} stroke="#388e3c" strokeWidth="1.8" strokeLinecap="round"/>
          </g>
        ))}

        {/* ── UNDERGROUND FILL ───────────────────────────── */}
        <rect x="0" y="122" width="360" height="178" fill="#2c1a0a"/>

        {/* Soil pebbles / texture */}
        {[18,48,75,108,158,196,238,268,308,342].map((x, i) => (
          <circle key={`p${i}`} cx={x} cy={132 + (i % 4) * 11} r="1.6" fill="#5d3d1e" opacity="0.5"/>
        ))}
        <ellipse cx="38"  cy="146" rx="6"   ry="3.5" fill="#3d2a12" opacity="0.6"/>
        <ellipse cx="320" cy="140" rx="5.5" ry="3"   fill="#3d2a12" opacity="0.55"/>
        <ellipse cx="180" cy="210" rx="7"   ry="3.5" fill="#3d2a12" opacity="0.5"/>
        {/* Extra soil depth texture */}
        {[30,80,130,180,230,280,330].map((x,i) => (
          <circle key={`dp${i}`} cx={x} cy={220+(i%3)*18} r="1.5" fill="#5d3d1e" opacity="0.4"/>
        ))}
        <ellipse cx="70"  cy="250" rx="8" ry="4" fill="#3d2a12" opacity="0.45"/>
        <ellipse cx="290" cy="260" rx="7" ry="3.5" fill="#3d2a12" opacity="0.4"/>
        <ellipse cx="170" cy="275" rx="6" ry="3"   fill="#3d2a12" opacity="0.35"/>

        {/* ══ TANK 1 — horizontal fiberglass cylinder ════ */}
        {/*   Body: rounded rect representing cylinder side view   */}
        {/*   x=22..138, cy=171, height=46 → top=148, bot=194    */}

        {/* Drop shadow */}
        <rect x="26" y="152" width="116" height="46" rx="22" fill="#0d0704" opacity="0.5"/>

        {/* Main cylinder body – dark grey fiberglass */}
        <rect x="22" y="148" width="116" height="46" rx="22" fill="#455a64"/>

        {/* Metallic highlight band across top */}
        <rect x="22" y="148" width="116" height="12" rx="22" fill="#607d8b" clipPath="url(#tank1Clip)"/>
        {/* Subtle mid shine */}
        <rect x="30" y="152" width="100" height="5" rx="2" fill="#78909c" opacity="0.5"/>
        {/* Lower shadow band */}
        <rect x="22" y="182" width="116" height="12" rx="0" fill="#263238" clipPath="url(#tank1Clip)"/>

        {/* End caps – left ellipse */}
        <ellipse cx="22"  cy="171" rx="10" ry="23" fill="#546e7a"/>
        <ellipse cx="22"  cy="171" rx="6"  ry="17" fill="#607d8b" opacity="0.6"/>
        {/* End caps – right ellipse */}
        <ellipse cx="138" cy="171" rx="10" ry="23" fill="#37474f"/>
        <ellipse cx="138" cy="171" rx="6"  ry="17" fill="#455a64" opacity="0.5"/>

        {/* UST label stripe */}
        <rect x="50" y="162" width="68" height="18" rx="2" fill="#1a237e" opacity="0.85" clipPath="url(#tank1Clip)"/>
        <text x="84" y="172" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontFamily="monospace" fontWeight="bold">TANK 1</text>
        <text x="84" y="179" textAnchor="middle" fill="#c5cae9" fontSize="5.5" fontFamily="monospace">10,000 GAL</text>

        {/* Fiberglass wrap lines */}
        <line x1="40"  y1="148" x2="40"  y2="194" stroke="#546e7a" strokeWidth="0.8" opacity="0.4"/>
        <line x1="128" y1="148" x2="128" y2="194" stroke="#546e7a" strokeWidth="0.8" opacity="0.4"/>

        {/* Manhole / access riser on top */}
        <rect x="74" y="134" width="20" height="16" rx="3" fill="#455a64"/>
        <rect x="72" y="132" width="24" height="5"  rx="2" fill="#546e7a"/>
        <rect x="74" y="134" width="20" height="3"  rx="1" fill="#607d8b" opacity="0.6"/>

        {/* ══ TANK 2 — horizontal fiberglass cylinder ════ */}
        <rect x="226" y="152" width="116" height="46" rx="22" fill="#0d0704" opacity="0.5"/>
        <rect x="222" y="148" width="116" height="46" rx="22" fill="#455a64"/>
        <rect x="222" y="148" width="116" height="12" rx="22" fill="#607d8b" clipPath="url(#tank2Clip)"/>
        <rect x="230" y="152" width="100" height="5"  rx="2" fill="#78909c" opacity="0.5"/>
        <rect x="222" y="182" width="116" height="12" rx="0" fill="#263238" clipPath="url(#tank2Clip)"/>

        <ellipse cx="222" cy="171" rx="10" ry="23" fill="#546e7a"/>
        <ellipse cx="222" cy="171" rx="6"  ry="17" fill="#607d8b" opacity="0.6"/>
        <ellipse cx="338" cy="171" rx="10" ry="23" fill="#37474f"/>
        <ellipse cx="338" cy="171" rx="6"  ry="17" fill="#455a64" opacity="0.5"/>

        <rect x="250" y="162" width="68" height="18" rx="2" fill="#1a237e" opacity="0.85" clipPath="url(#tank2Clip)"/>
        <text x="284" y="172" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontFamily="monospace" fontWeight="bold">TANK 2</text>
        <text x="284" y="179" textAnchor="middle" fill="#c5cae9" fontSize="5.5" fontFamily="monospace">8,000 GAL</text>

        <line x1="240" y1="148" x2="240" y2="194" stroke="#546e7a" strokeWidth="0.8" opacity="0.4"/>
        <line x1="328" y1="148" x2="328" y2="194" stroke="#546e7a" strokeWidth="0.8" opacity="0.4"/>

        <rect x="274" y="134" width="20" height="16" rx="3" fill="#455a64"/>
        <rect x="272" y="132" width="24" height="5"  rx="2" fill="#546e7a"/>
        <rect x="274" y="134" width="20" height="3"  rx="1" fill="#607d8b" opacity="0.6"/>

        {/* ── PIPES ──────────────────────────────────────── */}
        {/* Horizontal product pipe between tanks */}
        <rect x="138" y="150" width="84" height="9" rx="3" fill="#3e2723"/>
        <rect x="138" y="151" width="84" height="3" fill="#6d4c41" opacity="0.45"/>

        {/* Vertical fill pipe underground */}
        <rect x="173" y="122" width="7" height="30" fill="#3e2723"/>
        <rect x="174" y="122" width="2.5" height="30" fill="#6d4c41" opacity="0.35"/>

        {/* Vent underground stubs */}
        <rect x="60"  y="122" width="5" height="20" fill="#546e7a" opacity="0.55"/>
        <rect x="293" y="122" width="5" height="20" fill="#546e7a" opacity="0.55"/>

        {/* ── ANIMATED LIQUID ────────────────────────────── */}
        {/* Horizontal flow – blob 1 */}
        <rect x="118" y="153" width="26" height="5" fill="#f59e0b" clipPath="url(#hPipeClip)">
          <animate attributeName="x" from="118" to="215" dur="2s" repeatCount="indefinite"/>
        </rect>
        {/* Horizontal flow – blob 2 (offset) */}
        <rect x="96" y="153" width="20" height="5" fill="#d97706" clipPath="url(#hPipeClip)" opacity="0.75">
          <animate attributeName="x" from="96" to="215" dur="2s" begin="0.7s" repeatCount="indefinite"/>
        </rect>

        {/* Vertical drip – drop 1 */}
        <circle cx="176" cy="124" r="3" fill="#f59e0b" clipPath="url(#vPipeClip)">
          <animate attributeName="cy" values="124;152" dur="1.1s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0.2"  dur="1.1s" repeatCount="indefinite"/>
        </circle>
        {/* Vertical drip – drop 2 (offset) */}
        <circle cx="176" cy="124" r="2.5" fill="#fbbf24" clipPath="url(#vPipeClip)" opacity="0.8">
          <animate attributeName="cy" values="124;152" dur="1.1s" begin="0.55s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0.1" dur="1.1s" begin="0.55s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>

    {/* Bottom info — pushed to bottom via marginTop auto */}
    <div style={{
      flexShrink: 0,
      padding: '12px 24px 20px',
      textAlign: 'center',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      <p style={{
        color: '#1a4a2e',
        fontSize: 13,
        margin: '0 0 8px',
        fontFamily: 'DM Sans, sans-serif',
        fontStyle: 'italic',
        letterSpacing: 0.2,
      }}>
        For all your environmental needs
      </p>
      <a href="tel:8592945155" style={{
        display: 'block',
        color: '#1a4a2e',
        fontSize: 17,
        fontWeight: 600,
        textDecoration: 'none',
        marginBottom: 5,
        fontFamily: 'DM Sans, sans-serif',
      }}>
        859-294-5155
      </a>
      <a
        href="https://www.shieldenv.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#1a4a2e',
          fontSize: 13,
          textDecoration: 'none',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        www.shieldenv.com
      </a>
    </div>
  </div>
);

export default SplashScreen;
