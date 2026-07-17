const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(process.cwd(), 'public/badges');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const SHARED_DEFS = `
  <defs>
    <filter id="ref-drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.4" />
    </filter>
    <filter id="ref-inner-bevel" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
      <feOffset dx="-1" dy="-1" result="offset" />
      <feComposite in="SourceAlpha" in2="offset" operator="arithmetic" k2="-1" k3="1" result="diff" />
      <feFlood flood-color="white" flood-opacity="0.4" result="flood" />
      <feComposite in="flood" in2="diff" operator="in" result="overlay" />
      <feMerge>
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="overlay" />
      </feMerge>
    </filter>

    <linearGradient id="bronze-star-light" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#C99863" />
      <stop offset="50%" stop-color="#A87543" />
      <stop offset="100%" stop-color="#7E5227" />
    </linearGradient>
    <linearGradient id="bronze-star-dark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8C5C32" />
      <stop offset="50%" stop-color="#633F1F" />
      <stop offset="100%" stop-color="#4A2D12" />
    </linearGradient>
    <linearGradient id="bronze-ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#A87543" />
      <stop offset="30%" stop-color="#C99863" />
      <stop offset="70%" stop-color="#633F1F" />
      <stop offset="100%" stop-color="#3B200A" />
    </linearGradient>

    <linearGradient id="gold-metallic" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFE082" />
      <stop offset="30%" stop-color="#FFD54F" />
      <stop offset="50%" stop-color="#FFC107" />
      <stop offset="85%" stop-color="#FF8F00" />
      <stop offset="100%" stop-color="#FF6F00" />
    </linearGradient>
    <linearGradient id="gold-metallic-light" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF9C4" />
      <stop offset="100%" stop-color="#FFE082" />
    </linearGradient>
    <linearGradient id="gold-metallic-dark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFB300" />
      <stop offset="100%" stop-color="#8D6E63" />
    </linearGradient>
    <linearGradient id="gold-border" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFF59D" />
      <stop offset="50%" stop-color="#FFB300" />
      <stop offset="100%" stop-color="#E65100" />
    </linearGradient>

    <linearGradient id="silver-metallic" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="30%" stop-color="#E0E0E0" />
      <stop offset="55%" stop-color="#9E9E9E" />
      <stop offset="85%" stop-color="#757575" />
      <stop offset="100%" stop-color="#424242" />
    </linearGradient>
    <linearGradient id="silver-border" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="50%" stop-color="#BDBDBD" />
      <stop offset="100%" stop-color="#616161" />
    </linearGradient>
    <linearGradient id="silver-light" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#E0E0E0" />
    </linearGradient>
    <linearGradient id="silver-dark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#BDBDBD" />
      <stop offset="100%" stop-color="#424242" />
    </linearGradient>

    <linearGradient id="purple-facet-top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8C6BB1" />
      <stop offset="100%" stop-color="#6A51A3" />
    </linearGradient>
    <linearGradient id="purple-facet-bottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4A1486" />
      <stop offset="100%" stop-color="#3F007D" />
    </linearGradient>
    <linearGradient id="purple-facet-left" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7A52B3" />
      <stop offset="100%" stop-color="#54278F" />
    </linearGradient>
    <linearGradient id="purple-facet-right" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0%" stop-color="#6A51A3" />
      <stop offset="100%" stop-color="#4A1486" />
    </linearGradient>
    <linearGradient id="purple-center" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#54278F" />
      <stop offset="100%" stop-color="#3F007D" />
    </linearGradient>

    <linearGradient id="blue-facet-top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E0F7FA" />
      <stop offset="100%" stop-color="#80DEEA" />
    </linearGradient>
    <linearGradient id="blue-facet-bottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#00838F" />
      <stop offset="100%" stop-color="#006064" />
    </linearGradient>
    <linearGradient id="blue-facet-left" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#B2EBF2" />
      <stop offset="100%" stop-color="#26C6DA" />
    </linearGradient>
    <linearGradient id="blue-facet-right" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0%" stop-color="#4DD0E1" />
      <stop offset="100%" stop-color="#0097A7" />
    </linearGradient>
    <linearGradient id="blue-center" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00ACC1" />
      <stop offset="100%" stop-color="#006064" />
    </linearGradient>

    <radialGradient id="enamel-red" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#D50000" />
      <stop offset="70%" stop-color="#9B0000" />
      <stop offset="100%" stop-color="#4A0000" />
    </radialGradient>

    <linearGradient id="enamel-green" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#CCFF33" />
      <stop offset="100%" stop-color="#7CB342" />
    </linearGradient>
  </defs>
`;

