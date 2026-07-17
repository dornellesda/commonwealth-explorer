const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(process.cwd(), 'public/badges');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// These SVGs exactly mirror the AAA SVGs in BadgeSVGs.jsx
const SHARED_DEFS = `
  <defs>
    <filter id="aaa-drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.6" />
    </filter>
    <filter id="aaa-contact-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.8" />
    </filter>
    <filter id="aaa-inner-bevel" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
      <feOffset dx="-2" dy="-2" in="blur" result="offset1" />
      <feComposite in="SourceAlpha" in2="offset1" operator="arithmetic" k2="-1" k3="1" result="highlight" />
      <feFlood flood-color="white" flood-opacity="0.7" result="highlightColor" />
      <feComposite in="highlightColor" in2="highlight" operator="in" result="highlightOverlay" />
      <feOffset dx="2" dy="2" in="blur" result="offset2" />
      <feComposite in="SourceAlpha" in2="offset2" operator="arithmetic" k2="-1" k3="1" result="shadow" />
      <feFlood flood-color="black" flood-opacity="0.7" result="shadowColor" />
      <feComposite in="shadowColor" in2="shadow" operator="in" result="shadowOverlay" />
      <feMerge>
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="shadowOverlay" />
        <feMergeNode in="highlightOverlay" />
      </feMerge>
    </filter>

    <linearGradient id="gold-base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF7B0" />
      <stop offset="20%" stop-color="#FFDF00" />
      <stop offset="50%" stop-color="#D4AF37" />
      <stop offset="80%" stop-color="#AA7C11" />
      <stop offset="100%" stop-color="#4A3B00" />
    </linearGradient>
    
    <linearGradient id="gold-highlight" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="30%" stop-color="#FFDF00" />
      <stop offset="70%" stop-color="#8A5A19" />
      <stop offset="100%" stop-color="#2A1A00" />
    </linearGradient>

    <linearGradient id="bronze-base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F3E5AB" />
      <stop offset="25%" stop-color="#CD7F32" />
      <stop offset="50%" stop-color="#8B4513" />
      <stop offset="75%" stop-color="#5C3A21" />
      <stop offset="100%" stop-color="#2A1B0B" />
    </linearGradient>
    
    <linearGradient id="bronze-highlight" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFEDCC" />
      <stop offset="30%" stop-color="#A0522D" />
      <stop offset="70%" stop-color="#6B4226" />
      <stop offset="100%" stop-color="#201000" />
    </linearGradient>

    <linearGradient id="silver-base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="30%" stop-color="#E0E0E0" />
      <stop offset="50%" stop-color="#9E9E9E" />
      <stop offset="80%" stop-color="#424242" />
      <stop offset="100%" stop-color="#111111" />
    </linearGradient>
    
    <linearGradient id="silver-highlight" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="20%" stop-color="#FAFAFA" />
      <stop offset="50%" stop-color="#757575" />
      <stop offset="100%" stop-color="#212121" />
    </linearGradient>
    
    <linearGradient id="silver-brushed" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#424242" />
      <stop offset="30%" stop-color="#EEEEEE" />
      <stop offset="70%" stop-color="#757575" />
      <stop offset="100%" stop-color="#F5F5F5" />
    </linearGradient>

    <radialGradient id="gem-blue" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#4FC3F7" />
      <stop offset="50%" stop-color="#0277BD" />
      <stop offset="100%" stop-color="#00223E" />
    </radialGradient>
    
    <radialGradient id="gem-green" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#B2FF59" />
      <stop offset="50%" stop-color="#558B2F" />
      <stop offset="100%" stop-color="#1B3B00" />
    </radialGradient>
    
    <radialGradient id="gem-red" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#FF5252" />
      <stop offset="50%" stop-color="#B71C1C" />
      <stop offset="100%" stop-color="#3E0000" />
    </radialGradient>
  </defs>
`;

