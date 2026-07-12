// Shared badge/level data for the achievement + certificate flow.
// Single source of truth so the in-app achievement modal, the QR kiosk
// screen, and the standalone /certificate page (loaded fresh on a
// visitor's phone) all render an identical badge.

import familysearchLogo from '../../assets/familysearch-tree.svg';

export const BADGE_LEVELS = [5, 10, 25, 40, 56];

// FamilySearch certificate palette. White is the dominant surface, charcoal
// carries copy, and the supplied brand/accent colours are used sparingly.
export const FAMILYSEARCH_COLORS = {
  primary: "#87B940",
  ink: "#333331",
  taupe: "#9C947A",
  coral: "#F16458",
  blue: "#27C4F4",
  amber: "#FCB34B",
  lime: "#BFD730",
  plum: "#996799",
  white: "#FFFFFF",
};

// Short, formal level names used on the certificate + achievement modal.
export const LEVEL_NAMES = {
  5: "Curious Explorer",
  10: "Commonwealth Traveller",
  25: "Global Navigator",
  40: "World Voyager",
  56: "Golden Commonwealth Explorer",
};

export const BADGE_COLORS = {
  5: { primary: "#87B940", glow: "rgba(135, 185, 64, 0.6)" },
  10: { primary: "#BFD730", glow: "rgba(191, 215, 48, 0.56)" },
  25: { primary: "#F16458", glow: "rgba(241, 100, 88, 0.58)" },
  40: { primary: "#27C4F4", glow: "rgba(39, 196, 244, 0.58)" },
  56: { primary: "#996799", glow: "rgba(153, 103, 153, 0.64)" },
};

