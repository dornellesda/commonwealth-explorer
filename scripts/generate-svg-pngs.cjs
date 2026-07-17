const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(process.cwd(), 'public/badges');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const SHARED_DEFS = `
  <defs>
    <filter id="apple-drop-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.5" />
    </filter>

    <linearGradient id="apple-gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFE57F" />
      <stop offset="30%" stop-color="#FFD54F" />
      <stop offset="70%" stop-color="#FFB300" />
      <stop offset="100%" stop-color="#B388FF" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="apple-gold-border" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFF9C4" />
      <stop offset="50%" stop-color="#FBC02D" />
      <stop offset="100%" stop-color="#F57F17" />
    </linearGradient>
    <linearGradient id="apple-gold-light" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF59D" />
      <stop offset="100%" stop-color="#FBC02D" />
    </linearGradient>
    <linearGradient id="apple-gold-dark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FBC02D" />
      <stop offset="100%" stop-color="#D84315" />
    </linearGradient>

    <linearGradient id="apple-silver" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="35%" stop-color="#E0E0E0" />
      <stop offset="70%" stop-color="#BDBDBD" />
      <stop offset="100%" stop-color="#757575" />
    </linearGradient>
    <linearGradient id="apple-silver-border" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="50%" stop-color="#BDBDBD" />
      <stop offset="100%" stop-color="#424242" />
    </linearGradient>
    <linearGradient id="apple-silver-light" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#E0E0E0" />
    </linearGradient>
    <linearGradient id="apple-silver-dark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#BDBDBD" />
      <stop offset="100%" stop-color="#616161" />
    </linearGradient>

    <linearGradient id="apple-bronze" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFE0B2" />
      <stop offset="50%" stop-color="#B87333" />
      <stop offset="100%" stop-color="#5D4037" />
    </linearGradient>
    <linearGradient id="apple-bronze-light" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFD180" />
      <stop offset="100%" stop-color="#B87333" />
    </linearGradient>
    <linearGradient id="apple-bronze-dark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#B87333" />
      <stop offset="100%" stop-color="#4E342E" />
    </linearGradient>

    <linearGradient id="apple-enamel-green" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#AEEA00" />
      <stop offset="100%" stop-color="#64DD17" />
    </linearGradient>
    <linearGradient id="apple-enamel-blue" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#00E5FF" />
      <stop offset="100%" stop-color="#2979FF" />
    </linearGradient>
    <linearGradient id="apple-enamel-red" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF1744" />
      <stop offset="100%" stop-color="#D50000" />
    </linearGradient>
    <linearGradient id="apple-enamel-orange" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF9100" />
      <stop offset="100%" stop-color="#FF3D00" />
    </linearGradient>

    <linearGradient id="apple-gloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0" />
    </linearGradient>
  </defs>
`;

