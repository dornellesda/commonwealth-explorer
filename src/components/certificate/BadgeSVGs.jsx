import React from "react";

const dropShadowFilter = (
  <filter id="badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.4" />
  </filter>
);

const bevelFilter = (
  <filter id="badge-bevel" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
    <feOffset dx="-2" dy="-2" result="offsetBlur" />
    <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1" specularExponent="20" lightingColor="#ffffff" result="specOut">
      <fePointLight x="-50" y="-50" z="200" />
    </feSpecularLighting>
    <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
    <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
  </filter>
);

export const CuriousExplorerSVG = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      {dropShadowFilter}
      <linearGradient id="bronze-grad" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="50%" stopColor="#aa7c11" />
        <stop offset="100%" stopColor="#5c430a" />
      </linearGradient>
      <linearGradient id="bronze-light" x1="100" y1="0" x2="0" y2="100">
        <stop offset="0%" stopColor="#F3E5AB" />
        <stop offset="100%" stopColor="#aa7c11" />
      </linearGradient>
    </defs>
    <g filter="url(#badge-shadow)">
      {/* 8-point outer star */}
      <polygon points="50,5 60,35 90,35 65,55 75,85 50,65 25,85 35,55 10,35 40,35" fill="url(#bronze-grad)" />
      {/* 8-point inner offset star */}
      <polygon points="50,15 58,40 80,50 58,60 50,85 42,60 20,50 42,40" fill="url(#bronze-light)" />
      {/* Center compass ring */}
      <circle cx="50" cy="50" r="18" fill="#3a2a06" stroke="url(#bronze-grad)" strokeWidth="3" />
      {/* Compass needle */}
      <polygon points="50,28 55,50 50,72 45,50" fill="url(#bronze-light)" />
      <polygon points="28,50 50,45 72,50 50,55" fill="url(#bronze-grad)" />
      <circle cx="50" cy="50" r="4" fill="#F3E5AB" />
    </g>
  </svg>
);

export const CommonwealthTravellerSVG = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      {dropShadowFilter}
      <linearGradient id="silver-grad" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#E0E0E0" />
        <stop offset="50%" stopColor="#9E9E9E" />
        <stop offset="100%" stopColor="#424242" />
      </linearGradient>
      <radialGradient id="green-glow" cx="50" cy="50" r="50">
        <stop offset="70%" stopColor="#87B940" />
        <stop offset="100%" stopColor="#4a691f" />
      </radialGradient>
    </defs>
    <g filter="url(#badge-shadow)">
      <circle cx="50" cy="50" r="46" fill="#222" stroke="url(#silver-grad)" strokeWidth="4" />
      <circle cx="50" cy="50" r="36" fill="none" stroke="url(#green-glow)" strokeWidth="12" />
      <circle cx="50" cy="50" r="22" fill="none" stroke="url(#silver-grad)" strokeWidth="2" />
      {/* Spokes */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <line
          key={i}
          x1="50" y1="50"
          x2={50 + 36 * Math.cos((angle * Math.PI) / 180)}
          y2={50 + 36 * Math.sin((angle * Math.PI) / 180)}
          stroke="url(#silver-grad)" strokeWidth="3"
        />
      ))}
      <circle cx="50" cy="50" r="8" fill="url(#silver-grad)" />
      <circle cx="50" cy="50" r="3" fill="#222" />
    </g>
  </svg>
);

