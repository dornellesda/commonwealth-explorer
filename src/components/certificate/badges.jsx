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

const BADGE_ICON_PATHS = {
  5: "/badges/curious-explorer.svg",
  10: "/badges/commonwealth-traveller.svg",
  25: "/badges/global-navigator.svg",
  40: "/badges/world-voyager.svg",
  56: "/badges/golden-commonwealth-explorer.svg",
};

const BADGE_ICON_STYLE = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "contain",
};

export const BADGE_ICONS = Object.fromEntries(
  Object.entries(BADGE_ICON_PATHS).map(([level, src]) => [
    level,
    <img src={src} alt="" aria-hidden="true" style={BADGE_ICON_STYLE} />,
  ])
);

export function getBadgeLevelForCount(count) {
  let level = null;
  BADGE_LEVELS.forEach((l) => {
    if (count >= l) level = l;
  });
  return level;
}

export const FAMILYSEARCH_LOGO_URL = familysearchLogo;