const BADGES = {
  "curious-explorer": `
  <svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${SHARED_DEFS}
    <g filter="url(#apple-drop-shadow)">
      <polygon points="50,50 50,6 60.6,35.4" fill="url(#apple-gold-light)" />
      <polygon points="50,50 50,6 39.4,35.4" fill="url(#apple-gold-dark)" />
      
      <polygon points="50,50 91.8,36.4 67.1,55.6" fill="url(#apple-gold-light)" />
      <polygon points="50,50 91.8,36.4 60.6,35.4" fill="url(#apple-gold-dark)" />
      
      <polygon points="50,50 75.9,85.6 50,68" fill="url(#apple-gold-light)" />
      <polygon points="50,50 75.9,85.6 67.1,55.6" fill="url(#apple-gold-dark)" />
      
      <polygon points="50,50 24.1,85.6 32.9,55.6" fill="url(#apple-gold-light)" />
      <polygon points="50,50 24.1,85.6 50,68" fill="url(#apple-gold-dark)" />
      
      <polygon points="50,50 8.2,36.4 39.4,35.4" fill="url(#apple-gold-light)" />
      <polygon points="50,50 8.2,36.4 32.9,55.6" fill="url(#apple-gold-dark)" />

      <polygon points="50,6 91.8,36.4 75.9,85.6 24.1,85.6 8.2,36.4" fill="none" stroke="url(#apple-gold-border)" stroke-width="4" stroke-linejoin="round" />
      <polygon points="50,15 80,38 68,75 32,75 20,38" fill="none" stroke="url(#apple-gold-border)" stroke-width="2" stroke-linejoin="round" opacity="0.8" />
      <path d="M 8.2 36.4 A 44 44 0 0 1 91.8 36.4 A 44 25 0 0 0 8.2 36.4 Z" fill="url(#apple-gloss)" />
    </g>
  </svg>
  `,
  "commonwealth-traveller": `
  <svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${SHARED_DEFS}
    <g filter="url(#apple-drop-shadow)">
      <circle cx="50" cy="50" r="46" fill="url(#apple-silver)" stroke="url(#apple-silver-border)" stroke-width="3" />
      <circle cx="50" cy="50" r="37" fill="url(#apple-enamel-green)" />
      <circle cx="50" cy="50" r="28" fill="url(#apple-silver)" stroke="url(#apple-silver-border)" stroke-width="2.5" />
      <circle cx="50" cy="50" r="19" fill="url(#apple-enamel-green)" />
      <circle cx="50" cy="50" r="9" fill="url(#apple-silver)" stroke="url(#apple-silver-border)" stroke-width="1.5" />
      <circle cx="50" cy="50" r="3" fill="#111" />
      <path d="M 4 50 A 46 46 0 0 1 96 50 A 46 25 0 0 0 4 50 Z" fill="url(#apple-gloss)" />
    </g>
  </svg>
  `,
  "global-navigator": `
  <svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${SHARED_DEFS}
    <g filter="url(#apple-drop-shadow)">
      <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="url(#apple-silver)" stroke="url(#apple-silver-border)" stroke-width="4" stroke-linejoin="round" />
      <polygon points="50,9 86,30 86,70 50,91 14,70 14,30" fill="url(#apple-enamel-blue)" stroke="#000000" stroke-width="1.5" stroke-linejoin="round" />
      <g stroke="url(#apple-silver-border)" stroke-width="3.5" stroke-linecap="round" fill="none">
        <circle cx="50" cy="50" r="24" stroke-width="4" />
        <path d="M 26 50 L 74 50" />
        <path d="M 50 26 L 50 74" />
        <path d="M 33 33 Q 50 45 67 33" />
        <path d="M 33 67 Q 50 55 67 67" />
      </g>
      <path d="M 10 27 A 46 46 0 0 1 90 27 A 46 25 0 0 0 10 27 Z" fill="url(#apple-gloss)" />
    </g>
  </svg>
  `,
  "world-voyager": `
  <svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${SHARED_DEFS}
    <g filter="url(#apple-drop-shadow)">
      <path d="M 12,4 L 88,4 L 88,72 L 50,96 L 12,72 Z" fill="url(#apple-silver)" stroke="url(#apple-silver-border)" stroke-width="4" stroke-linejoin="round" />
      <path d="M 17,9 L 83,9 L 83,68 L 50,89 L 17,68 Z" fill="url(#apple-enamel-red)" stroke="#000000" stroke-width="1.5" stroke-linejoin="round" />
      <g stroke="url(#apple-silver-border)" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="50" cy="48" r="22" stroke-width="4" />
        <circle cx="50" cy="48" r="12" stroke-width="3" />
        <circle cx="50" cy="48" r="4" fill="url(#apple-silver-border)" stroke-width="1" />
        <path d="M 32,20 L 38,10 L 50,16 L 62,10 L 68,20 Z" stroke-width="3" fill="url(#apple-silver-light)" />
      </g>
      <path d="M 12 4 L 88 4 L 88 40 Q 50 50 12 40 Z" fill="url(#apple-gloss)" />
    </g>
  </svg>
  `,
  "golden-commonwealth-explorer": `
  <svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${SHARED_DEFS}
    <g filter="url(#apple-drop-shadow)">
      <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="url(#apple-gold)" stroke="url(#apple-gold-border)" stroke-width="4" stroke-linejoin="round" />
      <polygon points="50,9 86,30 86,70 50,91 14,70 14,30" fill="url(#apple-enamel-orange)" stroke="#000000" stroke-width="1.5" stroke-linejoin="round" />
      <g stroke="url(#apple-gold-border)" stroke-width="3.5" stroke-linecap="round" fill="none">
        <circle cx="50" cy="50" r="24" stroke-width="4" />
        <path d="M 26 50 L 74 50" />
        <path d="M 50 26 L 50 74" />
        <path d="M 33 33 Q 50 45 67 33" />
        <path d="M 33 67 Q 50 55 67 67" />
        <circle cx="50" cy="50" r="7" fill="url(#apple-gold-light)" stroke-width="1" />
      </g>
      <path d="M 10 27 A 46 46 0 0 1 90 27 A 46 25 0 0 0 10 27 Z" fill="url(#apple-gloss)" />
    </g>
  </svg>
  `
};

(async () => {
  for (const [name, svgStr] of Object.entries(BADGES)) {
    const pngPath = path.join(OUT_DIR, name + ".png");
    await sharp(Buffer.from(svgStr)).png().toFile(pngPath);
    console.log("Generated Apple-style SVG PNG: " + pngPath);
  }
})();