const BADGES = {
  "curious-explorer": `
  <svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${SHARED_DEFS}
    <g filter="url(#aaa-drop-shadow)">
      <polygon points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30" fill="url(#bronze-base)" filter="url(#aaa-inner-bevel)" />
      <polygon points="32,10 68,10 90,32 90,68 68,90 32,90 10,68 10,32" fill="#1A1108" stroke="url(#bronze-highlight)" stroke-width="1.5" />
      <g filter="url(#aaa-contact-shadow)">
        <polygon points="50,10 62,38 90,38 68,55 78,85 50,65 22,85 32,55 10,38 38,38" fill="url(#bronze-highlight)" filter="url(#aaa-inner-bevel)" />
      </g>
      <polygon points="50,15 58,40 80,45 62,58 68,80 50,68 32,80 38,58 20,45 42,40" fill="url(#bronze-base)" filter="url(#aaa-inner-bevel)" />
      <circle cx="50" cy="50" r="18" fill="url(#gem-green)" filter="url(#aaa-contact-shadow)" />
      <circle cx="50" cy="50" r="18" fill="none" stroke="url(#bronze-highlight)" stroke-width="3" filter="url(#aaa-inner-bevel)" />
      <ellipse cx="44" cy="40" rx="6" ry="3" fill="#FFFFFF" opacity="0.6" transform="rotate(-30 44 40)" />
      <circle cx="50" cy="50" r="6" fill="url(#bronze-base)" filter="url(#aaa-inner-bevel)" />
    </g>
  </svg>
  `,
  "commonwealth-traveller": `
  <svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${SHARED_DEFS}
    <g filter="url(#aaa-drop-shadow)">
      <circle cx="50" cy="50" r="46" fill="url(#silver-brushed)" filter="url(#aaa-inner-bevel)" />
      <circle cx="50" cy="50" r="38" fill="#111" stroke="url(#silver-highlight)" stroke-width="2" />
      <circle cx="50" cy="50" r="36" fill="url(#gem-green)" />
      <g filter="url(#aaa-contact-shadow)">
        <circle cx="50" cy="50" r="26" fill="none" stroke="url(#silver-highlight)" stroke-width="4" filter="url(#aaa-inner-bevel)" />
        <line x1="14" y1="50" x2="86" y2="50" stroke="url(#silver-base)" stroke-width="4" filter="url(#aaa-inner-bevel)" />
        <line x1="50" y1="14" x2="50" y2="86" stroke="url(#silver-base)" stroke-width="4" filter="url(#aaa-inner-bevel)" />
        <line x1="24.54" y1="24.54" x2="75.46" y2="75.46" stroke="url(#silver-base)" stroke-width="4" filter="url(#aaa-inner-bevel)" />
        <line x1="24.54" y1="75.46" x2="75.46" y2="24.54" stroke="url(#silver-base)" stroke-width="4" filter="url(#aaa-inner-bevel)" />
      </g>
      <circle cx="50" cy="50" r="14" fill="url(#silver-highlight)" filter="url(#aaa-contact-shadow)" />
      <circle cx="50" cy="50" r="10" fill="url(#silver-brushed)" filter="url(#aaa-inner-bevel)" />
      <circle cx="46" cy="46" r="3" fill="#FFFFFF" opacity="0.7" />
    </g>
  </svg>
  `,
  "global-navigator": `
  <svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${SHARED_DEFS}
    <g filter="url(#aaa-drop-shadow)">
      <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="url(#silver-base)" filter="url(#aaa-inner-bevel)" />
      <polygon points="50,10 84,30 84,70 50,90 16,70 16,30" fill="#000814" stroke="url(#silver-highlight)" stroke-width="2" />
      <polygon points="50,12 82,31 82,69 50,88 18,69 18,31" fill="url(#gem-blue)" />
      <g filter="url(#aaa-contact-shadow)">
        <circle cx="50" cy="50" r="32" fill="#041A33" stroke="url(#silver-highlight)" stroke-width="4" filter="url(#aaa-inner-bevel)" />
        <ellipse cx="50" cy="50" rx="14" ry="32" fill="none" stroke="url(#silver-base)" stroke-width="2" />
        <ellipse cx="50" cy="50" rx="32" ry="14" fill="none" stroke="url(#silver-base)" stroke-width="2" />
        <line x1="50" y1="18" x2="50" y2="82" stroke="url(#silver-base)" stroke-width="2" />
        <line x1="18" y1="50" x2="82" y2="50" stroke="url(#silver-base)" stroke-width="2" />
      </g>
      <g filter="url(#aaa-contact-shadow)">
        <polygon points="50,25 55,50 50,75 45,50" fill="url(#silver-highlight)" filter="url(#aaa-inner-bevel)" />
        <polygon points="25,50 50,45 75,50 50,55" fill="url(#silver-brushed)" filter="url(#aaa-inner-bevel)" />
      </g>
      <circle cx="50" cy="50" r="5" fill="url(#silver-highlight)" filter="url(#aaa-inner-bevel)" />
    </g>
  </svg>
  `,
  "world-voyager": `
  <svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${SHARED_DEFS}
    <g filter="url(#aaa-drop-shadow)">
      <path d="M 10 25 L 90 25 L 90 55 C 90 85 50 98 50 98 C 50 98 10 85 10 55 Z" fill="url(#silver-brushed)" filter="url(#aaa-inner-bevel)" />
      <path d="M 16 30 L 84 30 L 84 55 C 84 80 50 91 50 91 C 50 91 16 80 16 55 Z" fill="#2A0000" stroke="url(#silver-highlight)" stroke-width="2" />
      <path d="M 18 32 L 82 32 L 82 55 C 82 78 50 88 50 88 C 50 88 18 78 18 55 Z" fill="url(#gem-red)" />
      <g filter="url(#aaa-contact-shadow)">
        <path d="M 22 26 L 28 8 L 40 20 L 50 5 L 60 20 L 72 8 L 78 26 Z" fill="url(#silver-highlight)" filter="url(#aaa-inner-bevel)" />
        <path d="M 26 28 L 74 28 L 72 32 L 28 32 Z" fill="url(#silver-base)" />
        <circle cx="28" cy="8" r="3" fill="url(#gem-blue)" filter="url(#aaa-inner-bevel)" />
        <circle cx="50" cy="5" r="3.5" fill="url(#gem-blue)" filter="url(#aaa-inner-bevel)" />
        <circle cx="72" cy="8" r="3" fill="url(#gem-blue)" filter="url(#aaa-inner-bevel)" />
      </g>
      <g filter="url(#aaa-contact-shadow)">
        <polygon points="50,42 56,58 72,58 60,68 64,84 50,74 36,84 40,68 28,58 44,58" fill="url(#silver-highlight)" filter="url(#aaa-inner-bevel)" />
        <polygon points="30,40 33,48 41,48 35,53 37,61 30,56 23,61 25,53 19,48 27,48" fill="url(#silver-base)" filter="url(#aaa-inner-bevel)" />
        <polygon points="70,40 73,48 81,48 75,53 77,61 70,56 63,61 65,53 59,48 67,48" fill="url(#silver-base)" filter="url(#aaa-inner-bevel)" />
      </g>
    </g>
  </svg>
  `,
  "golden-commonwealth-explorer": `
  <svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${SHARED_DEFS}
    <g filter="url(#aaa-drop-shadow)">
      <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="url(#gold-highlight)" filter="url(#aaa-inner-bevel)" />
      <polygon points="50,8 86,29 86,71 50,92 14,71 14,29" fill="url(#gold-base)" filter="url(#aaa-inner-bevel)" />
      <line x1="50" y1="12" x2="50" y2="88" stroke="url(#gold-highlight)" stroke-width="1" opacity="0.4" transform="rotate(0 50 50)" />
      <line x1="50" y1="12" x2="50" y2="88" stroke="url(#gold-highlight)" stroke-width="1" opacity="0.4" transform="rotate(30 50 50)" />
      <line x1="50" y1="12" x2="50" y2="88" stroke="url(#gold-highlight)" stroke-width="1" opacity="0.4" transform="rotate(60 50 50)" />
      <line x1="50" y1="12" x2="50" y2="88" stroke="url(#gold-highlight)" stroke-width="1" opacity="0.4" transform="rotate(90 50 50)" />
      <line x1="50" y1="12" x2="50" y2="88" stroke="url(#gold-highlight)" stroke-width="1" opacity="0.4" transform="rotate(120 50 50)" />
      <line x1="50" y1="12" x2="50" y2="88" stroke="url(#gold-highlight)" stroke-width="1" opacity="0.4" transform="rotate(150 50 50)" />
      <circle cx="50" cy="50" r="38" fill="#1A1100" stroke="url(#gold-base)" stroke-width="3" filter="url(#aaa-contact-shadow)" />
      <circle cx="50" cy="50" r="35" fill="url(#gold-base)" />
      <g filter="url(#aaa-contact-shadow)">
        <circle cx="50" cy="50" r="28" fill="#000000" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="url(#gold-highlight)" stroke-width="3" filter="url(#aaa-inner-bevel)" />
        <ellipse cx="50" cy="50" rx="12" ry="28" fill="none" stroke="url(#gold-base)" stroke-width="1.5" />
        <ellipse cx="50" cy="50" rx="28" ry="12" fill="none" stroke="url(#gold-base)" stroke-width="1.5" />
        <polygon points="50,34 54,44 64,44 56,50 59,60 50,54 41,60 44,50 36,44 46,44" fill="url(#gold-highlight)" filter="url(#aaa-inner-bevel)" />
        <circle cx="50" cy="50" r="6" fill="url(#gold-base)" filter="url(#aaa-inner-bevel)" />
        <circle cx="48" cy="48" r="2" fill="#FFFFFF" opacity="0.8" />
      </g>
    </g>
  </svg>
  `
};

(async () => {
  for (const [name, svgStr] of Object.entries(BADGES)) {
    const pngPath = path.join(OUT_DIR, name + ".png");
    await sharp(Buffer.from(svgStr)).png().toFile(pngPath);
    console.log("Generated AAA SVG PNG: " + pngPath);
  }
})();