export const BADGE_ICONS = {
  5: ( // Curious Explorer - Gold Faceted Star
    <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cert-gold1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF9D4" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
        <linearGradient id="cert-gold2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E5C158" />
          <stop offset="100%" stopColor="#AA7C11" />
        </linearGradient>
        <linearGradient id="cert-gold3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A37A1A" />
          <stop offset="100%" stopColor="#624602" />
        </linearGradient>
        <linearGradient id="cert-gold4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF1A0" />
          <stop offset="100%" stopColor="#8C6615" />
        </linearGradient>
      </defs>
      <polygon points="50,5 60.6,35.4 92.8,36.1 67.1,55.6 76.5,86.4 50,68 23.5,86.4 32.9,55.6 7.2,36.1 39.4,35.4" fill="url(#cert-gold2)" stroke="#FFF9D4" strokeWidth="0.75" />
      <polygon points="50,5 50,50 39.4,35.4" fill="url(#cert-gold1)" />
      <polygon points="50,5 50,50 60.6,35.4" fill="url(#cert-gold4)" />
      <polygon points="92.8,36.1 50,50 60.6,35.4" fill="url(#cert-gold2)" />
      <polygon points="92.8,36.1 50,50 67.1,55.6" fill="url(#cert-gold3)" />
      <polygon points="76.5,86.4 50,50 67.1,55.6" fill="url(#cert-gold1)" />
      <polygon points="76.5,86.4 50,50 50,68" fill="url(#cert-gold4)" />
      <polygon points="23.5,86.4 50,50 50,68" fill="url(#cert-gold2)" />
      <polygon points="23.5,86.4 50,50 32.9,55.6" fill="url(#cert-gold3)" />
      <polygon points="7.2,36.1 50,50 32.9,55.6" fill="url(#cert-gold1)" />
      <polygon points="7.2,36.1 50,50 39.4,35.4" fill="url(#cert-gold4)" />
      <polygon points="50,5 60.6,35.4 92.8,36.1 67.1,55.6 76.5,86.4 50,68 23.5,86.4 32.9,55.6 7.2,36.1 39.4,35.4" fill="none" stroke="#FFE875" strokeWidth="0.4" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="1.5" fill="#FFFFFF" />
    </svg>
  ),
  10: ( // Commonwealth Traveller - Metallic Lime Circles
    <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cert-silverMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#CCCCCC" />
          <stop offset="50%" stopColor="#8E8E93" />
          <stop offset="75%" stopColor="#D1D1D6" />
          <stop offset="100%" stopColor="#AEAEB2" />
        </linearGradient>
        <linearGradient id="cert-limeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C0EB75" />
          <stop offset="100%" stopColor="#75A827" />
        </linearGradient>
        <linearGradient id="cert-darkMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#48484A" />
          <stop offset="100%" stopColor="#1C1C1E" />
        </linearGradient>
        <radialGradient id="cert-reflection" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#cert-silverMetal)" stroke="#AEAEB2" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="43" fill="url(#cert-darkMetal)" />
      <circle cx="50" cy="50" r="36" fill="url(#cert-limeGrad)" stroke="url(#cert-silverMetal)" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="26" fill="url(#cert-silverMetal)" stroke="#8E8E93" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="22" fill="url(#cert-darkMetal)" />
      <circle cx="50" cy="50" r="12" fill="url(#cert-silverMetal)" />
      <circle cx="50" cy="50" r="9" fill="url(#cert-reflection)" />
      <circle cx="50" cy="50" r="2.5" fill="#FFFFFF" opacity="0.9" />
    </svg>
  ),
  25: ( // Global Navigator - Silver Shield & Coral Rings
    <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cert-silverMetal25" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="30%" stopColor="#CCCCCC" />
          <stop offset="70%" stopColor="#8E8E93" />
          <stop offset="100%" stopColor="#D1D1D6" />
        </linearGradient>
        <linearGradient id="cert-coralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7A6E" />
          <stop offset="100%" stopColor="#D0453A" />
        </linearGradient>
        <linearGradient id="cert-shieldBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E5E5EA" />
          <stop offset="100%" stopColor="#AEAEB2" />
        </linearGradient>
      </defs>
      <path d="M 22 15 L 78 15 Q 82 15 82 20 L 82 72 Q 82 82 74 86 L 50 96 L 26 86 Q 18 82 18 72 L 18 20 Q 18 15 22 15 Z" fill="url(#cert-shieldBg)" stroke="url(#cert-silverMetal25)" strokeWidth="3" />
      <path d="M 24 17 L 76 17 Q 80 17 80 22 L 80 71 Q 80 80 72 84 L 50 93 L 28 84 Q 20 80 20 71 L 20 22 Q 20 17 24 17 Z" fill="none" stroke="#FFFFFF" strokeWidth="0.5" />
      <g opacity="0.9">
        <circle cx="41" cy="46" r="18" fill="url(#cert-coralGrad)" stroke="url(#cert-silverMetal25)" strokeWidth="1.5" />
        <circle cx="59" cy="46" r="18" fill="url(#cert-coralGrad)" stroke="url(#cert-silverMetal25)" strokeWidth="1.5" />
      </g>
      <path d="M 50 20 L 52 25 L 57 25 L 53 28 L 55 33 L 50 30 L 45 33 L 47 28 L 43 25 L 48 25 Z" fill="#FFD700" stroke="#B8860B" strokeWidth="0.5" />
    </svg>
  ),
  40: ( // World Voyager - Teal/Silver Split Hexagon
    <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cert-silverMetal40" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#AEAEB2" />
          <stop offset="100%" stopColor="#7E7E82" />
        </linearGradient>
        <linearGradient id="cert-tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5BE1F9" />
          <stop offset="100%" stopColor="#1E8B9E" />
        </linearGradient>
        <linearGradient id="cert-whiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E5E5EA" />
        </linearGradient>
      </defs>
      <polygon points="50,6 88.1,28 88.1,72 50,94 11.9,72 11.9,28" fill="url(#cert-silverMetal40)" />
      <polygon points="50,9 85.5,29.5 85.5,70.5 50,91 14.5,70.5 14.5,29.5" fill="#3A3A3C" />
      <path d="M 50 9 L 14.5 29.5 L 14.5 70.5 L 50 91 Z" fill="url(#cert-tealGrad)" />
      <path d="M 50 9 L 85.5 29.5 L 85.5 70.5 L 50 91 Z" fill="url(#cert-whiteGrad)" />
      <circle cx="50" cy="50" r="20" fill="none" stroke="url(#cert-silverMetal40)" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="15" fill="none" stroke="#FFFFFF" strokeWidth="0.5" />
      <line x1="50" y1="9" x2="50" y2="91" stroke="url(#cert-silverMetal40)" strokeWidth="1.5" />
    </svg>
  ),
  56: ( // Golden Commonwealth Explorer - Gold/Purple Emblem
    <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cert-goldGrad56" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE47E" />
          <stop offset="30%" stopColor="#E5B22D" />
          <stop offset="70%" stopColor="#B3861B" />
          <stop offset="100%" stopColor="#FFE47E" />
        </linearGradient>
        <linearGradient id="cert-purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C48BE0" />
          <stop offset="50%" stopColor="#8A42B5" />
          <stop offset="100%" stopColor="#4A156B" />
        </linearGradient>
        <linearGradient id="cert-metallicAccent" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#FFE066" />
          <stop offset="100%" stopColor="#9C7310" />
        </linearGradient>
      </defs>
      <polygon points="50,6 88.1,28 88.1,72 50,94 11.9,72 11.9,28" fill="url(#cert-goldGrad56)" />
      <polygon points="50,9 85.5,29.5 85.5,70.5 50,91 14.5,70.5 14.5,29.5" fill="url(#cert-purpleGrad)" />
      <path d="M 50 9 L 85.5 29.5 L 50 50 Z" fill="url(#cert-goldGrad56)" opacity="0.25" />
      <path d="M 85.5 70.5 L 50 91 L 50 50 Z" fill="url(#cert-goldGrad56)" opacity="0.2" />
      <path d="M 14.5 70.5 L 50 91 L 50 50 Z" fill="url(#cert-goldGrad56)" opacity="0.35" />
      <g transform="translate(15, 15) scale(0.7)">
        <path d="M50,5 L54,46 L50,50 L46,46 Z" fill="url(#cert-metallicAccent)" />
        <path d="M50,95 L54,54 L50,50 L46,54 Z" fill="url(#cert-goldGrad56)" />
        <path d="M5,50 L46,46 L50,50 L46,54 Z" fill="url(#cert-goldGrad56)" />
        <path d="M95,50 L54,46 L50,50 L54,54 Z" fill="url(#cert-metallicAccent)" />
        <circle cx="50" cy="50" r="5" fill="url(#cert-goldGrad56)" stroke="#FFFFFF" strokeWidth="0.5" />
      </g>
      <polygon points="50,11 83.5,30.5 83.5,69.5 50,89 16.5,69.5 16.5,30.5" fill="none" stroke="url(#cert-goldGrad56)" strokeWidth="0.75" />
    </svg>
  ),
};

export function getBadgeLevelForCount(count) {
  let level = null;
  BADGE_LEVELS.forEach((l) => {
    if (count >= l) level = l;
  });
  return level;
}

export const FAMILYSEARCH_LOGO_URL = familysearchLogo;