const getStar16Points = () => {
  const points = [];
  const cx = 50, cy = 50;
  for (let i = 0; i < 32; i++) {
    const angle = (i * Math.PI) / 16 - Math.PI / 2;
    let r = 26;
    if (i % 4 === 0) r = 46;
    else if (i % 2 === 0) r = 38;
    else r = 26;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return points.join(' ');
};

const getStar16Facets = () => {
  const cx = 50, cy = 50;
  let facetsStr = '';
  for (let idx = 0; idx < 16; idx++) {
    const a1 = ((idx * 2) * Math.PI) / 16 - Math.PI / 2;
    const aMid = ((idx * 2 + 1) * Math.PI) / 16 - Math.PI / 2;
    const a2 = (((idx + 1) * 2) * Math.PI) / 16 - Math.PI / 2;

    let rPeak = (idx % 2 === 0) ? 46 : 38;
    let rValley1 = 26;
    let rValley2 = 26;

    const p1 = `${cx + rValley1 * Math.cos(a1)},${cy + rValley1 * Math.sin(a1)}`;
    const pMid = `${cx + rPeak * Math.cos(aMid)},${cy + rPeak * Math.sin(aMid)}`;
    const p2 = `${cx + rValley2 * Math.cos(a2)},${cy + rValley2 * Math.sin(a2)}`;

    facetsStr += `
      <polygon points="50,50 ${p1} ${pMid}" fill="url(#bronze-star-light)" />
      <polygon points="50,50 ${pMid} ${p2}" fill="url(#bronze-star-dark)" />
    `;
  }
  return facetsStr;
};

const BADGES = {
  "curious-explorer": `
  <svg width="512" height="512" viewBox="-15 -15 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${SHARED_DEFS}
    <g filter="url(#ref-drop-shadow)">
      ${getStar16Facets()}
      <circle cx="50" cy="50" r="25" fill="url(#bronze-ring)" stroke="#3B200A" stroke-width="1" />
      <circle cx="50" cy="50" r="23" fill="#2E1908" stroke="url(#bronze-star-light)" stroke-width="1" />
      
      <!-- North -->
      <g transform="rotate(0 50 50)">
        <polygon points="50,50 46,50 50,28" fill="url(#bronze-star-light)" />
        <polygon points="50,50 54,50 50,28" fill="url(#bronze-star-dark)" />
      </g>
      <!-- East -->
      <g transform="rotate(90 50 50)">
        <polygon points="50,50 46,50 50,28" fill="url(#bronze-star-light)" />
        <polygon points="50,50 54,50 50,28" fill="url(#bronze-star-dark)" />
      </g>
      <!-- South -->
      <g transform="rotate(180 50 50)">
        <polygon points="50,50 46,50 50,28" fill="url(#bronze-star-light)" />
        <polygon points="50,50 54,50 50,28" fill="url(#bronze-star-dark)" />
      </g>
      <!-- West -->
      <g transform="rotate(270 50 50)">
        <polygon points="50,50 46,50 50,28" fill="url(#bronze-star-light)" />
        <polygon points="50,50 54,50 50,28" fill="url(#bronze-star-dark)" />
      </g>
      <!-- diagonals -->
      <g transform="rotate(45 50 50)">
        <polygon points="50,50 47,50 50,34" fill="url(#bronze-star-light)" />
        <polygon points="50,50 53,50 50,34" fill="url(#bronze-star-dark)" />
      </g>
      <g transform="rotate(135 50 50)">
        <polygon points="50,50 47,50 50,34" fill="url(#bronze-star-light)" />
        <polygon points="50,50 53,50 50,34" fill="url(#bronze-star-dark)" />
      </g>
      <g transform="rotate(225 50 50)">
        <polygon points="50,50 47,50 50,34" fill="url(#bronze-star-light)" />
        <polygon points="50,50 53,50 50,34" fill="url(#bronze-star-dark)" />
      </g>
      <g transform="rotate(315 50 50)">
        <polygon points="50,50 47,50 50,34" fill="url(#bronze-star-light)" />
        <polygon points="50,50 53,50 50,34" fill="url(#bronze-star-dark)" />
      </g>
      
      <circle cx="50" cy="50" r="4.5" fill="url(#bronze-star-light)" filter="url(#ref-inner-bevel)" />
      <circle cx="50" cy="50" r="1.5" fill="#3B200A" />
    </g>
  </svg>
  `,
  "commonwealth-traveller": `
  <svg width="512" height="512" viewBox="-15 -15 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${SHARED_DEFS}
    <g filter="url(#ref-drop-shadow)">
      <circle cx="50" cy="50" r="46" fill="url(#silver-metallic)" filter="url(#ref-inner-bevel)" stroke="#424242" stroke-width="1" />
      <circle cx="50" cy="50" r="41" fill="#111" />
      <circle cx="50" cy="50" r="39" fill="url(#silver-light)" />
      <circle cx="50" cy="50" r="34" fill="url(#enamel-green)" />
      
      <circle cx="50" cy="50" r="27" fill="#1F2529" stroke="url(#silver-metallic)" stroke-width="1.5" />
      <g stroke="url(#silver-metallic)" stroke-width="3" stroke-linecap="round">
        <line x1="50" y1="28" x2="50" y2="72" />
        <line x1="28" y1="50" x2="72" y2="50" />
        <line x1="34.4" y1="34.4" x2="65.6" y2="65.6" stroke-width="2.5" />
        <line x1="34.4" y1="65.6" x2="65.6" y2="34.4" stroke-width="2.5" />
      </g>
      <circle cx="50" cy="50" r="16" fill="none" stroke="url(#silver-metallic)" stroke-width="2.5" />
      
      <rect x="48" y="26" width="4" height="4" rx="1" fill="url(#silver-light)" stroke="#212121" stroke-width="0.5" />
      <rect x="70" y="48" width="4" height="4" rx="1" fill="url(#silver-light)" stroke="#212121" stroke-width="0.5" />
      <rect x="48" y="70" width="4" height="4" rx="1" fill="url(#silver-light)" stroke="#212121" stroke-width="0.5" />
      <rect x="26" y="48" width="4" height="4" rx="1" fill="url(#silver-light)" stroke="#212121" stroke-width="0.5" />
      <rect x="33" y="33" width="4" height="4" rx="1" fill="url(#silver-light)" stroke="#212121" stroke-width="0.5" />
      <rect x="63" y="33" width="4" height="4" rx="1" fill="url(#silver-light)" stroke="#212121" stroke-width="0.5" />
      <rect x="63" y="63" width="4" height="4" rx="1" fill="url(#silver-light)" stroke="#212121" stroke-width="0.5" />
      <rect x="33" y="63" width="4" height="4" rx="1" fill="url(#silver-light)" stroke="#212121" stroke-width="0.5" />

      <circle cx="50" cy="50" r="6" fill="url(#silver-light)" filter="url(#ref-inner-bevel)" stroke="#424242" stroke-width="0.5" />
      <circle cx="50" cy="50" r="2.5" fill="#1F2529" />
    </g>
  </svg>
  `,
  "global-navigator": `
  <svg width="512" height="512" viewBox="-15 -15 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${SHARED_DEFS}
    <g filter="url(#ref-drop-shadow)">
      <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="url(#silver-border)" filter="url(#ref-inner-bevel)" />
      
      <polygon points="50,8 77.7,24 90,27 50,4" fill="url(#blue-facet-top)" opacity="0.9" />
      <polygon points="77.7,24 77.7,56 90,73 90,27" fill="url(#blue-facet-right)" />
      <polygon points="77.7,56 50,72 50,96 90,73" fill="url(#blue-facet-bottom)" />
      <polygon points="50,72 22.3,56 10,73 50,96" fill="url(#blue-facet-bottom)" opacity="0.95" />
      <polygon points="22.3,56 22.3,24 10,27 10,73" fill="url(#blue-facet-left)" />
      <polygon points="22.3,24 50,8 50,4 10,27" fill="url(#blue-facet-top)" />
      <polygon points="50,8 77.7,24 77.7,56 50,72 22.3,56 22.3,24" fill="url(#blue-center)" />

      <circle cx="50" cy="50" r="26" fill="#0C202F" stroke="url(#silver-metallic)" stroke-width="3" />
      <circle cx="50" cy="50" r="20" fill="none" stroke="#ECEFF1" stroke-width="1.5" />
      <ellipse cx="50" cy="50" rx="9" ry="20" fill="none" stroke="#ECEFF1" stroke-width="1.5" />
      <ellipse cx="50" cy="50" rx="20" ry="9" fill="none" stroke="#ECEFF1" stroke-width="1.5" />
      <line x1="30" y1="50" x2="70" y2="50" stroke="#ECEFF1" stroke-width="1.5" />
      <line x1="50" y1="30" x2="50" y2="70" stroke="#ECEFF1" stroke-width="1.5" />
    </g>
  </svg>
  `,
  "world-voyager": `
  <svg width="512" height="512" viewBox="-15 -15 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${SHARED_DEFS}
    <g filter="url(#ref-drop-shadow)">
      <path d="M 12,24 C 12,24 35,24 50,18 C 65,24 88,24 88,24 L 88,60 C 88,80 50,96 50,96 C 50,96 12,80 12,60 Z" fill="url(#silver-border)" filter="url(#ref-inner-bevel)" />
      <path d="M 17,28 C 17,28 38,28 50,23 C 62,28 83,28 83,28 L 83,57 C 83,75 50,89 50,89 C 50,89 17,75 17,57 Z" fill="url(#silver-dark)" />
      <path d="M 19,30 C 19,30 38,30 50,25 C 62,30 82,30 82,30 L 82,56 C 82,73 50,87 50,87 C 50,87 19,73 19,56 Z" fill="url(#silver-light)" />
      
      <path d="M 28,21 L 34,7 L 50,16 L 66,7 L 72,21 Z" fill="url(#silver-metallic)" stroke="#424242" stroke-width="1" stroke-linejoin="round" />
      <rect x="32" y="19" width="36" height="3" fill="url(#silver-dark)" />
      
      <circle cx="50" cy="56" r="23" fill="url(#enamel-red)" stroke="url(#silver-border)" stroke-width="2" />
      
      <polygon points="50,56 50,38 54,52" fill="url(#silver-light)" />
      <polygon points="50,56 50,38 46,52" fill="url(#silver-dark)" />
      <polygon points="50,56 66,51 55,59" fill="url(#silver-light)" />
      <polygon points="50,56 66,51 54,52" fill="url(#silver-dark)" />
      <polygon points="50,56 60,69 50,61" fill="url(#silver-light)" />
      <polygon points="50,56 60,69 55,59" fill="url(#silver-dark)" />
      <polygon points="50,56 40,69 45,59" fill="url(#silver-light)" />
      <polygon points="50,56 40,69 50,61" fill="url(#silver-dark)" />
      <polygon points="50,56 34,51 46,52" fill="url(#silver-light)" />
      <polygon points="50,56 34,51 45,59" fill="url(#silver-dark)" />

      <!-- Top star -->
      <g transform="translate(0, -17) scale(0.4) translate(-75, -84)" opacity="0.9">
        <polygon points="50,56 50,38 54,52" fill="url(#silver-light)" />
        <polygon points="50,56 50,38 46,52" fill="url(#silver-dark)" />
        <polygon points="50,56 66,51 55,59" fill="url(#silver-light)" />
        <polygon points="50,56 66,51 54,52" fill="url(#silver-dark)" />
        <polygon points="50,56 60,69 50,61" fill="url(#silver-light)" />
        <polygon points="50,56 60,69 55,59" fill="url(#silver-dark)" />
        <polygon points="50,56 40,69 45,59" fill="url(#silver-light)" />
        <polygon points="50,56 40,69 50,61" fill="url(#silver-dark)" />
        <polygon points="50,56 34,51 46,52" fill="url(#silver-light)" />
        <polygon points="50,56 34,51 45,59" fill="url(#silver-dark)" />
      </g>
    </g>
  </svg>
  `,
  "golden-commonwealth-explorer": `
  <svg width="512" height="512" viewBox="-15 -15 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${SHARED_DEFS}
    <g filter="url(#ref-drop-shadow)">
      <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="url(#gold-border)" filter="url(#ref-inner-bevel)" />
      
      <polygon points="50,8 77.7,24 90,27 50,4" fill="url(#purple-facet-top)" opacity="0.9" />
      <polygon points="77.7,24 77.7,56 90,73 90,27" fill="url(#purple-facet-right)" />
      <polygon points="77.7,56 50,72 50,96 90,73" fill="url(#purple-facet-bottom)" />
      <polygon points="50,72 22.3,56 10,73 50,96" fill="url(#purple-facet-bottom)" opacity="0.95" />
      <polygon points="22.3,56 22.3,24 10,27 10,73" fill="url(#purple-facet-left)" />
      <polygon points="22.3,24 50,8 50,4 10,27" fill="url(#purple-facet-top)" />
      <polygon points="50,8 77.7,24 77.7,56 50,72 22.3,56 22.3,24" fill="url(#purple-center)" />

      <circle cx="50" cy="48" r="23" fill="none" stroke="url(#gold-metallic)" stroke-width="2.5" />
      <path d="M 33,54 Q 30,44 37,32 Q 44,25 45,26" fill="none" stroke="url(#gold-metallic)" stroke-width="1.5" />
      <path d="M 32,50 C 29,48 30,44 33,46 Z" fill="url(#gold-metallic)" />
      <path d="M 30,42 C 27,40 29,36 32,38 Z" fill="url(#gold-metallic)" />
      <path d="M 32,34 C 30,31 33,28 35,31 Z" fill="url(#gold-metallic)" />
      <path d="M 36,28 C 35,24 39,23 40,26 Z" fill="url(#gold-metallic)" />
      
      <path d="M 67,54 Q 70,44 63,32 Q 56,25 55,26" fill="none" stroke="url(#gold-metallic)" stroke-width="1.5" />
      <path d="M 68,50 C 71,48 70,44 67,46 Z" fill="url(#gold-metallic)" />
      <path d="M 70,42 C 73,40 71,36 68,38 Z" fill="url(#gold-metallic)" />
      <path d="M 68,34 C 70,31 67,28 65,31 Z" fill="url(#gold-metallic)" />
      <path d="M 64,28 C 65,24 61,23 60,26 Z" fill="url(#gold-metallic)" />

      <g>
        <polygon points="50,48 48,48 50,30" fill="url(#gold-metallic-light)" />
        <polygon points="50,48 52,48 50,30" fill="url(#gold-metallic-dark)" />
        <polygon points="50,48 50,46 68,48" fill="url(#gold-metallic-light)" />
        <polygon points="50,48 50,50 68,48" fill="url(#gold-metallic-dark)" />
        <polygon points="50,48 52,48 50,66" fill="url(#gold-metallic-light)" />
        <polygon points="50,48 48,48 50,66" fill="url(#gold-metallic-dark)" />
        <polygon points="50,48 50,50 32,48" fill="url(#gold-metallic-light)" />
        <polygon points="50,48 50,46 32,48" fill="url(#gold-metallic-dark)" />
      </g>
      <g transform="rotate(45 50 48)">
        <polygon points="50,48 48,48 50,34" fill="url(#gold-metallic-light)" />
        <polygon points="50,48 52,48 50,34" fill="url(#gold-metallic-dark)" />
        <polygon points="50,48 50,46 64,48" fill="url(#gold-metallic-light)" />
        <polygon points="50,48 50,50 64,48" fill="url(#gold-metallic-dark)" />
        <polygon points="50,48 52,48 50,62" fill="url(#gold-metallic-light)" />
        <polygon points="50,48 48,48 50,62" fill="url(#gold-metallic-dark)" />
        <polygon points="50,48 50,50 36,48" fill="url(#gold-metallic-light)" />
        <polygon points="50,48 50,46 36,48" fill="url(#gold-metallic-dark)" />
      </g>
      <circle cx="50" cy="48" r="1.5" fill="#FFE082" />
    </g>
  </svg>
  `
};

(async () => {
  for (const [name, svgStr] of Object.entries(BADGES)) {
    const pngPath = path.join(OUT_DIR, name + ".png");
    await sharp(Buffer.from(svgStr)).png().toFile(pngPath);
    console.log("Generated reference-identical PNG: " + pngPath);
  }
})();