export const GlobalNavigatorSVG = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      {dropShadowFilter}
      <linearGradient id="blue-grad" x1="0" y1="0" x2="0" y2="100">
        <stop offset="0%" stopColor="#87CEEB" />
        <stop offset="100%" stopColor="#1C4B82" />
      </linearGradient>
      <linearGradient id="silver-grad2" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#F5F5F5" />
        <stop offset="50%" stopColor="#BDBDBD" />
        <stop offset="100%" stopColor="#616161" />
      </linearGradient>
    </defs>
    <g filter="url(#badge-shadow)">
      {/* Hexagon */}
      <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="url(#blue-grad)" stroke="url(#silver-grad2)" strokeWidth="5" strokeLinejoin="round" />
      {/* Inner Globe */}
      <circle cx="50" cy="50" r="30" fill="#112233" stroke="url(#silver-grad2)" strokeWidth="3" />
      <ellipse cx="50" cy="50" rx="12" ry="30" fill="none" stroke="url(#silver-grad2)" strokeWidth="2" />
      <ellipse cx="50" cy="50" rx="30" ry="12" fill="none" stroke="url(#silver-grad2)" strokeWidth="2" />
      <line x1="50" y1="20" x2="50" y2="80" stroke="url(#silver-grad2)" strokeWidth="2" />
      <line x1="20" y1="50" x2="80" y2="50" stroke="url(#silver-grad2)" strokeWidth="2" />
    </g>
  </svg>
);

export const WorldVoyagerSVG = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      {dropShadowFilter}
      <linearGradient id="red-grad" x1="0" y1="0" x2="0" y2="100">
        <stop offset="0%" stopColor="#D32F2F" />
        <stop offset="100%" stopColor="#7F0000" />
      </linearGradient>
      <linearGradient id="silver-grad3" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="50%" stopColor="#9E9E9E" />
        <stop offset="100%" stopColor="#424242" />
      </linearGradient>
    </defs>
    <g filter="url(#badge-shadow)">
      {/* Shield */}
      <path d="M 15 25 L 85 25 L 85 55 C 85 75 50 95 50 95 C 50 95 15 75 15 55 Z" fill="url(#red-grad)" stroke="url(#silver-grad3)" strokeWidth="5" strokeLinejoin="round" />
      
      {/* Crown sitting on top */}
      <path d="M 25 22 L 35 5 L 50 15 L 65 5 L 75 22 Z" fill="url(#silver-grad3)" />
      
      {/* Stars */}
      <polygon points="50,35 55,48 68,48 58,56 62,70 50,62 38,70 42,56 32,48 45,48" fill="url(#silver-grad3)" />
      <circle cx="50" cy="50" r="22" fill="none" stroke="url(#silver-grad3)" strokeWidth="2" opacity="0.5" />
    </g>
  </svg>
);

export const GoldenExplorerSVG = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      {dropShadowFilter}
      <linearGradient id="pure-gold" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#FFDF00" />
        <stop offset="30%" stopColor="#D4AF37" />
        <stop offset="70%" stopColor="#996515" />
        <stop offset="100%" stopColor="#4A3B00" />
      </linearGradient>
      <radialGradient id="gold-glow" cx="50" cy="50" r="50">
        <stop offset="0%" stopColor="#FFDF00" />
        <stop offset="100%" stopColor="#8A5A19" />
      </radialGradient>
    </defs>
    <g filter="url(#badge-shadow)">
      {/* Hexagon */}
      <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="url(#gold-glow)" stroke="url(#pure-gold)" strokeWidth="6" strokeLinejoin="round" />
      
      {/* Inner Globe elements */}
      <circle cx="50" cy="50" r="32" fill="#2C1A00" stroke="url(#pure-gold)" strokeWidth="3" />
      
      {/* Lat/Long Gold wireframe */}
      <ellipse cx="50" cy="50" rx="14" ry="32" fill="none" stroke="url(#pure-gold)" strokeWidth="2" />
      <ellipse cx="50" cy="50" rx="32" ry="14" fill="none" stroke="url(#pure-gold)" strokeWidth="2" />
      
      {/* Center Emblem */}
      <circle cx="50" cy="50" r="8" fill="url(#pure-gold)" />
      <polygon points="50,42 53,48 60,48 55,52 57,58 50,55 43,58 45,52 40,48 47,48" fill="#2C1A00" />
    </g>
  </svg>
);
