import AppContext from './context/AppContext';
import UniversalDock from './components/Dock/UniversalDock';
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, useMap } from "react-leaflet";
import MapLibreMap from './components/MapLibreMap';
import AchievementModal from './components/certificate/AchievementModal';
import CertificateNameDialog from './components/certificate/CertificateNameDialog';
import CertificateQRCode from './components/certificate/CertificateQRCode';
import FamilySearchQrModal from './components/FamilySearchQrModal';
import { useWalletPass } from './hooks/useWalletPass';
import { LEVEL_NAMES, BADGE_ICONS } from './components/certificate/badges';
import { buildCertificateUrl } from './components/certificate/payload';
import countries from "./data/countries.json";
import countryResearchLinks from "./data/countryResearchLinks.json";
import commonwealthMetadata from "./data/commonwealthMetadata.json";
import countryDataBundle from "./data/country_data.json";
import countryStats from "./data/countryStats.json";
import countryMedia from "./data/media_data.json";
import "leaflet/dist/leaflet.css";
import "./App.css";
import familysearchLogo from './assets/familysearch-tree.svg';
import ukBoundaries from './data/uk_boundaries.json';

// Generate or retrieve stable explorer ID for wallet passes
function getOrCreateExplorerId() {
  const key = "ce_explorer_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    localStorage.setItem(key, id);
  }
  return id;
}

// Format population number (e.g., 5771000 → "5.8 million")
function formatPopulation(pop) {
  if (!pop || isNaN(pop)) return "Not available";
  const num = typeof pop === "string" ? parseInt(pop.replace(/,/g, "")) : pop;
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + " billion";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + " million";
  }
  if (num >= 1_000) {
    return num.toLocaleString();
  }
  return num.toString();
}

// ---------------------------------------------------------------------------
// Liquid-glass motion helpers
// ---------------------------------------------------------------------------
// A tiny imperative spring integrator (mass/stiffness/damping) so attract-mode
// elements can overshoot and settle the way real Apple UI moves, instead of
// riding a fixed-duration cubic-bezier to a hard stop. Values are written
// straight to element.style via rAF, matching the imperative pattern already
// used by AttractCountryPulse / AttractSeaRouteSwoosh below, so it stays just
// as cheap and doesn't fight React's own re-renders.
function animateSpring({
  from,
  to,
  stiffness = 210,
  damping = 22,
  mass = 1,
  precision = 0.001,
  onUpdate,
  onComplete,
}) {
  let position = from;
  let velocity = 0;
  let frameId = null;
  let lastTime = performance.now();

  const step = (now) => {
    const dt = Math.min(0.032, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;

    const springForce = -stiffness * (position - to);
    const dampingForce = -damping * velocity;
    velocity += ((springForce + dampingForce) / mass) * dt;
    position += velocity * dt;

    onUpdate(position);

    const settled = Math.abs(to - position) < precision && Math.abs(velocity) < precision;
    if (settled) {
      onUpdate(to);
      onComplete?.();
      return;
    }
    frameId = requestAnimationFrame(step);
  };

  frameId = requestAnimationFrame(step);
  return () => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
    }
  };
}

// Spawns a single "lensing" ripple at (x, y) inside `container` — the visual
// acknowledgment that glass is a physical surface reacting to touch. Cleans
// itself up after the CSS animation finishes so it never accumulates nodes.
function spawnGlassRipple(container, x, y) {
  if (!container) return;
  const ripple = document.createElement("span");
  ripple.className = "glass-ripple";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  container.appendChild(ripple);
  ripple.addEventListener(
    "animationend",
    () => {
      ripple.remove();
    },
    { once: true }
  );
}

const GEOJSON_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson";
const GEOJSON_FALLBACK_URLS = [
  GEOJSON_URL,
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_admin_0_countries.geojson",
];
const FAMILYSEARCH_LOGO_URL = familysearchLogo;
const MAP_BACKGROUND_ART_URL = "https://plus.unsplash.com/premium_photo-1779463020508-7cd254b1d37f?auto=format&fit=crop&w=2400&q=80";
const FAMILYSEARCH_COLLECTIONS_BASE_URL = "https://www.familysearch.org/search/collection/list";
const FAMILYSEARCH_FETCH_MIRROR_BASE_URL = "https://r.jina.ai/http://www.familysearch.org";
const FAMILYSEARCH_CACHE_STORAGE_KEY = "familySearchCollectionsCache:v9";
const FAMILYSEARCH_BROKEN_URLS_STORAGE_KEY = "familySearchBrokenUrls:v1";
const FAMILYSEARCH_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const FAMILYSEARCH_GENEALOGY_KEYWORD_REGEX = /\b(genealog(?:y|ies)|family\s*tree|lineage)\b/i;
const COUNTRY_MEDIA_BY_NAME = countryMedia;
const FAMILYSEARCH_LOCATION_URL_BY_COUNTRY = {
  "antigua and barbuda": "https://www.familysearch.org/en/search/location/caribbean-and-central-america/antigua-and-barbuda",
  australia: "https://www.familysearch.org/en/search/location/australia-&-new-zealand/australia",
  bahamas: "https://www.familysearch.org/en/search/location/caribbean-and-central-america/bahamas",
  "the bahamas": "https://www.familysearch.org/en/search/location/caribbean-and-central-america/bahamas",
  bangladesh: "https://www.familysearch.org/en/search/location/asia-&-middle-east/bangladesh",
  barbados: "https://www.familysearch.org/en/search/location/caribbean-and-central-america/barbados",
  belize: "https://www.familysearch.org/en/search/location/caribbean-and-central-america/belize",
  botswana: "https://www.familysearch.org/en/search/location/africa/botswana",
  brunei: "https://www.familysearch.org/en/search/location/asia-&-middle-east/brunei",
  "brunei darussalam": "https://www.familysearch.org/en/search/location/asia-&-middle-east/brunei",
  cameroon: "https://www.familysearch.org/en/search/location/africa/cameroon",
  canada: "https://www.familysearch.org/en/search/location/canada",
  cyprus: "https://www.familysearch.org/en/search/location/asia-&-middle-east/cyprus",
  dominica: "https://www.familysearch.org/en/search/location/caribbean-and-central-america/dominica",
  eswatini: "https://www.familysearch.org/en/search/location/africa/eswatini",
  fiji: "https://www.familysearch.org/en/search/location/pacific-islands/fiji",
  gabon: "https://www.familysearch.org/en/search/location/africa/gabon",
  gambia: "https://www.familysearch.org/en/search/location/africa/gambia",
  "the gambia": "https://www.familysearch.org/en/search/location/africa/gambia",
  ghana: "https://www.familysearch.org/en/search/location/africa/ghana",
  grenada: "https://www.familysearch.org/en/search/location/caribbean-and-central-america/grenada",
  guyana: "https://www.familysearch.org/en/search/location/south-america/guyana",
  india: "https://www.familysearch.org/en/search/location/asia-&-middle-east/india",
  jamaica: "https://www.familysearch.org/en/search/location/caribbean-and-central-america/jamaica",
  kenya: "https://www.familysearch.org/en/search/location/africa/kenya",
  kiribati: "https://www.familysearch.org/en/search/location/pacific-islands/kiribati",
  lesotho: "https://www.familysearch.org/en/search/location/africa/lesotho",
  malawi: "https://www.familysearch.org/en/search/location/africa/malawi",
  malaysia: "https://www.familysearch.org/en/search/location/asia-&-middle-east/malaysia",
  maldives: "https://www.familysearch.org/en/search/location/asia-&-middle-east/maldives",
  malta: "https://www.familysearch.org/en/search/location/continental-europe/malta",
  mauritius: "https://www.familysearch.org/en/search/location/africa/mauritius",
  mozambique: "https://www.familysearch.org/en/search/location/africa/mozambique",
  namibia: "https://www.familysearch.org/en/search/location/africa/namibia",
  nauru: "https://www.familysearch.org/en/search/location/pacific-islands/nauru",
  "new zealand": "https://www.familysearch.org/en/search/location/australia-&-new-zealand/new-zealand",
  nigeria: "https://www.familysearch.org/en/search/location/africa/nigeria",
  pakistan: "https://www.familysearch.org/en/search/location/asia-&-middle-east/pakistan",
  "papua new guinea": "https://www.familysearch.org/en/search/location/pacific-islands/papua-new-guinea",
  rwanda: "https://www.familysearch.org/en/search/location/africa/rwanda",
  "saint kitts and nevis": "https://www.familysearch.org/en/search/location/caribbean-and-central-america/saint-kitts-and-nevis",
  "st kitts and nevis": "https://www.familysearch.org/en/search/location/caribbean-and-central-america/saint-kitts-and-nevis",
  "saint lucia": "https://www.familysearch.org/en/search/location/caribbean-and-central-america/saint-lucia",
  "saint vincent and the grenadines": "https://www.familysearch.org/en/search/location/caribbean-and-central-america/saint-vincent-and-the-grenadines",
  "st vincent and the grenadines": "https://www.familysearch.org/en/search/location/caribbean-and-central-america/saint-vincent-and-the-grenadines",
  samoa: "https://www.familysearch.org/en/search/location/pacific-islands/samoa",
  seychelles: "https://www.familysearch.org/en/search/location/africa/seychelles",
  "sierra leone": "https://www.familysearch.org/en/search/location/africa/sierra-leone",
  singapore: "https://www.familysearch.org/en/search/location/asia-&-middle-east/singapore",
  "solomon islands": "https://www.familysearch.org/en/search/location/pacific-islands/solomon-islands",
  "south africa": "https://www.familysearch.org/en/search/location/africa/south-africa",
  "sri lanka": "https://www.familysearch.org/en/search/location/asia-&-middle-east/sri-lanka",
  tonga: "https://www.familysearch.org/en/search/location/pacific-islands/tonga",
  togo: "https://www.familysearch.org/en/search/location/africa/togo",
  "trinidad and tobago": "https://www.familysearch.org/en/search/location/caribbean-and-central-america/trinidad-and-tobago",
  tuvalu: "https://www.familysearch.org/en/search/location/pacific-islands/tuvalu",
  uganda: "https://www.familysearch.org/en/search/location/africa/uganda",
  "united kingdom": "https://www.familysearch.org/en/search/location/united-kingdom-and-ireland/england",
  england: "https://www.familysearch.org/en/search/location/united-kingdom-and-ireland/england",
  scotland: "https://www.familysearch.org/en/search/location/united-kingdom-and-ireland/scotland",
  wales: "https://www.familysearch.org/en/search/location/united-kingdom-and-ireland/wales",
  "northern ireland": "https://www.familysearch.org/en/search/location/united-kingdom-and-ireland/northern-ireland",
  "united republic of tanzania": "https://www.familysearch.org/en/search/location/africa/tanzania",
  vanuatu: "https://www.familysearch.org/en/search/location/pacific-islands/vanuatu",
  zambia: "https://www.familysearch.org/en/search/location/africa/zambia",
};
const FAMILYSEARCH_COLLECTION_SETTINGS_BY_COUNTRY = {
  "antigua and barbuda": { region: "Antigua and Barbuda", placeId: "1927106", regionGroup: "Caribbean and Central America" },
  australia: { region: "Australia", placeId: "1927080", regionGroup: "Australia & New Zealand" },
  "the bahamas": { region: "Bahamas", placeId: "1927082", regionGroup: "Caribbean and Central America" },
  bangladesh: { region: "Bangladesh" },
  barbados: { region: "Barbados", placeId: "1927094", regionGroup: "Caribbean and Central America" },
  belize: { region: "Belize" },
  botswana: { region: "Botswana" },
  "brunei darussalam": { region: "Brunei" },
  cameroon: { region: "Cameroon" },
  canada: { region: "Canada", placeId: "1927164", regionGroup: "Canada" },
  cyprus: { region: "Cyprus" },
  dominica: { region: "Dominica" },
  eswatini: { region: "Eswatini" },
  fiji: { region: "Fiji", placeId: "1927119", regionGroup: "Pacific Islands" },
  gabon: { region: "Gabon" },
  "the gambia": { region: "Gambia" },
  ghana: { region: "Ghana" },
  grenada: { region: "Grenada" },
  guyana: { region: "Guyana" },
  india: { region: "India" },
  jamaica: { region: "Jamaica" },
  kenya: { region: "Kenya" },
  kiribati: { region: "Kiribati" },
  lesotho: { region: "Lesotho" },
  malawi: { region: "Malawi" },
  malaysia: { region: "Malaysia" },
  maldives: { region: "Maldives" },
  malta: { region: "Malta" },
  mauritius: { region: "Mauritius" },
  mozambique: { region: "Mozambique" },
  namibia: { region: "Namibia" },
  nauru: { region: "Nauru" },
  "new zealand": { region: "New Zealand", placeId: "1927083", regionGroup: "Australia & New Zealand" },
  nigeria: { region: "Nigeria" },
  pakistan: { region: "Pakistan" },
  "papua new guinea": { region: "Papua New Guinea" },
  rwanda: { region: "Rwanda" },
  "st kitts and nevis": { region: "Saint Kitts and Nevis" },
  "saint lucia": { region: "Saint Lucia" },
  "st vincent and the grenadines": { region: "Saint Vincent and The Grenadines" },
  samoa: { region: "Samoa" },
  seychelles: { region: "Seychelles" },
  "sierra leone": { region: "Sierra Leone" },
  singapore: { region: "Singapore" },
  "solomon islands": { region: "Solomon Islands" },
  "south africa": { region: "South Africa" },
  "sri lanka": { region: "Sri Lanka" },
  tonga: { region: "Tonga" },
  togo: { region: "Togo" },
  "trinidad and tobago": { region: "Trinidad and Tobago" },
  tuvalu: { region: "Tuvalu" },
  uganda: { region: "Uganda" },
  "united kingdom": { region: "England", placeId: "1986340", regionGroup: "United Kingdom and Ireland" },
  england: { region: "England", placeId: "1986340", regionGroup: "United Kingdom and Ireland" },
  scotland: { region: "Scotland", placeId: "1986341", regionGroup: "United Kingdom and Ireland" },
  wales: { region: "Wales", placeId: "1986342", regionGroup: "United Kingdom and Ireland" },
  "united republic of tanzania": { region: "Tanzania" },
  vanuatu: { region: "Vanuatu" },
  zambia: { region: "Zambia" },
};
const COMMONWEALTH_VIEW = {
  center: [22, 25],
  zoom: 2.6,
};
const ATTRACT_MODE_VIEW = {
  center: [22, 25],
  zoom: 4.5,
};
const COMMONWEALTH_MAP_BOUNDS = [
  [-62, -178],
  [84, 178],
];
const COMMONWEALTH_MIN_ZOOM = 2.6;
const KIOSK_IDLE_TIMEOUT_MS = 120_000; // 2 minutes in milliseconds
const KIOSK_DOCK_SEARCH_IDLE_TIMEOUT_MS = 30_000;
const DOCK_SOFT_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DOCK_GENTLE_EASE = "cubic-bezier(0.2, 0.85, 0.24, 1)";
const EXHIBIT_TRANSITION_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const EXHIBIT_TRANSITION_MS = 420;

const ATTRACT_JOURNEY_SEQUENCE = [
  // Geographic storytelling path across the Commonwealth.
  "United Kingdom",
  "Canada",
  "The Bahamas",
  "Jamaica",
  "Trinidad and Tobago",
  "Ghana",
  "Kenya",
  "South Africa",
  "India",
  "Sri Lanka",
  "Singapore",
  "Malaysia",
  "Australia",
  "New Zealand",
  "Fiji",
  "Samoa",
  "Malta",
];

const ATTRACT_ROUTE_SEGMENTS = new Set([
  "United Kingdom|Canada",
  "Canada|The Bahamas",
  "Jamaica|Ghana",
  "Kenya|India",
  "India|Singapore",
  "Singapore|Australia",
  "Australia|New Zealand",
]);
const ATTRACT_ROUTE_CHANCE = 0.55;
const ATTRACT_ROUTE_MIN_GAP_STEPS = 2;
const ATTRACT_ARC_DURATION_MS = 10000;
const ATTRACT_ARC_BREATHE = true;
const ATTRACT_VISIBLE_ROUTE_MIN = 3;
const ATTRACT_VISIBLE_ROUTE_MAX = 5;
const ATTRACT_ROUTE_ROTATE_MS = 5200;
const ATTRACT_HERO_ROUTE_INTERVAL_MIN_MS = 15000;
const ATTRACT_HERO_ROUTE_INTERVAL_MAX_MS = 20000;
const ATTRACT_BASE_ARC_DURATION_MS = 16000;
const ATTRACT_HERO_ARC_DURATION_MS = 21000;
const ATTRACT_ROUTE_LIBRARY = [
  { from: "United Kingdom", to: "Canada" },
  { from: "India", to: "United Kingdom" },
  { from: "Nigeria", to: "Canada" },
  { from: "Australia", to: "New Zealand" },
  { from: "Jamaica", to: "United Kingdom" },
  { from: "Kenya", to: "United Kingdom" },
  { from: "South Africa", to: "Australia" },
  { from: "Pakistan", to: "United Kingdom" },
  { from: "Bangladesh", to: "United Kingdom" },
  { from: "Malaysia", to: "Australia" },
  { from: "Ghana", to: "Canada" },
  { from: "Trinidad and Tobago", to: "Canada" },
];
const ATTRACT_HERO_ROUTE_LIBRARY = [
  { from: "Scotland", to: "Australia" },
  { from: "India", to: "United Kingdom" },
  { from: "Nigeria", to: "Canada" },
  { from: "Jamaica", to: "United Kingdom" },
  { from: "United Kingdom", to: "New Zealand" },
];
const ATTRACT_CUSTOM_ROUTE_POINTS = {
  Scotland: [56.6, -4.2],
};
const MAP_HIGHLIGHT_TRANSITION_MS = 520;
const MAP_HIGHLIGHT_EASE = "cubic-bezier(0.2, 0.65, 0.25, 1)";
const UK_VOYAGER_COUNTRY_KEYS = new Set([
  "united kingdom",
  "england",
  "scotland",
  "wales",
  "northern ireland",
]);

const VOYAGER_TOTAL_COUNTRIES = new Set(
  countries.map((country) => getVoyagerCountryKey(country.name))
).size;

function getVoyagerTitle(visitedCount) {
  if (visitedCount >= 56) {
    return "Commonwealth Explorer";
  }

  if (visitedCount >= 40) {
    return "World Voyager";
  }

  if (visitedCount >= 25) {
    return "Global Navigator";
  }

  if (visitedCount >= 10) {
    return "Commonwealth Traveller";
  }

  if (visitedCount >= 5) {
    return "Curious Explorer";
  }

  return "Explorer";
}

function getVoyagerBadgeLevel(visitedCount = 0) {
  if (visitedCount >= 56) return 56;
  if (visitedCount >= 40) return 40;
  if (visitedCount >= 25) return 25;
  if (visitedCount >= 10) return 10;
  if (visitedCount >= 5) return 5;
  return null;
}

const countryZoomOverrides = {
  // Large countries: zoom 4-6
  "New Zealand": { center: [-41, 174], zoom: 5 },
  // Small island nations: zoom 6-7 for intimate experience
  Fiji: { center: [-17.8, 178], zoom: 6 },
  Tonga: { center: [-21.2, -175.2], zoom: 6 },
  Samoa: { center: [-13.8, -172.1], zoom: 6 },
  Vanuatu: { center: [-15.4, 166.9], zoom: 6 },
  Kiribati: { center: [1.3, 173], zoom: 5.2 },
  Tuvalu: { center: [-8.5, 179.2], zoom: 7 },
  Nauru: { center: [-0.5, 166.9], zoom: 7 },
  "Solomon Islands": { center: [-9.6, 160.2], zoom: 6 },
  "Papua New Guinea": { center: [-6.3, 147], zoom: 5.5 },
  Maldives: { center: [3.2, 73.2], zoom: 6.5 },
  Malta: { center: [35.9, 14.4], zoom: 7 },
  Seychelles: { center: [-4.7, 55.5], zoom: 6.5 },
  Mauritius: { center: [-20.3, 57.6], zoom: 6.5 },
  Singapore: { center: [1.35, 103.8], zoom: 7 },
  "Antigua and Barbuda": { center: [17.1, -61.8], zoom: 7 },
  Barbados: { center: [13.2, -59.5], zoom: 7 },
  Dominica: { center: [15.4, -61.4], zoom: 7 },
  Grenada: { center: [12.1, -61.7], zoom: 7 },
  "Saint Lucia": { center: [13.9, -61], zoom: 7 },
  "St Kitts and Nevis": { center: [17.3, -62.7], zoom: 7 },
  "St Vincent and The Grenadines": { center: [13.3, -61.2], zoom: 7 },
  "Trinidad and Tobago": { center: [10.7, -61.5], zoom: 6.5 },
  "The Bahamas": { center: [25, -77.4], zoom: 5.5 },
  Jamaica: { center: [18.1, -77.3], zoom: 6 },
  Belize: { center: [17.2, -88.5], zoom: 6 },
  Guyana: { center: [4.9, -58.9], zoom: 5.5 },
  Cyprus: { center: [35, 33], zoom: 6.5 },
  Brunei: { center: [4.5, 114.7], zoom: 6.5 },
  Eswatini: { center: [-26.5, 31.5], zoom: 6.5 },
  Lesotho: { center: [-29.5, 28.2], zoom: 6.5 },
  Botswana: { center: [-22.3, 24.7], zoom: 5 },
  "The Gambia": { center: [13.5, -15.5], zoom: 6 },
  Gabon: { center: [-0.8, 11.8], zoom: 5 },
  Rwanda: { center: [-2, 30], zoom: 6 },
  Malawi: { center: [-13.5, 34], zoom: 5.5 },
};

function normalizeName(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getVoyagerCountryKey(countryName = "") {
  const normalized = normalizeName(countryName);
  return UK_VOYAGER_COUNTRY_KEYS.has(normalized) ? "united kingdom" : normalized;
}

function getVoyagerCountryLabel(countryKey = "") {
  if (countryKey === "united kingdom") return "United Kingdom";
  return countryKey
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getCountryLookupKeys(value = "") {
  const normalized = normalizeName(value);
  const keys = [normalized];
  const aliasTarget = countryAliases[normalized];

  if (aliasTarget && !keys.includes(aliasTarget)) {
    keys.push(aliasTarget);
  }

  return keys;
}

const countryAliases = {
  "the bahamas": "bahamas",
  "the gambia": "gambia",
  "brunei darussalam": "brunei",
  "united republic of tanzania": "tanzania",
  "fiji islands": "fiji",
  "st kitts and nevis": "saint kitts and nevis",
  "st vincent and the grenadines": "saint vincent and the grenadines",
  "estwatini": "eswatini",
};

function buildCountryLookupMap(dataset = {}) {
  const map = {};

  Object.entries(dataset).forEach(([countryName, value]) => {
    getCountryLookupKeys(countryName).forEach((lookupKey) => {
      map[lookupKey] = value;
    });
  });

  return map;
}

function getLookupValue(lookupMap = {}, countryName = "") {
  const lookupKeys = getCountryLookupKeys(countryName);
  return lookupKeys.reduce((match, lookupKey) => match || lookupMap[lookupKey], null);
}

const countryStatsByLookup = buildCountryLookupMap(countryStats);
const commonwealthMetadataByLookup = buildCountryLookupMap(commonwealthMetadata);
const countryResearchLinksByLookup = buildCountryLookupMap(countryResearchLinks);

const smallCountries = [
  "Antigua and Barbuda",
  "Barbados",
  "Dominica",
  "Fiji",
  "Grenada",
  "Kiribati",
  "Maldives",
  "Malta",
  "Mauritius",
  "Nauru",
  "St Kitts and Nevis",
  "Saint Lucia",
  "St Vincent and The Grenadines",
  "Samoa",
  "Seychelles",
  "Singapore",
  "Tonga",
  "Tuvalu",
];

function findCountryByFeature(feature, commonwealthNames) {
  const properties = feature?.properties || {};
  const names = [
    properties.name,
    properties.NAME,
    properties.ADMIN,
    properties.name_long,
    properties.NAME_LONG,
    properties.formal_en,
    properties.formal_fr,
  ].filter(Boolean);

  for (const name of names) {
    const normalized = normalizeName(name);

    // Direct match
    if (commonwealthNames.has(normalized)) {
      return countries.find((c) => normalizeName(c.name) === normalized);
    }

    // Check aliases
    const aliasMatch = countryAliases[normalized];
    if (aliasMatch) {
      return countries.find((c) => normalizeName(c.name) === aliasMatch);
    }

    // Reverse alias check - check if any commonwealth country matches via alias
    for (const country of countries) {
      const countryNormalized = normalizeName(country.name);
      const countryAlias = countryAliases[countryNormalized];
      if (countryAlias && countryAlias === normalized) {
        return country;
      }
    }
  }
  return null;
}

function buildFamilySearchCollectionUrl(countryName = "", options = {}) {
  const { requirePlaceId = false } = options;
  const normalizedCountry = normalizeName(countryName);
  const config = FAMILYSEARCH_COLLECTION_SETTINGS_BY_COUNTRY[normalizedCountry];

  if (!config?.region) {
    console.log("No FamilySearch collection config available for:", countryName);
    return null;
  }

  if (requirePlaceId && !config.placeId) {
    return null;
  }

  const ecParts = [`region:${config.region}`];
  if (config.placeId) {
    ecParts.push(`placeId:${config.placeId}`);
  }
  if (config.regionGroup) {
    ecParts.push(`region:${config.regionGroup}`);
  }

  const params = new URLSearchParams();
  params.set("ec", ecParts.join(","));
  if (config.placeId) {
    params.set("fcs", `placeId:${config.placeId}`);
  }

  return `${FAMILYSEARCH_COLLECTIONS_BASE_URL}?${params.toString()}`;
}

const FAMILYSEARCH_CAMPAIGN_ID = "RE-00062906";

function appendFamilySearchCampaignId(url = "") {
  if (!url || !/https?:\/\/(www\.)?familysearch\.org/i.test(url)) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("CID")) {
      parsed.searchParams.set("CID", FAMILYSEARCH_CAMPAIGN_ID);
    }
    return parsed.toString();
  } catch {
    if (!/[?&]CID=/i.test(url)) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}CID=${FAMILYSEARCH_CAMPAIGN_ID}`;
    }
    return url;
  }
}

function getFamilySearchLocationUrl(countryName = "") {
  const normalizedCountry = normalizeName(countryName);
  return FAMILYSEARCH_LOCATION_URL_BY_COUNTRY[normalizedCountry] || null;
}

function toFamilySearchFetchUrl(url = "") {
  if (!url) {
    return null;
  }

  if (url.startsWith(FAMILYSEARCH_FETCH_MIRROR_BASE_URL)) {
    return url;
  }

  if (url.startsWith("/familysearch/")) {
    const relativePath = url.replace(/^\/familysearch/, "");
    return `${FAMILYSEARCH_FETCH_MIRROR_BASE_URL}${relativePath}`;
  }

  if (url.startsWith("/")) {
    return `${FAMILYSEARCH_FETCH_MIRROR_BASE_URL}${url}`;
  }

  const match = url.match(/^https?:\/\/www\.familysearch\.org(\/.*)$/i);
  if (!match) {
    return null;
  }

  return `${FAMILYSEARCH_FETCH_MIRROR_BASE_URL}${match[1]}`;
}

function parseCanonicalCollectionsUrlFromLocationPage(pageText = "") {
  const match = pageText.match(/\[See all [^\]]*Collections\]\((https?:\/\/www\.familysearch\.org(?:\/en)?\/search\/collection\/list\?[^)]+)\)/i);
  return match ? match[1].replace("/en/search/", "/search/") : null;
}

function parseGenealogySeeAllUrlFromLocationPage(pageText = "") {
  const match = pageText.match(/\[See all [^\]]*Genealogies\]\((https?:\/\/www\.familysearch\.org(?:\/en)?\/search\/genealogies\/submissions\?[^)]+)\)/i);
  return match ? match[1].replace("/en/search/", "/search/") : null;
}

function hasFamilySearchGenealogyResults(pageText = "") {
  if (!pageText) {
    return false;
  }

  const showingCountMatch = pageText.match(/Showing\s+\d+\s+of\s+([\d,]+)\s+Genealogies/i);
  if (showingCountMatch) {
    const total = Number.parseInt(showingCountMatch[1].replace(/,/g, ""), 10);
    return Number.isFinite(total) && total > 0;
  }

  if (/No\s+genealog(?:y|ies)\s+found/i.test(pageText)) {
    return false;
  }

  return /(?:\/en)?\/search\/genealogies\/submission\//i.test(pageText);
}

function buildFamilySearchGenealogyFallback(countryName = "") {
  return [
    {
      title: `${countryName} Genealogies`,
      link: `https://www.familysearch.org/search/genealogies/submissions?q.place=${encodeURIComponent(countryName)}`,
      updated: "",
      updatedAt: new Date(0),
      category: "genealogy",
    },
  ];
}

function parseFamilySearchCollectionsFromLocationPage(pageText = "") {
  const seenRecordLinks = new Set();
  const seenImageOnlyLinks = new Set();
  const seenGenealogyLinks = new Set();
  const records = [];
  const imageOnly = [];
  const genealogies = [];
  let activeSection = "";

  pageText.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      return;
    }

    if (/^##\s+Indexed Historical Records$/i.test(trimmedLine)) {
      activeSection = "records";
      return;
    }

    if (/^##\s+Image-Only Historical Records$/i.test(trimmedLine)) {
      activeSection = "image-only";
      return;
    }

    if (/^##\s+Genealogies$/i.test(trimmedLine)) {
      activeSection = "genealogies";
      return;
    }

    if (!trimmedLine.startsWith("|")) {
      return;
    }

    const match = trimmedLine.match(/^\|\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)\s*\|/i);
    if (!match) {
      return;
    }

    const title = match[1].trim();
    const rawLink = match[2].trim();
    if (!title || !rawLink) {
      return;
    }
    const link = rawLink.replace(/^http:/i, "https:").replace("/en/search/", "/search/");

    if (activeSection === "records" && /(?:\/en)?\/search\/collection\/\d+/i.test(link)) {
      if (seenRecordLinks.has(link)) {
        return;
      }

      seenRecordLinks.add(link);
      records.push({
        title,
        link,
        updated: "",
        updatedAt: new Date(0),
        category: "record",
      });
      return;
    }

    if (activeSection === "image-only" && /(?:\/en)?\/search\/collection\/\d+/i.test(link)) {
      if (seenImageOnlyLinks.has(link)) {
        return;
      }

      seenImageOnlyLinks.add(link);
      imageOnly.push({
        title,
        link,
        updated: "",
        updatedAt: new Date(0),
        category: "image-only",
      });
      return;
    }

    if (activeSection === "genealogies" && /(?:\/en)?\/search\/genealogies\/submission\//i.test(link)) {
      if (seenGenealogyLinks.has(link)) {
        return;
      }

      seenGenealogyLinks.add(link);
      genealogies.push({
        title,
        link,
        updated: "",
        updatedAt: new Date(0),
        category: "genealogy",
      });
    }
  });

  return {
    records: records.slice(0, 8),
    imageOnly: imageOnly.slice(0, 8),
    genealogies: genealogies.slice(0, 8),
  };
}

function parseFamilySearchDate(value = "") {
  const monthMap = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
  };

  const match = value.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/i);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = monthMap[match[2].toLowerCase()];
  const year = Number(match[3]);

  if (Number.isNaN(day) || month === undefined || Number.isNaN(year)) {
    return null;
  }

  return new Date(Date.UTC(year, month, day));
}

function parseFamilySearchCollections(pageText = "") {
  const byLink = new Map();

  const collections = [];

  pageText.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith("|")) {
      return;
    }

    const datedRowMatch = trimmedLine.match(/^\|\s*More\s*\|\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)\s*\|\s*(.*?)\s*\|/i);
    if (datedRowMatch) {
      const title = datedRowMatch[1].trim();
      const link = datedRowMatch[2].trim();
      const details = datedRowMatch[3].trim();
      const dateMatch = details.match(/(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i);
      const parsedDate = dateMatch ? parseFamilySearchDate(dateMatch[1]) : null;

      if (!title || !link) {
        return;
      }

      byLink.set(link, {
        title,
        link,
        updated: dateMatch ? dateMatch[1] : "",
        updatedAt: parsedDate || new Date(0),
      });
      return;
    }

    const countRowMatch = trimmedLine.match(/^\|\s*\[([^\]]+)\]\((https?:\/\/[^)]+\/en\/search\/collection\/\d+[^)]*)\)\s*\|\s*([^|]*)\|/i);
    if (!countRowMatch) {
      return;
    }

    const title = countRowMatch[1].trim();
    const link = countRowMatch[2].trim();
    if (!title || !link || byLink.has(link)) {
      return;
    }

    byLink.set(link, {
      title,
      link,
      updated: "",
      updatedAt: new Date(0),
    });
  });

  collections.push(...byLink.values());

  return collections
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);
}

function getFamilySearchCollectionCategory(title = "") {
  if (FAMILYSEARCH_GENEALOGY_KEYWORD_REGEX.test(title)) {
    return "genealogy";
  }

  return "record";
}

function isValidFamilySearchRecordCollectionLink(link = "") {
  return /https?:\/\/(www\.)?familysearch\.org(?:\/en)?\/search\/collection\/\?*(?:\d+|[\w-]+)(?:[/?#].*)?$/i.test(link);
}

function isValidFamilySearchGenealogyLink(link = "") {
  return /https?:\/\/(www\.)?familysearch\.org(?:\/en)?\/search\/genealogies\/submission\/\S+/i.test(link);
}

function sanitizeFamilySearchCollections(collections = []) {
  if (!Array.isArray(collections)) {
    return [];
  }

  const seen = new Set();
  const sanitized = [];

  collections.forEach((collection) => {
    if (!collection?.title || !collection?.link) {
      return;
    }

    const normalizedLink = String(collection.link)
      .trim()
      .replace(/^http:/i, "https:")
      .replace("/en/search/", "/search/");

    const isRecord = isValidFamilySearchRecordCollectionLink(normalizedLink);
    const isGenealogy = isValidFamilySearchGenealogyLink(normalizedLink);

    if (!isRecord && !isGenealogy) {
      return;
    }

    if (seen.has(normalizedLink)) {
      return;
    }

    seen.add(normalizedLink);

    let category = collection.category;
    if (category !== "record" && category !== "genealogy" && category !== "image-only") {
      if (isGenealogy || FAMILYSEARCH_GENEALOGY_KEYWORD_REGEX.test(collection.title) || /genealogy/i.test(normalizedLink)) {
        category = "genealogy";
      } else {
        category = "record";
      }
    }

    sanitized.push({
      ...collection,
      link: normalizedLink,
      category,
    });
  });

  return sanitized;
}

function sanitizeCollectionsByCountryMap(collectionsByCountry = {}) {
  const sanitized = {};
  Object.entries(collectionsByCountry || {}).forEach(([countryKey, collections]) => {
    sanitized[countryKey] = sanitizeFamilySearchCollections(collections);
  });
  return sanitized;
}

function splitFamilySearchCollectionsByCategory(collections = []) {
  const records = [];
  const imageOnly = [];
  const genealogies = [];

  collections.forEach((collection) => {
    if (!collection?.title || !collection?.link) {
      return;
    }

    if (collection.category === "image-only") {
      imageOnly.push(collection);
      return;
    }

    if (collection.category === "record") {
      records.push(collection);
      return;
    }

    if (collection.category === "genealogy") {
      genealogies.push(collection);
      return;
    }

    if (getFamilySearchCollectionCategory(collection.title) === "genealogy") {
      genealogies.push(collection);
      return;
    }

    records.push(collection);
  });

  return { records, imageOnly, genealogies };
}

function getFamilySearchCollectionsForFallback(collections = []) {
  const { records, imageOnly, genealogies } = splitFamilySearchCollectionsByCategory(collections);

  if (records.length > 0) {
    return {
      categoryLabel: "Records Available",
      collections: records,
      hasRecords: true,
      hasImageOnly: imageOnly.length > 0,
      hasGenealogies: genealogies.length > 0,
    };
  }

  if (genealogies.length > 0) {
    return {
      categoryLabel: "Genealogies Available",
      collections: genealogies,
      hasRecords: false,
      hasImageOnly: imageOnly.length > 0,
      hasGenealogies: true,
    };
  }

  if (imageOnly.length > 0) {
    return {
      categoryLabel: "Image-Only Records Available",
      collections: imageOnly,
      hasRecords: false,
      hasImageOnly: true,
      hasGenealogies: false,
    };
  }

  return {
    categoryLabel: "",
    collections: [],
    hasRecords: false,
    hasImageOnly: false,
    hasGenealogies: false,
  };
}

function MapBounds({ isAttractMode }) {
  const map = useMap();

  useEffect(() => {
    // Only constrain minimum zoom to prevent zooming out too far.
    // No maxBounds — let the map feel open and premium like Apple Maps.
    map.setMinZoom(COMMONWEALTH_MIN_ZOOM);
    map.options.worldCopyJump = false;
  }, [map]);

  useEffect(() => {
    if (!map) return;
    if (isAttractMode) {
      // Disable user zoom during the attract/idle screen — camera is scripted
      map.scrollWheelZoom.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
    } else {
      // Restore user zoom during exploration
      map.scrollWheelZoom.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
    }
  }, [map, isAttractMode]);

  return null;
}

function MapArtOverlay({ imageUrl, opacity = 0.4 }) {
  const map = useMap();

  useEffect(() => {
    const paneName = "background-art-pane";
    let pane = map.getPane(paneName);

    if (!pane) {
      pane = map.createPane(paneName);
      pane.style.zIndex = "210";
      pane.style.pointerEvents = "none";
    }

    const overlays = [-360, 0, 360].map((lngOffset) =>
      L.imageOverlay(
        imageUrl,
        [
          [-88, -180 + lngOffset],
          [88, 180 + lngOffset],
        ],
        {
          opacity,
          pane: paneName,
          interactive: false,
          noWrap: true,
        }
      )
    );

    overlays.forEach((overlay) => overlay.addTo(map));

    return () => {
      overlays.forEach((overlay) => overlay.remove());
    };
  }, [map, imageUrl, opacity]);

  return null;
}

function AttractCountryPulse({ countryName, countryLayerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!countryName) {
      return;
    }

    const normalized = normalizeName(countryName);
    const layer = countryLayerRefs.current?.[normalized];

    if (!layer) {
      return;
    }

    const element = layer.getElement?.();
    if (!element) {
      return;
    }

    let animationFrame;
    let startTime = Date.now();
    const pulseDuration = 2000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed % pulseDuration) / pulseDuration;
      const pulse = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
      const scale = 1 + pulse * 0.08;
      const glowIntensity = pulse * 0.4;

      element.style.transform = `scale(${scale})`;
      element.style.filter = `drop-shadow(0 0 ${8 + pulse * 12}px rgba(241, 100, 88, ${glowIntensity}))`;

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      element.style.transform = '';
      element.style.filter = '';
    };
  }, [map, countryName]);

  return null;
}

function VintageMapDecorations() {
  const map = useMap();

  useEffect(() => {
    // Add subtle grid lines (latitude/longitude)
    const gridLines = L.layerGroup();

    // Latitude lines every 20 degrees
    for (let lat = -60; lat <= 80; lat += 20) {
      const line = L.polyline(
        [[lat, -180], [lat, 180]],
        {
          color: "#333536",
          weight: 0.5,
          opacity: 0.06,
          interactive: false,
        }
      );
      gridLines.addLayer(line);
    }

    // Longitude lines every 20 degrees — cover full ±180° range
    for (let lng = -180; lng <= 180; lng += 20) {
      const line = L.polyline(
        [[-90, lng], [90, lng]],
        {
          color: "#333536",
          weight: 0.5,
          opacity: 0.06,
          interactive: false,
        }
      );
      gridLines.addLayer(line);
    }

    gridLines.addTo(map);

    // Add compass rose in lower-right corner
    const compassRose = L.divIcon({
      className: 'compass-rose',
      html: `
        <svg width="120" height="120" viewBox="0 0 120 120" style="opacity: 0.05; position: absolute; bottom: 20px; right: 20px;">
          <circle cx="60" cy="60" r="55" fill="none" stroke="#333536" stroke-width="1"/>
          <circle cx="60" cy="60" r="45" fill="none" stroke="#333536" stroke-width="0.5"/>
          <path d="M60 10 L63 55 L60 60 L57 55 Z" fill="#333536"/>
          <path d="M60 110 L63 65 L60 60 L57 65 Z" fill="#333536" opacity="0.5"/>
          <path d="M10 60 L55 57 L60 60 L55 63 Z" fill="#333536" opacity="0.5"/>
          <path d="M110 60 L65 57 L60 60 L65 63 Z" fill="#333536" opacity="0.5"/>
          <text x="60" y="8" text-anchor="middle" font-size="8" fill="#333536" font-family="serif">N</text>
          <text x="60" y="116" text-anchor="middle" font-size="8" fill="#333536" font-family="serif">S</text>
          <text x="6" y="63" text-anchor="middle" font-size="8" fill="#333536" font-family="serif">W</text>
          <text x="114" y="63" text-anchor="middle" font-size="8" fill="#333536" font-family="serif">E</text>
        </svg>
      `,
      iconSize: [120, 120],
      iconAnchor: [60, 60],
    });

    L.marker([-70, 170], { icon: compassRose, interactive: false }).addTo(map);

    return () => {
      gridLines.remove();
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker && layer.getLatLng().lat === -70 && layer.getLatLng().lng === 170) {
          map.removeLayer(layer);
        }
      });
    };
  }, [map]);

  return null;
}

function buildSeaRouteArc(from, to, samples = 28) {
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;
  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance <= 0) {
    return [from, to];
  }

  const mx = (lng1 + lng2) / 2;
  const my = (lat1 + lat2) / 2;
  const nx = -dy / distance;
  const ny = dx / distance;
  const arcHeight = Math.min(18, Math.max(6, distance * 0.18));
  const cx = mx + nx * arcHeight;
  const cy = my + ny * arcHeight;
  const points = [];

  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const inv = 1 - t;
    const lng = inv * inv * lng1 + 2 * inv * t * cx + t * t * lng2;
    const lat = inv * inv * lat1 + 2 * inv * t * cy + t * t * lat2;
    points.push([lat, lng]);
  }

  return points;
}

function AttractSeaRouteSwoosh({ route }) {
  const map = useMap();

  useEffect(() => {
    if (!route?.from || !route?.to) {
      return;
    }

    const paneName = "attract-route-pane";
    let pane = map.getPane(paneName);

    if (!pane) {
      pane = map.createPane(paneName);
      pane.style.zIndex = "430";
      pane.style.pointerEvents = "none";
    }

    const latLngs = buildSeaRouteArc(route.from, route.to);
    const maxLineOpacity = route.hero ? 0.42 : 0.28;
    const maxGlowOpacity = route.hero ? 0.2 : 0.12;
    const glowWeight = route.hero ? 3.2 : 2.4;
    const lineWeight = route.hero ? 1.5 : 1.1;
    const glowColor = route.hero ? "#f7edd4" : "#dce8f4";
    const lineColor = route.hero ? "#fff5de" : "#e8f1fb";
    const dashPattern = route.hero ? "36 460" : "28 400";

    const glow = L.polyline(latLngs, {
      pane: paneName,
      color: glowColor,
      weight: glowWeight,
      opacity: 0,
      dashArray: dashPattern,
      lineCap: "round",
      interactive: false,
    }).addTo(map);

    const line = L.polyline(latLngs, {
      pane: paneName,
      color: lineColor,
      weight: lineWeight,
      opacity: 0,
      dashArray: dashPattern,
      lineCap: "round",
      interactive: false,
    }).addTo(map);

    const durationMs = route.durationMs || ATTRACT_ARC_DURATION_MS;
    let rafId = null;
    const startedAt = performance.now();

    const animate = (now) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      let opacity = 0;

      if (progress < 0.18) {
        opacity = (progress / 0.18) * maxLineOpacity;
      } else if (progress < 0.82) {
        opacity = maxLineOpacity;
      } else {
        opacity = ((1 - progress) / 0.18) * maxLineOpacity;
      }

      const clampedOpacity = Math.max(0, Math.min(maxLineOpacity, opacity));
      line.setStyle({ opacity: clampedOpacity });
      glow.setStyle({
        opacity: Math.max(0, Math.min(maxGlowOpacity, clampedOpacity * 0.92)),
        weight: glowWeight,
      });

      const phase = progress * (route.hero ? 760 : 620);
      const dashOffset = `${Math.round(phase)}px`;
      line.setStyle({ dashOffset });
      glow.setStyle({ dashOffset });

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      glow.remove();
      line.remove();
    };
  }, [map, route?.id, route?.hero, route?.durationMs]);

  return null;
}

function SmallCountryMarkers({
  geojson,
  onSelectCountry,
  selectedCountry,
  hoveredCountry,
  activatedCountryName,
  isPanelOpen,
  isAttractMode,
  onCountryHover,
}) {
  const map = useMap();
  const markersRef = useRef(null);
  const markerDataRef = useRef(new Map());

  const selectedCountryRef = useRef(selectedCountry);
  const onSelectCountryRef = useRef(onSelectCountry);
  const onCountryHoverRef = useRef(onCountryHover);

  useEffect(() => {
    selectedCountryRef.current = selectedCountry;
    onSelectCountryRef.current = onSelectCountry;
    onCountryHoverRef.current = onCountryHover;
  }, [selectedCountry, onSelectCountry, onCountryHover]);

  const commonwealthNames = new Set(countries.map((c) => normalizeName(c.name)));
  const hoveredCountryNormalized = normalizeName(hoveredCountry || "");

  // Get marker style that mirrors getCountryStyle for polygons
  const getMarkerStyle = (country, options = {}) => {
    const isSelected = Boolean(
      country && selectedCountryRef.current?.name && country.name === selectedCountryRef.current.name
    );
    const isActivatedSelected = Boolean(
      isSelected && activatedCountryName && country.name === activatedCountryName
    );
    const isExternallyHovered = Boolean(
      country &&
      hoveredCountryNormalized &&
      normalizeName(country.name) === hoveredCountryNormalized
    );
    const isHovered = Boolean((options.isHovered || isExternallyHovered) && !isSelected);

    // Activated selected state (panel open/closed)
    if (isActivatedSelected) {
      const selectedColor = isPanelOpen ? "#F16458" : "#333536";
      return {
        radius: 5.5,
        fillColor: selectedColor,
        color: isPanelOpen ? "#F16458" : "#97d749",
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.75,
      };
    }

    // Selected state — match coral when panel is open (mirrors polygon style)
    if (isSelected) {
      const selColor = isPanelOpen ? "#F16458" : "#87B940";
      const selBorder = isPanelOpen ? "#F16458" : "#97d749";
      return {
        radius: 5.5,
        fillColor: selColor,
        color: selBorder,
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.75,
      };
    }

    // Hovered state
    if (isHovered) {
      return {
        radius: 5.5,
        fillColor: "#F16458",
        color: "#F16458",
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.65,
      };
    }

    // Default state
    return {
      radius: 4,
      fillColor: "#87B940",
      color: "#97d749",
      weight: 1.0,
      opacity: 0.95,
      fillOpacity: 0.35,
    };
  };

  useEffect(() => {
    if (!geojson || !map) {
      return;
    }

    // Create a dedicated pane for small country markers so they render in their
    // own SVG context and don't get caught in the main overlay pane's scale
    // transform during flyTo animations. zIndex 455 puts them just above polygons.
    const paneName = "small-markers-pane";
    if (!map.getPane(paneName)) {
      const pane = map.createPane(paneName);
      pane.style.zIndex = "455";
      // pointer-events must stay on the pane itself so individual markers
      // can receive click/hover — the SVG <path> elements handle their own events
    }

    // Shared SVG renderer with 0.5-tile padding buffer — prevents markers on
    // the edge of the visible area from vanishing during pan/zoom.
    const renderer = L.svg({ padding: 0.5 });

    const markers = L.layerGroup();
    markersRef.current = markers;
    markerDataRef.current = new Map();

    // Find and mark small countries
    geojson.features?.forEach((feature) => {
      const country = findCountryByFeature(
        feature,
        new Set(countries.map((c) => normalizeName(c.name)))
      );

      if (!country) {
        return;
      }

      const countryName = normalizeName(country.name);

      // Check if this is a small country
      if (!smallCountries.some((sc) => normalizeName(sc) === countryName)) {
        return;
      }

      // Calculate centroid
      const layer = L.geoJSON(feature);
      const bounds = layer.getBounds();
      const center = bounds.getCenter();

      // Create circular marker with default style
      const marker = L.circleMarker(center, {
        radius: 4,
        fillColor: "#87B940",
        color: "#97d749",
        weight: 1.0,
        opacity: 0.95,
        fillOpacity: 0.35,
        className: "small-country-marker",
        pane: paneName,
        renderer,
      });

      // Store country data with marker
      markerDataRef.current.set(marker, country);

      // Get marker element and apply transition styles
      const applyTransitionStyles = () => {
        const element = marker.getElement();
        if (element) {
          element.style.transition =
            `fill ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}, stroke ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}, fill-opacity ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}, filter ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}`;
        }
      };

      // Apply transitions after marker is added to DOM
      setTimeout(applyTransitionStyles, 0);

      marker.bindTooltip(country.name, {
        permanent: false,
        direction: "center",
        className: "country-tooltip",
      });

      marker.on("mouseover", () => {
        if (selectedCountryRef.current) {
          marker.closeTooltip();
          const element = marker.getElement();
          if (element) {
            element.style.cursor = "default";
          }
          return;
        }
        const element = marker.getElement();
        if (element) {
          element.style.cursor = "pointer";
        }
        onCountryHoverRef.current?.(country.name);
      });

      marker.on("mouseout", () => {
        if (selectedCountryRef.current) return;
        onCountryHoverRef.current?.(null);
      });

      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        if (selectedCountryRef.current) {
          return;
        }
        onCountryHoverRef.current?.(null);
        onSelectCountryRef.current(country);
      });

      markers.addLayer(marker);
    });

    markers.addTo(map);

    return () => {
      markers.remove();
      markerDataRef.current.clear();
    };
  }, [geojson, map]);

  // Update marker styles based on state (hover, selection, etc.)
  useEffect(() => {
    if (!markersRef.current) {
      return;
    }

    markersRef.current.eachLayer((marker) => {
      const country = markerDataRef.current.get(marker);
      if (!country) {
        return;
      }

      const isSelected = Boolean(
        country && selectedCountry?.name && country.name === selectedCountry.name
      );
      const isActivatedSelected = Boolean(
        isSelected && activatedCountryName && country.name === activatedCountryName
      );
      const isHovered = Boolean(
        country && hoveredCountryNormalized && normalizeName(country.name) === hoveredCountryNormalized
      );

      // Determine state string to prevent redundant updates which cause jitter/shaking
      let newState = "default";
      if (isActivatedSelected) newState = "activated";
      else if (isSelected) newState = "selected";
      else if (isHovered) newState = "hovered";

      if (marker._customState === newState) {
        return;
      }
      marker._customState = newState;

      const style = getMarkerStyle(country);
      const element = marker.getElement();

      // Apply style
      marker.setStyle({
        radius: style.radius,
        fillColor: style.fillColor,
        color: style.color,
        weight: style.weight,
        opacity: style.opacity,
        fillOpacity: style.fillOpacity,
      });

      // Apply glow effect matching polygons
      if (element) {
        element.style.transition = `fill ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}, fill-opacity ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}, stroke ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}, stroke-width ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}, opacity ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}, filter ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}, r ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}`;
      }
    });
  }, [hoveredCountry, selectedCountry, activatedCountryName, isPanelOpen, isAttractMode, hoveredCountryNormalized]);

  // Update marker visibility based on zoom
  useEffect(() => {
    if (!map || !markersRef.current) {
      return;
    }

    const updateMarkerVisibility = () => {
      const zoom = map.getZoom();
      const showMarkers = zoom < 4.5;

      markersRef.current.eachLayer((layer) => {
        const element = layer.getElement?.();
        if (element) {
          element.style.display = showMarkers ? "" : "none";
        }
      });
    };

    updateMarkerVisibility();
    map.on("zoomend", updateMarkerVisibility);

    return () => {
      map.off("zoomend", updateMarkerVisibility);
    };
  }, [map]);

  return null;
}

function WorldGeoLayer({
  onSelectCountry,
  onBackgroundClick,
  mapRef,
  selectedCountry,
  activatedCountryName,
  isPanelOpen,
  isAttractMode,
  hoveredCountry,
  onCountryHover,
  countryLayerRefs,
  onGeojsonLoad,
  onGeojsonError,
}) {
  const map = useMap();
  const [geojson, setGeojson] = useState(null);
  const geojsonRef = useRef(null);

  const selectedCountryRef = useRef(selectedCountry);
  const onSelectCountryRef = useRef(onSelectCountry);
  const onCountryHoverRef = useRef(onCountryHover);

  useEffect(() => {
    selectedCountryRef.current = selectedCountry;
    onSelectCountryRef.current = onSelectCountry;
    onCountryHoverRef.current = onCountryHover;
  }, [selectedCountry, onSelectCountry, onCountryHover]);

  useEffect(() => {
    if (!map) return;
    if (selectedCountry) {
      map.dragging.disable();
    } else {
      map.dragging.enable();
    }
  }, [map, selectedCountry]);

  const commonwealthNames = new Set(countries.map((c) => normalizeName(c.name)));
  const hoveredCountryNormalized = normalizeName(hoveredCountry || "");

  const getCountryStyle = (feature, options = {}) => {
    const country = findCountryByFeature(feature, commonwealthNames);
    const isCommonwealth = Boolean(country);
    const isSelected = Boolean(country && selectedCountryRef.current?.name && country.name === selectedCountryRef.current.name);
    const isActivatedSelected = Boolean(
      isSelected && activatedCountryName && country.name === activatedCountryName
    );
    const isExternallyHovered = Boolean(
      country && hoveredCountryNormalized && normalizeName(country.name) === hoveredCountryNormalized
    );
    const isHovered = Boolean((options.isHovered || isExternallyHovered) && isCommonwealth && !isSelected);

    if (isActivatedSelected) {
      const selectedColor = isPanelOpen ? "#F16458" : "#333536";
      return {
        color: selectedColor,
        weight: 1.8,
        fillColor: selectedColor,
        fillOpacity: 0.75,
        opacity: 1,
      };
    }

    if (isSelected) {
      // When the panel is open, the selected country should feel intentional and
      // match the coral/red theme of the side card — same as activated state.
      const selColor = isPanelOpen ? "#F16458" : "#87B940";
      const selBorder = isPanelOpen ? "#F16458" : "#97d749";
      return {
        color: selBorder,
        weight: 1.8,
        fillColor: selColor,
        fillOpacity: 0.75,
        opacity: 1,
      };
    }

    if (isHovered) {
      return {
        color: "#F16458",
        weight: 1.5,
        fillColor: "#F16458",
        fillOpacity: 0.65,
        opacity: 1,
      };
    }

    if (isCommonwealth) {
      return {
        color: "#97d749",
        weight: 1.0,
        fillColor: "#87B940",
        fillOpacity: 0.35,
        opacity: 0.95,
      };
    }

    return {
      color: "rgba(255, 255, 255, 0.2)",
      weight: 1.0,
      fillColor: "#202738",
      fillOpacity: 0.35,
      opacity: 0.95,
    };
  };

  useEffect(() => {
    if (geojsonRef.current && geojson) {
      geojsonRef.current.eachLayer((layer) => {
        const feature = layer.feature;
        if (feature) {
          layer.setStyle(getCountryStyle(feature));
          const country = findCountryByFeature(feature, commonwealthNames);
          const element = layer.getElement?.();
          if (country && element) {
            const isActivated = Boolean(
              selectedCountry?.name && country.name === selectedCountry.name && activatedCountryName === country.name
            );
            const isHovered = Boolean(
              country && hoveredCountryNormalized && normalizeName(country.name) === hoveredCountryNormalized
            );
            element.style.transition = `fill ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}, fill-opacity ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}, stroke ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}, stroke-width ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}, opacity ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}, filter ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}`;

            if (isAttractMode) {
              element.style.filter = "none";
            } else if (isActivated) {
              element.style.filter = "drop-shadow(0 2px 6px rgba(0,0,0,0.45)) drop-shadow(0 0 12px rgba(241, 100, 88, 0.5))";
            } else if (isHovered) {
              element.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.3)) drop-shadow(0 0 8px rgba(241, 100, 88, 0.35))";
            } else if (selectedCountry?.name === country.name) {
              element.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.3)) drop-shadow(0 0 8px rgba(151, 215, 73, 0.5))";
            } else {
              element.style.filter = "none";
            }
          }
        }
      });
    }
  }, [selectedCountry, activatedCountryName, hoveredCountry, isPanelOpen, isAttractMode]);

  useEffect(() => {
    if (mapRef) {
      mapRef.current = map;
    }

    const handleBackgroundClick = () => {
      onBackgroundClick();
    };

    map.on("click", handleBackgroundClick);

    return () => {
      map.off("click", handleBackgroundClick);
    };
  }, [map, mapRef]);

  useEffect(() => {
    let isActive = true;

    const loadGeojsonWithFallback = async () => {
      const errors = [];

      for (const sourceUrl of GEOJSON_FALLBACK_URLS) {
        try {
          const response = await fetch(sourceUrl, { headers: { Accept: "application/json, text/plain, */*" } });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();
          if (!data || !Array.isArray(data.features)) {
            throw new Error("Invalid GeoJSON payload");
          }

          return data;
        } catch (error) {
          errors.push(`${sourceUrl}: ${error?.message || "Unknown error"}`);
        }
      }

      throw new Error(errors.join(" | "));
    };

    loadGeojsonWithFallback()
      .then((data) => {
        if (isActive) {
          // Remove the single sovereign United Kingdom polygon
          data.features = data.features.filter(feature => {
            const props = feature.properties;
            const isUK = props.name === "United Kingdom" || props.NAME === "United Kingdom" || props.ADMIN === "United Kingdom" || props.SOVEREIGN === "United Kingdom";
            return !isUK;
          });

          // Add individual England, Scotland, and Wales polygons
          data.features.push(...ukBoundaries.features);

          setGeojson(data);
          onGeojsonLoad(data);
          onGeojsonError?.("");

          // Comprehensive GeoJSON Audit
          const auditResults = [];
          const missingFromGeoJSON = [];
          const foundInGeoJSON = [];

          // Build a map of all GeoJSON country names for lookup
          const geojsonNameMap = new Map();
          data.features?.forEach((feature) => {
            const props = feature?.properties || {};
            const names = [
              props.name,
              props.NAME,
              props.ADMIN,
              props.name_long,
              props.NAME_LONG,
            ].filter(Boolean);

            names.forEach(name => {
              const normalized = normalizeName(name);
              if (!geojsonNameMap.has(normalized)) {
                geojsonNameMap.set(normalized, name);
              }
            });
          });

          // Check each Commonwealth country
          countries.forEach(country => {
            const countryNormalized = normalizeName(country.name);
            let found = false;
            let geojsonName = "-";

            // Check if country exists in GeoJSON
            if (geojsonNameMap.has(countryNormalized)) {
              found = true;
              geojsonName = geojsonNameMap.get(countryNormalized);
            } else {
              // Check aliases
              const aliasMatch = countryAliases[countryNormalized];
              if (aliasMatch && geojsonNameMap.has(aliasMatch)) {
                found = true;
                geojsonName = geojsonNameMap.get(aliasMatch);
              }
            }

            auditResults.push({
              name: country.name,
              found,
              geojsonName
            });

            if (found) {
              foundInGeoJSON.push(country.name);
            } else {
              missingFromGeoJSON.push(country.name);
            }
          });

          // Output comprehensive report
          console.group("GeoJSON Dataset Audit Report");
          console.log("=".repeat(80));
          console.log(`Total countries in countries.json: ${countries.length}`);
          console.log(`Total countries found in GeoJSON: ${foundInGeoJSON.length}`);
          console.log(`Total countries missing from GeoJSON: ${missingFromGeoJSON.length}`);
          console.log("=".repeat(80));

          console.log("\nDetailed Country Audit:");
          console.table(auditResults.map(r => ({
            Country: r.name,
            Found: r.found ? "Yes" : "No",
            GeoJSON_Name: r.geojsonName
          })));

          if (missingFromGeoJSON.length > 0) {
            console.group("\n❌ Missing Countries (Not in GeoJSON):");
            missingFromGeoJSON.forEach(name => console.log(`  - ${name}`));
            console.groupEnd();
          }

          if (foundInGeoJSON.length > 0) {
            console.group("\n✅ Found Countries (In GeoJSON):");
            foundInGeoJSON.forEach(name => console.log(`  - ${name}`));
            console.groupEnd();
          }

          console.groupEnd();
        }
      })
      .catch((error) => {
        if (isActive) {
          console.error("GeoJSON Fetch Error:", error.message);
          setGeojson(null);
          onGeojsonError?.("Unable to load map data. Check network and refresh.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [setGeojson, onGeojsonLoad, onGeojsonError]);

  if (!geojson) {
    return null;
  }

  return (
    <GeoJSON
      key="world-geojson"
      ref={geojsonRef}
      data={geojson}
      style={(feature) => getCountryStyle(feature)}
      onEachFeature={(feature, layer) => {
        const country = findCountryByFeature(feature, commonwealthNames);

        if (!country) {
          return;
        }

        const applySoftTransition = (phase = "out") => {
          const element = layer.getElement?.();
          if (!element) {
            return;
          }

          const duration = phase === "in" ? MAP_HIGHLIGHT_TRANSITION_MS : MAP_HIGHLIGHT_TRANSITION_MS;

          element.style.transition =
            `fill ${duration}ms ${MAP_HIGHLIGHT_EASE}, fill-opacity ${duration}ms ${MAP_HIGHLIGHT_EASE}, stroke ${duration}ms ${MAP_HIGHLIGHT_EASE}, stroke-width ${duration}ms ${MAP_HIGHLIGHT_EASE}, opacity ${duration}ms ${MAP_HIGHLIGHT_EASE}`;
        };

        setTimeout(applySoftTransition, 0);

        const normalized = normalizeName(country.name);
        countryLayerRefs.current[normalized] = layer;

        layer.on("mouseover", () => {
          if (selectedCountryRef.current) {
            layer.getElement()?.style?.setProperty("cursor", "default");
            return;
          }
          applySoftTransition("in");
          layer.setStyle(getCountryStyle(feature, { isHovered: true }));
          layer.getElement()?.style?.setProperty("cursor", "pointer");
          onCountryHoverRef.current?.(country.name);
        });

        layer.on("mouseout", () => {
          if (selectedCountryRef.current) return;
          applySoftTransition("out");
          layer.setStyle(getCountryStyle(feature));
          onCountryHoverRef.current?.(null);
        });

        layer.on("click", (event) => {
          event.originalEvent?.stopPropagation();
          L.DomEvent.stopPropagation(event);

          if (selectedCountryRef.current) {
            return;
          }

          const country = findCountryByFeature(feature, commonwealthNames);
          if (!country) {
            return;
          }

          onCountryHoverRef.current?.(null);
          onSelectCountryRef.current(country);
        });
      }}
    />
  );
}

export default function App() {
  const [explorerId] = useState(getOrCreateExplorerId);
  const { createPass, updateAllPasses, hasPass, getSerial, isLoading: isWalletLoading, error: walletError } = useWalletPass();

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [geojson, setGeojson] = useState(null);
  const [mapLoadError, setMapLoadError] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [attractAutoCountryName, setAttractAutoCountryName] = useState("");
  const [attractActiveJourney, setAttractActiveJourney] = useState(null);
  const [activatedCountryName, setActivatedCountryName] = useState(null);
  const [heroMotionSeed, setHeroMotionSeed] = useState(0);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [hoveredCountryPos, setHoveredCountryPos] = useState(null);
  const [hoveredMilestone, setHoveredMilestone] = useState(null);
  const [countryDataCache] = useState(countryStatsByLookup);
  const [familySearchCollections, setFamilySearchCollections] = useState([]);
  const [brokenLocationUrls, setBrokenLocationUrls] = useState(() => {
    try {
      const raw = localStorage.getItem(FAMILYSEARCH_BROKEN_URLS_STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (_) {
      return new Set();
    }
  });
  const persistBrokenLocationUrls = (updatedSet) => {
    try {
      localStorage.setItem(FAMILYSEARCH_BROKEN_URLS_STORAGE_KEY, JSON.stringify([...updatedSet]));
    } catch (_) {}
  };
  const [isFamilySearchCollectionsLoading, setIsFamilySearchCollectionsLoading] = useState(false);
  const [familySearchQrDestination, setFamilySearchQrDestination] = useState(null);
  const [lightboxItem, setLightboxItem] = useState(null);
  const [viewedVideoIds, setViewedVideoIds] = useState(new Set());
  const [showGalleryNavigation, setShowGalleryNavigation] = useState(false);
  const [galleryActiveIndex, setGalleryActiveIndex] = useState(0);
  const [isFamilySearchCacheReady, setIsFamilySearchCacheReady] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [hasOverviewOverflow, setHasOverviewOverflow] = useState(false);
  const [recordCollectionsDisplayLimit, setRecordCollectionsDisplayLimit] = useState(3);
  const [validatedHeroImage, setValidatedHeroImage] = useState(null);
  // Use a ref (not state) for scroll-driven morph so onScroll never triggers a React re-render
  const heroScrollRafRef = useRef(null);
  const heroOuterRef = useRef(null);
  const heroGlassRef = useRef(null);
  const panelScrolledRef = useRef(false);
  const [isPanelScrolled, setIsPanelScrolled] = useState(false);
  const [isIdleAttractMode, setIsIdleAttractMode] = useState(true);
  const attractExitTimeRef = useRef(0);
  const [isButtonTransitioning, setIsButtonTransitioning] = useState(false);
  const [mapOnlyStartTime, setMapOnlyStartTime] = useState(null);
  const [attractRouteSwooshes, setAttractRouteSwooshes] = useState([]);
  const [attractHeroRoute, setAttractHeroRoute] = useState(null);
  const [isDockSearchExpanded, setIsDockSearchExpanded] = useState(false);
  const [dockSearchActivityTick, setDockSearchActivityTick] = useState(0);
  const [isMenuOpening, setIsMenuOpening] = useState(false);
  const [isDockExpanding, setIsDockExpanding] = useState(false);
  const dockExpansionRef = useRef({ width: 0, height: 0 });
  const dockCardsRevealTimeoutRef = useRef(null);
  const [visitedVoyagerCountries, setVisitedVoyagerCountries] = useState([]);
  const [voyagerNotice, setVoyagerNotice] = useState(null);
  const [voyagerCompletionVisible, setVoyagerCompletionVisible] = useState(false);
  const [achievementUnlocked, setAchievementUnlocked] = useState(null);
  // Certificate flow state (Phases 2 & 3): null | 'name' | 'qr'.
  // Kept separate from achievementUnlocked so the achievement modal can be
  // dismissed on its own while the certificate flow, once started, carries
  // its own name entry and QR steps.
  const [certificateStep, setCertificateStep] = useState(null);
  const [certificateName, setCertificateName] = useState('');
  const storyCardWrapperRef = useRef(null);

  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth || window.matchMedia('(max-width: 768px)').matches;
  });

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth || window.matchMedia('(max-width: 768px)').matches);
    };
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);
  const [isVoyagerExpanded, setIsVoyagerExpanded] = useState(false);
  const [voyagerBadgeAnimToken, setVoyagerBadgeAnimToken] = useState(0);
  const [voyagerAuraToken, setVoyagerAuraToken] = useState(0);
  const mapRef = useRef(null);
  const mapAtmosphereRef = useRef(null);
  const mapDriftStateRef = useRef({ x: 0, y: 0, scale: 1 });
  const attractEyebrowRef = useRef(null);
  const attractTitleRef = useRef(null);
  const attractSubRef = useRef(null);
  const ctaLiftRef = useRef(0);
  const ctaPressAmountRef = useRef(0);
  const ctaLiftStopRef = useRef(null);
  const ctaPressStopRef = useRef(null);
  const countryLayerRefs = useRef({});
  const loggedMissingApiMatches = useRef(new Set());
  const familySearchCollectionsCacheRef = useRef({});
  const familySearchCollectionUrlCacheRef = useRef({});
  const familySearchCollectionsInFlightRef = useRef({});
  const selectedCountryKeyRef = useRef("");
  const panelOpenTimeoutRef = useRef(null);
  const selectionTimelineTimeoutsRef = useRef([]);
  const attractCycleTimeoutRef = useRef(null);
  const dockSearchTimeoutRef = useRef(null);
  const idleTimeoutRef = useRef(null);
  const lastMoveActivityAtRef = useRef(0);
  const lastUserActivityAtRef = useRef(Date.now());
  const galleryTrackRef = useRef(null);
  const overviewTextRef = useRef(null);
  const recordTitleRefs = useRef([]);
  const voyagerNoticeTimeoutRef = useRef(null);
  const voyagerCompletionTimeoutRef = useRef(null);
  const visitedVoyagerCountriesRef = useRef([]);
  const achievementUnlockTimeoutRef = useRef(null);
  const voyagerAuraIntervalRef = useRef(null);
  const voyagerAuraTimeoutRef = useRef(null);

  const thumbnailsTrackRef = useRef(null);
  const updateScrollFades = (track) => {
    if (!track) return;
    const { scrollLeft, scrollWidth, clientWidth } = track;
    const isAtStart = scrollLeft <= 5;
    const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 5;
    const isScrollable = scrollWidth > clientWidth;

    if (!isScrollable) {
      track.classList.remove("fade-left", "fade-right");
    } else {
      if (isAtStart) {
        track.classList.remove("fade-left");
        track.classList.add("fade-right");
      } else if (isAtEnd) {
        track.classList.add("fade-left");
        track.classList.remove("fade-right");
      } else {
        track.classList.add("fade-left");
        track.classList.add("fade-right");
      }
    }
  };

  useEffect(() => {
    if (thumbnailsTrackRef.current) {
      const timer = setTimeout(() => {
        updateScrollFades(thumbnailsTrackRef.current);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [lightboxItem]);

  const commonwealthCountries = [...countries].sort((a, b) => a.name.localeCompare(b.name));
  const filteredCountries = commonwealthCountries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearSelectionTimeline = () => {
    selectionTimelineTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    selectionTimelineTimeoutsRef.current = [];
  };

  const markUserActivity = () => {
    lastUserActivityAtRef.current = Date.now();
  };

  const clearDockSearchTimer = () => {
    if (dockSearchTimeoutRef.current) {
      clearTimeout(dockSearchTimeoutRef.current);
      dockSearchTimeoutRef.current = null;
    }
  };

  const markDockInteraction = () => {
    markUserActivity();
    setDockSearchActivityTick((value) => value + 1);
  };

  const clearAchievementUnlockTimer = () => {
    if (achievementUnlockTimeoutRef.current) {
      clearTimeout(achievementUnlockTimeoutRef.current);
      achievementUnlockTimeoutRef.current = null;
    }
  };

  const clearVoyagerProgressTimers = () => {
    if (voyagerNoticeTimeoutRef.current) {
      clearTimeout(voyagerNoticeTimeoutRef.current);
      voyagerNoticeTimeoutRef.current = null;
    }

    if (voyagerCompletionTimeoutRef.current) {
      clearTimeout(voyagerCompletionTimeoutRef.current);
      voyagerCompletionTimeoutRef.current = null;
    }

    clearAchievementUnlockTimer();
  };

  const resetVoyagerProgress = () => {
    clearVoyagerProgressTimers();
    // Clear aura timers
    if (voyagerAuraIntervalRef.current) {
      clearTimeout(voyagerAuraIntervalRef.current);
      voyagerAuraIntervalRef.current = null;
    }
    if (voyagerAuraTimeoutRef.current) {
      clearTimeout(voyagerAuraTimeoutRef.current);
      voyagerAuraTimeoutRef.current = null;
    }
    visitedVoyagerCountriesRef.current = [];
    setVisitedVoyagerCountries([]);
    setVoyagerNotice(null);
    setVoyagerCompletionVisible(false);
    setAchievementUnlocked(null);
    setIsVoyagerExpanded(false);
  };

  const clearAttractPresentation = () => {
    setHoveredCountry(null);
    setAttractAutoCountryName("");
    setAttractRouteSwooshes([]);
    setAttractHeroRoute(null);
    setAttractActiveJourney(null);
  };

  const exitIdleAttractMode = () => {
    attractExitTimeRef.current = Date.now();
    setIsIdleAttractMode(false);
    clearAttractPresentation();
  };

  useEffect(() => {
    visitedVoyagerCountriesRef.current = visitedVoyagerCountries;
  }, [visitedVoyagerCountries]);

  useEffect(() => {
    if (isIdleAttractMode) {
      resetVoyagerProgress();
    }
  }, [isIdleAttractMode]);

  useEffect(() => {
    if (isIdleAttractMode && mapRef.current) {
      mapRef.current?.getMap()?.flyTo({ center: [ATTRACT_MODE_VIEW.center[1], ATTRACT_MODE_VIEW.center[0]], zoom: ATTRACT_MODE_VIEW.zoom, duration: 2.0 * 1000 });
    }
  }, [isIdleAttractMode]);

  useEffect(() => {
    if (!selectedCountry) {
      return;
    }

    console.log("Selection state snapshot", {
      selectedCountry: selectedCountry.name,
      activatedCountryName,
      isPanelOpen,
      isPanelVisible,
    });
  }, [selectedCountry?.name, activatedCountryName, isPanelOpen, isPanelVisible]);

  const flyToCountry = (country) => {
    const map = mapRef?.current;
    if (!map) {
      return;
    }

    const mapWidth = map.getSize().x || window.innerWidth || 1280;
    const panelWidth = Math.min(920, mapWidth * 0.95);
    const rightPadding = Math.round(panelWidth + 72);

    const override = countryZoomOverrides[country.name];
    if (override) {
      map?.getMap()?.flyTo({ center: [override.center[1], override.center[0]], zoom: override.zoom, padding: { right: rightPadding }, duration: 1.6 * 1000 });
      return;
    }

    // Default flyTo using country coordinates with padding for the side panel
    map?.getMap()?.flyTo({
      center: [country.lng, country.lat],
      zoom: 4.8,
      padding: { right: rightPadding },
      duration: 1.6 * 1000
    });
  };

  const handleReset = ({ keepZoom = false, skipMenuState = false } = {}) => {
    markUserActivity();
    clearSelectionTimeline();

    if (panelOpenTimeoutRef.current) {
      clearTimeout(panelOpenTimeoutRef.current);
      panelOpenTimeoutRef.current = null;
    }

    setSelectedCountry(null);
    exitIdleAttractMode();
    setIsPanelOpen(false);
    setIsPanelVisible(false);
    setIsOverlayVisible(false);
    setIsContentVisible(false);
    setActivatedCountryName(null);
    setIsDockExpanding(false);

    if (!skipMenuState) {
      window.setTimeout(() => {
        setIsMenuOpen(false);
        setIsMenuClosing(false);
      }, 200);
    }

    if (mapRef?.current && !keepZoom) {
      mapRef.current.stop();

      // Let the panel start closing first so the map does not feel clipped,
      // then perform a soft zoom-out to the default view.
      panelOpenTimeoutRef.current = setTimeout(() => {
        if (!mapRef?.current) {
          return;
        }

        mapRef.current.invalidateSize();
        mapRef.current?.getMap()?.flyTo({
          center: [COMMONWEALTH_VIEW.center[1], COMMONWEALTH_VIEW.center[0]],
          zoom: COMMONWEALTH_VIEW.zoom,
          duration: 1.2 * 1000,
          padding: { right: 0, bottom: 0, left: 0, top: 0 }
        });
        panelOpenTimeoutRef.current = null;
      }, 180);
    }
  };

  useEffect(() => {
    window.__test_trigger = () => {
      setAchievementUnlocked({
        count: 5,
        badgeLevel: 5,
        levelName: LEVEL_NAMES[5],
      });
    };
  }, []);

  const handleSelectCountry = (countryOrName, options = {}) => {
    if (isIdleAttractMode || isAttractMode || (Date.now() - attractExitTimeRef.current < 500)) {
      if (isIdleAttractMode || isAttractMode) {
        openCountryDock();
      }
      return;
    }

    // Keep the active country card stable. Map clicks while it is open are
    // handled as outside clicks and close the card instead of switching it.
    if (selectedCountry) {
      return;
    }

    const countryObj = typeof countryOrName === "string"
      ? countries.find((c) => c.name === countryOrName)
      : countryOrName;

    if (!countryObj) {
      console.error("Country not found: ", countryOrName);
      return;
    }
    const country = countryObj;

    markUserActivity();
    clearSelectionTimeline();

    if (panelOpenTimeoutRef.current) {
      clearTimeout(panelOpenTimeoutRef.current);
      panelOpenTimeoutRef.current = null;
    }

    setSelectedCountry(country);
    exitIdleAttractMode();
    if (isMenuOpen) {
      setIsMenuClosing(true);
      window.setTimeout(() => {
        setIsMenuOpen(false);
        setIsMenuClosing(false);
      }, EXHIBIT_TRANSITION_MS);
    } else {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
    }
    const countryKey = normalizeName(country.name);
    const voyagerCountryKey = getVoyagerCountryKey(country.name);
    const alreadyVisited = visitedVoyagerCountriesRef.current.includes(voyagerCountryKey);

    if (!alreadyVisited) {
      const nextVisitedCountries = [...visitedVoyagerCountriesRef.current, voyagerCountryKey];
      visitedVoyagerCountriesRef.current = nextVisitedCountries;
      setVisitedVoyagerCountries(nextVisitedCountries);
      updateAllPasses({
        totalVisited: nextVisitedCountries.length,
        visitedNames: nextVisitedCountries,
        userId: explorerId,
      });

      clearVoyagerProgressTimers();

      // Check for milestone achievements
      const milestoneCounts = [5, 10, 25, 40, 56];
      const reachedMilestone = milestoneCounts.find(m => nextVisitedCountries.length === m);

      if (reachedMilestone) {
        setVoyagerBadgeAnimToken((value) => value + 1);
        // Fire aura immediately on milestone
        setVoyagerAuraToken((t) => t + 1);

        // Show the achievement modal. It stays open — with a Congratulations
        // message and a View Certificate action — until the visitor
        // dismisses it or starts the certificate flow, per the museum-quality
        // achievement experience (no auto-dismiss, no loud effects).
        setAchievementUnlocked({
          count: reachedMilestone,
          badgeLevel: reachedMilestone,
          levelName: LEVEL_NAMES[reachedMilestone],
        });
      } else {
        // Fire aura 800ms after a regular new country discovery
        if (voyagerAuraTimeoutRef.current) clearTimeout(voyagerAuraTimeoutRef.current);
        voyagerAuraTimeoutRef.current = window.setTimeout(() => {
          setVoyagerAuraToken((t) => t + 1);
          voyagerAuraTimeoutRef.current = null;
        }, 800);
      }

      if (nextVisitedCountries.length >= VOYAGER_TOTAL_COUNTRIES) {
        setVoyagerCompletionVisible(true);
        setVoyagerNotice({
          type: "completion",
          label: "PLATINUM COMMONWEALTH VOYAGER",
          detail: "56 of 56 Nations Explored",
        });

        voyagerCompletionTimeoutRef.current = window.setTimeout(() => {
          setVoyagerCompletionVisible(false);
          setVoyagerNotice(null);
          voyagerCompletionTimeoutRef.current = null;
        }, 3200);
      } else {
        setVoyagerNotice({
          type: "discovery",
          label: `${voyagerCountryKey === "united kingdom" ? "United Kingdom" : country.name} added`,
          detail: null,
        });

        voyagerNoticeTimeoutRef.current = window.setTimeout(() => {
          setVoyagerNotice(null);
          voyagerNoticeTimeoutRef.current = null;
        }, 2400);
      }
    }
    setHeroMotionSeed((value) => value + 1);
    selectedCountryKeyRef.current = countryKey;
    panelScrolledRef.current = false;
    setActivatedCountryName(country.name);

    setIsPanelOpen(true);
    setIsOverlayVisible(true);
    setIsContentVisible(true);

    // Trigger smooth GPU transition in next frame
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setIsPanelVisible(true);
      });
    });

    selectionTimelineTimeoutsRef.current = [];

    flyToCountry(country);
  };

  const handleClosePanel = () => {
    handleReset();
  };

  const handleViewEntireCommonwealth = () => {
    handleReset();
  };

  const beginExploration = () => {
    markUserActivity();

    // Exit idle/attract mode first and keep the dock closed so the Explore button is shown.
    setIsIdleAttractMode(false);
    clearAttractPresentation();
    setIsMenuOpen(false);
    setIsMenuClosing(false);

    // Fly back to the default overview so the user starts with the full map
    if (mapRef?.current) {
      mapRef.current.stop();
      mapRef.current.invalidateSize();
      mapRef.current?.getMap()?.flyTo({ center: [COMMONWEALTH_VIEW.center[1], COMMONWEALTH_VIEW.center[0]], zoom: COMMONWEALTH_VIEW.zoom, duration: 1.2 * 1000 });
    }

    // Start periodic idle aura ticks while exploring
    scheduleVoyagerAuraIdleTick();
  };

  const openCountryDock = () => {
    markUserActivity();
    setIsButtonTransitioning(true);
    setIsDockExpanding(false);

    const wasAttractMode = isIdleAttractMode;

    // Exit idle mode cleanly
    attractExitTimeRef.current = Date.now();
    setIsIdleAttractMode(false);
    clearAttractPresentation();

    // Smoothly zoom out map to world/Commonwealth overview when leaving attract mode
    if (wasAttractMode && mapRef.current) {
      mapRef.current?.getMap()?.flyTo({
        center: [COMMONWEALTH_VIEW.center[1], COMMONWEALTH_VIEW.center[0]],
        zoom: COMMONWEALTH_VIEW.zoom,
        duration: 1.8 * 1000,
        essential: true,
      });
    }

    setIsMenuClosing(false);
    setIsMenuOpening(false);
    setIsMenuOpen(true);

    // Cleanup transition state after animation completes
    window.setTimeout(() => {
      setIsButtonTransitioning(false);
    }, EXHIBIT_TRANSITION_MS);

    // Start periodic idle aura ticks while exploring
    scheduleVoyagerAuraIdleTick();
  };

  const handleExploreCommonwealthPress = () => {
    if (selectedCountry) {
      handleReset({ skipMenuState: true });
      openCountryDock();
      return;
    }

    // First interaction leaves attract mode and directly opens the country dock.
    if (isIdleAttractMode) {
      openCountryDock();
      return;
    }

    openCountryDock();
  };

  const handleGeojsonLoad = (data) => {
    setGeojson(data);
    setMapLoadError("");
  };

  const handleGeojsonError = (message = "") => {
    setMapLoadError(message);
  };

  const handleCountryHover = (countryName = null, pos = null) => {
    if (countryName) {
      markUserActivity();
    }
    setHoveredCountry(countryName);
    setHoveredCountryPos(pos);
  };

  // Get country data with Wikidata cache fallback to countries.json
  const getCountryData = (country) => {
    const lookupKeys = getCountryLookupKeys(country.name);
    const cached = lookupKeys.reduce((match, lookupKey) => match || countryDataCache[lookupKey], null);

    if (cached) {
      return {
        capital: cached.capital || country.capital || "Not available",
        population: cached.population || country.population || null,
        source: cached.source || "Wikidata",
      };
    }

    if (!loggedMissingApiMatches.current.has(country.name)) {
      console.log("No API match:", country.name);
      loggedMissingApiMatches.current.add(country.name);
    }

    return {
      capital: country.capital || "Not available",
      population: country.population || null,
      source: null,
    };
  };

  const persistFamilySearchCache = () => {
    try {
      const payload = {
        updatedAt: Date.now(),
        collectionsByCountry: familySearchCollectionsCacheRef.current,
        urlByCountry: familySearchCollectionUrlCacheRef.current,
      };
      localStorage.setItem(FAMILYSEARCH_CACHE_STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {
      // Ignore storage quota/access issues.
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAMILYSEARCH_CACHE_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      const isFresh = parsed?.updatedAt && Date.now() - parsed.updatedAt < FAMILYSEARCH_CACHE_TTL_MS;

      if (isFresh) {
        const sanitizedCollectionsByCountry = sanitizeCollectionsByCountryMap(parsed.collectionsByCountry || {});
        familySearchCollectionsCacheRef.current = sanitizedCollectionsByCountry;
        familySearchCollectionUrlCacheRef.current = parsed.urlByCountry || {};

        // Rewrite stale cached items (legacy slug links / genealogies) with sanitized data.
        if (JSON.stringify(sanitizedCollectionsByCountry) !== JSON.stringify(parsed.collectionsByCountry || {})) {
          persistFamilySearchCache();
        }
      } else {
        localStorage.removeItem(FAMILYSEARCH_CACHE_STORAGE_KEY);
      }
    } catch (_) {
      localStorage.removeItem(FAMILYSEARCH_CACHE_STORAGE_KEY);
    } finally {
      setIsFamilySearchCacheReady(true);
    }
  }, []);

  const loadFamilySearchCollectionsForCountry = async (countryName) => {
    const cacheKey = normalizeName(countryName);

    // Check in-memory cache first (from previous live fetches)
    if (Object.prototype.hasOwnProperty.call(familySearchCollectionsCacheRef.current, cacheKey)) {
      const cachedCollections = familySearchCollectionsCacheRef.current[cacheKey];
      const sanitizedCachedCollections = sanitizeFamilySearchCollections(cachedCollections);

      if (
        Array.isArray(cachedCollections)
        && sanitizedCachedCollections.length !== cachedCollections.length
      ) {
        familySearchCollectionsCacheRef.current[cacheKey] = sanitizedCachedCollections;
        persistFamilySearchCache();
      }

      return sanitizedCachedCollections;
    }

    // Mark as in-flight to avoid duplicate requests
    if (Object.prototype.hasOwnProperty.call(familySearchCollectionsInFlightRef.current, cacheKey)) {
      return familySearchCollectionsInFlightRef.current[cacheKey];
    }

    // Try fetching live data from the FamilySearch country location page via Jina AI mirror
    const locationUrl = getFamilySearchLocationUrl(countryName);
    if (locationUrl) {
      const fetchUrl = toFamilySearchFetchUrl(locationUrl);
      if (fetchUrl) {
        familySearchCollectionsInFlightRef.current[cacheKey] = [];
        try {
          const response = await fetch(fetchUrl, {
            headers: {
              "Accept": "text/plain, text/markdown",
              "X-Return-Format": "markdown",
            },
          });
          if (response.ok) {
            const pageText = await response.text();
            if (pageText && pageText.length > 50) {
              if (
                pageText.includes("404 Not Found") ||
                pageText.includes("StandardError") ||
                pageText.includes("Something Went Wrong") ||
                pageText.includes("UnknownError") ||
                /failed to fetch/i.test(pageText) ||
                /could not be retrieved/i.test(pageText)
              ) {
                setBrokenLocationUrls((prev) => {
                  const next = new Set(prev);
                  next.add(locationUrl);
                  persistBrokenLocationUrls(next);
                  return next;
                });
              } else {
                const parsed = parseFamilySearchCollectionsFromLocationPage(pageText);
                const allCollections = [
                  ...(parsed.records || []),
                  ...(parsed.imageOnly || []),
                  ...(parsed.genealogies || []),
                ];
                const liveCollections = sanitizeFamilySearchCollections(allCollections);

                if (liveCollections.length > 0) {
                  familySearchCollectionsCacheRef.current[cacheKey] = liveCollections;
                  persistFamilySearchCache();
                  return liveCollections;
                }
              }
            }
          } else if (response.status === 404 || response.status === 422) {
            setBrokenLocationUrls((prev) => {
              const next = new Set(prev);
              next.add(locationUrl);
              persistBrokenLocationUrls(next);
              return next;
            });
          }
        } catch (err) {
          console.log("Failed to fetch FamilySearch data for:", countryName, err.message);
        }
        delete familySearchCollectionsInFlightRef.current[cacheKey];
      }
    }

    // Fall back to static bundled data if live fetch failed
    const bundledData = countryDataBundle[countryName]?.familySearch;
    if (bundledData && Array.isArray(bundledData) && bundledData.length > 0) {
      const sanitizedCollections = sanitizeFamilySearchCollections(bundledData);

      if (sanitizedCollections.length > 0) {
        familySearchCollectionsCacheRef.current[cacheKey] = sanitizedCollections;
        try {
          persistFamilySearchCache();
        } catch (_) {}
        return sanitizedCollections;
      }
    }

    familySearchCollectionsCacheRef.current[cacheKey] = [];
    return [];
  };

  useEffect(() => {
    selectedCountryKeyRef.current = selectedCountry ? normalizeName(selectedCountry.name) : "";
  }, [selectedCountry?.name]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!lightboxItem && event.key !== "Escape") {
        return;
      }

      if (event.key === "Escape") {
        setLightboxItem(null);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setLightboxItem((currentItem) => {
          if (!currentItem || !galleryItems.length) {
            return currentItem;
          }

          const currentIndex = galleryItems.findIndex((item) => item.id === currentItem.id);
          if (currentIndex < 0) {
            return currentItem;
          }

          const previousIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
          return galleryItems[previousIndex];
        });
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setLightboxItem((currentItem) => {
          if (!currentItem || !galleryItems.length) {
            return currentItem;
          }

          const currentIndex = galleryItems.findIndex((item) => item.id === currentItem.id);
          if (currentIndex < 0) {
            return currentItem;
          }

          const nextIndex = (currentIndex + 1) % galleryItems.length;
          return galleryItems[nextIndex];
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxItem]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;

    if (lightboxItem) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [lightboxItem]);

  useEffect(() => {
    if (!galleryTrackRef.current) {
      setShowGalleryNavigation(false);
      setGalleryActiveIndex(0);
      return;
    }

    const track = galleryTrackRef.current;

    // Calculate and set gallery state — only called on mount and window resize
    const updateGalleryAffordances = () => {
      setShowGalleryNavigation(track.scrollWidth - track.clientWidth > 4);

      const trackChildren = Array.from(track.children);
      if (!trackChildren.length) {
        setGalleryActiveIndex(0);
        return;
      }

      const trackCenter = track.scrollLeft + track.clientWidth / 2;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      trackChildren.forEach((child, index) => {
        const childCenter = child.offsetLeft + child.clientWidth / 2;
        const distance = Math.abs(childCenter - trackCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      setGalleryActiveIndex(nearestIndex);
    };

    updateGalleryAffordances();

    // NOTE: Only listen for horizontal gallery scroll — not vertical panel scroll.
    // Debounce via rAF so rapid scroll events are batched into one React state update.
    let rafId = null;
    const handleGalleryScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const trackChildren = Array.from(track.children);
        if (!trackChildren.length) return;
        const trackCenter = track.scrollLeft + track.clientWidth / 2;
        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;
        trackChildren.forEach((child, index) => {
          const childCenter = child.offsetLeft + child.clientWidth / 2;
          const distance = Math.abs(childCenter - trackCenter);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });
        setGalleryActiveIndex(nearestIndex);
      });
    };

    track.addEventListener("scroll", handleGalleryScroll, { passive: true });

    // ResizeObserver removed — it fired on every vertical panel scroll
    // because scrolling changes the gallery element's bounding rect.
    // Window resize is enough to recalculate navigation visibility.
    window.addEventListener("resize", updateGalleryAffordances);

    return () => {
      track.removeEventListener("scroll", handleGalleryScroll);
      window.removeEventListener("resize", updateGalleryAffordances);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [selectedCountry?.name, isPanelOpen]);

  useEffect(() => {
    return () => {
      clearSelectionTimeline();
      if (panelOpenTimeoutRef.current) {
        clearTimeout(panelOpenTimeoutRef.current);
      }
      clearDockSearchTimer();
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      setIsMenuOpening(false);
      return;
    }

    setIsMenuOpening(true);

    const frameA = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setIsMenuOpening(false);
      });
    });

    return () => {
      window.cancelAnimationFrame(frameA);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    clearDockSearchTimer();

    if (!isMenuOpen || !isDockSearchExpanded) {
      return;
    }

    dockSearchTimeoutRef.current = window.setTimeout(() => {
      setIsDockSearchExpanded(false);
      setSearchTerm("");
    }, KIOSK_DOCK_SEARCH_IDLE_TIMEOUT_MS);

    return () => {
      clearDockSearchTimer();
    };
  }, [isMenuOpen, isDockSearchExpanded, searchTerm, dockSearchActivityTick]);

  useEffect(() => {
    const scheduleIdleTransition = () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }

      const elapsedMs = Date.now() - lastUserActivityAtRef.current;
      const remainingMs = Math.max(0, KIOSK_IDLE_TIMEOUT_MS - elapsedMs);

      idleTimeoutRef.current = window.setTimeout(() => {
        const isBusy = Boolean(selectedCountry || isMenuOpen || lightboxItem);
        const hasReachedIdleThreshold =
          Date.now() - lastUserActivityAtRef.current >= KIOSK_IDLE_TIMEOUT_MS;

        if (isBusy || !hasReachedIdleThreshold) {
          scheduleIdleTransition();
          return;
        }

        setSearchTerm("");
        clearAttractPresentation();
        setIsIdleAttractMode(true);
      }, remainingMs);
    };

    const markActivity = (event) => {
      const type = event?.type || "unknown";
      const now = Date.now();
      const isMoveLike = type === "pointermove" || type === "mousemove" || type === "touchmove";

      if (isMoveLike) {
        if (now - lastMoveActivityAtRef.current < 1200) {
          return;
        }
        lastMoveActivityAtRef.current = now;
      }

      lastUserActivityAtRef.current = now;

      if (isIdleAttractMode && /pointerdown|touchstart|click|keydown/.test(type)) {
        setTimeout(() => {
          exitIdleAttractMode();
        }, 0);
      }

      scheduleIdleTransition();
    };

    scheduleIdleTransition();

    const events = [
      "pointermove",
      "pointerdown",
      "touchstart",
      "touchmove",
      "click",
      "scroll",
      "wheel",
      "keydown",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });

      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
    };
  }, [selectedCountry, isMenuOpen, lightboxItem, isIdleAttractMode]);

  // When a country is selected, ensure the dock is hidden and Explore button can return.
  useEffect(() => {
    if (selectedCountry) {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
    }
  }, [selectedCountry?.name]);

  useEffect(() => {
    const isMapOnly = !isMenuOpen && !selectedCountry && !isIdleAttractMode;
    if (isMapOnly) {
      if (!mapOnlyStartTime) {
        setMapOnlyStartTime(Date.now());
      }
    } else {
      setMapOnlyStartTime(null);
    }
  }, [isMenuOpen, selectedCountry, isIdleAttractMode, mapOnlyStartTime]);

  useEffect(() => {
    setIsOverviewExpanded(false);
  }, [selectedCountry?.name]);

  useEffect(() => {
    recordTitleRefs.current = [];
    setRecordCollectionsDisplayLimit(3);
  }, [selectedCountry?.name]);

  useEffect(() => {
    const overviewElement = overviewTextRef.current;

    if (!overviewElement || !selectedCountry) {
      setHasOverviewOverflow(false);
      return;
    }

    const checkOverflow = () => {
      setHasOverviewOverflow(overviewElement.scrollHeight > overviewElement.clientHeight + 1);
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);

    return () => {
      window.removeEventListener("resize", checkOverflow);
    };
  }, [selectedCountry?.name, isPanelVisible]);

  useEffect(() => {
    if (!isFamilySearchCacheReady) {
      return;
    }

    if (!selectedCountry) {
      setFamilySearchCollections([]);
      setIsFamilySearchCollectionsLoading(false);
      return;
    }

    let isActive = true;
    const cacheKey = normalizeName(selectedCountry.name);
    const hasCachedCollections = Object.prototype.hasOwnProperty.call(
      familySearchCollectionsCacheRef.current,
      cacheKey
    );

    if (hasCachedCollections) {
      const cachedCollections = sanitizeFamilySearchCollections(familySearchCollectionsCacheRef.current[cacheKey]);
      setFamilySearchCollections(cachedCollections || []);
      setIsFamilySearchCollectionsLoading(false);

      if (Array.isArray(cachedCollections) && cachedCollections.length === 0) {
        setIsFamilySearchCollectionsLoading(true);
        loadFamilySearchCollectionsForCountry(selectedCountry.name).then((collections) => {
          if (isActive && Array.isArray(collections) && collections.length > 0) {
            setFamilySearchCollections(collections);
          }
          if (isActive) {
            setIsFamilySearchCollectionsLoading(false);
          }
        });
      }

      return () => {
        isActive = false;
      };
    }

    // Try loading static bundled data immediately to show something to the user instantly
    const bundledData = countryDataBundle[selectedCountry.name]?.familySearch;
    const initialCollections = bundledData && Array.isArray(bundledData)
      ? sanitizeFamilySearchCollections(bundledData)
      : [];

    setFamilySearchCollections(initialCollections);
    setIsFamilySearchCollectionsLoading(true);

    loadFamilySearchCollectionsForCountry(selectedCountry.name).then((collections) => {
      if (isActive) {
        if (collections && collections.length > 0) {
          setFamilySearchCollections(collections);
        }
        setIsFamilySearchCollectionsLoading(false);
      }
    });

    return () => {
      isActive = false;
    };
  }, [selectedCountry?.name, isFamilySearchCacheReady]);

  // Prefetch FamilySearch collections for all countries into the cache (background)
  useEffect(() => {
    if (!isFamilySearchCacheReady) return;

    let cancelled = false;

    (async () => {
      const countryNames = countries.map((c) => c.name);
      // Simple sequential prefetch with a small delay to avoid bursting requests
      for (const name of countryNames) {
        if (cancelled) return;
        const key = normalizeName(name);
        if (Object.prototype.hasOwnProperty.call(familySearchCollectionsCacheRef.current, key)) {
          continue;
        }

        try {
          // Trigger load which will persist when it finds live or bundled data
          // Do not await aggressively — wait for each to finish to limit concurrency
          // and avoid many simultaneous mirror requests.
          // A small delay between requests reduces load further.
          // eslint-disable-next-line no-await-in-loop
          await loadFamilySearchCollectionsForCountry(name);
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 220));
        } catch (err) {
          // swallow individual errors and continue
          // eslint-disable-next-line no-console
          console.log('Prefetch FamilySearch failed for', name, err?.message || err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isFamilySearchCacheReady]);

  // One-time, URL-gated force refresh: visit the app with
  // `?forceFamilySearchRefresh=1` to clear the FamilySearch cache and
  // re-run the prefetch immediately (useful for QA/dev).
  useEffect(() => {
    if (!isFamilySearchCacheReady) return;

    try {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      if (!params || params.get('forceFamilySearchRefresh') !== '1') return;

      (async () => {
        console.log('Force FamilySearch cache refresh requested. Clearing cache...');
        try {
          localStorage.removeItem(FAMILYSEARCH_CACHE_STORAGE_KEY);
        } catch (_) {}
        familySearchCollectionsCacheRef.current = {};
        familySearchCollectionUrlCacheRef.current = {};
        persistFamilySearchCache();

        const countryNames = countries.map((c) => c.name);
        for (const name of countryNames) {
          try {
            // eslint-disable-next-line no-await-in-loop
            await loadFamilySearchCollectionsForCountry(name);
            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => setTimeout(r, 200));
          } catch (err) {
            // continue on errors
            // eslint-disable-next-line no-console
            console.log('Prefetch error for', name, err?.message || err);
          }
        }

        console.log('FamilySearch cache force-refresh complete.');
        // Remove the query param from the URL to avoid accidental repeats
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('forceFamilySearchRefresh');
          window.history.replaceState(null, '', url.toString());
        } catch (_) {}
      })();
    } catch (err) {
      // ignore
    }
  }, [isFamilySearchCacheReady]);

  const selectedCountryMetadata = selectedCountry
    ? getLookupValue(commonwealthMetadataByLookup, selectedCountry.name)
    : null;

  const detailItems = selectedCountry
    ? (() => {
      const data = selectedCountry ? getCountryData(selectedCountry) : null;
      const items = data
        ? [
          { label: "Capital", value: data.capital },
          { label: "Population", value: data.population ? formatPopulation(data.population) : "Not available" },
        ]
        : [];
      if (selectedCountryMetadata?.memberSince) {
        items.push({ label: "Member Since", value: String(selectedCountryMetadata.memberSince) });
      }
      return items;
    })()
    : [];
  const detailStatItems = detailItems.filter((item) => item.label !== "Member Since");
  const familySearchLocationUrl = selectedCountry
    ? appendFamilySearchCampaignId(getFamilySearchLocationUrl(selectedCountry.name))
    : null;
  const showFamilySearchLocationUrl =
    familySearchLocationUrl &&
    selectedCountry &&
    !brokenLocationUrls.has(getFamilySearchLocationUrl(selectedCountry.name));
  const visibleFamilySearchCollections = sanitizeFamilySearchCollections(familySearchCollections).filter(
    (collection) => !/no collections found/i.test(collection.title)
  );
  const {
    categoryLabel: familySearchCollectionsCategoryLabel,
    collections: visibleFamilySearchPreferredCollections,
    hasRecords: hasFamilySearchRecordCollections,
    hasImageOnly: hasFamilySearchImageOnlyCollections,
    hasGenealogies: hasFamilySearchGenealogyCollections,
  } = getFamilySearchCollectionsForFallback(visibleFamilySearchCollections);
  const isGenealogyCollectionsView = familySearchCollectionsCategoryLabel === "Genealogies Available";
  const isImageOnlyCollectionsView = familySearchCollectionsCategoryLabel === "Image-Only Records Available";

  const voyagerProgressCount = visitedVoyagerCountries.length;
  const voyagerCountriesUntilSurprise = Math.max(5 - voyagerProgressCount, 0);
  const voyagerProgressPercent = Math.min((voyagerProgressCount / VOYAGER_TOTAL_COUNTRIES) * 100, 100);
  const voyagerProgressTitle = getVoyagerTitle(voyagerProgressCount);
  const activeCertificateBadgeLevel = achievementUnlocked?.badgeLevel || getVoyagerBadgeLevel(voyagerProgressCount);
  const activeCertificateLevelName = activeCertificateBadgeLevel ? LEVEL_NAMES[activeCertificateBadgeLevel] : null;
  const voyagerPillLabel = voyagerProgressCount >= 5
    ? voyagerProgressTitle
    : `${voyagerCountriesUntilSurprise} ${voyagerCountriesUntilSurprise === 1 ? "country" : "countries"} to go!`;
  // The compact pill is right-anchored, so extra room grows to the left and
  // always leaves breathing room after the progress count.
  const voyagerCollapsedWidth = Math.max(200, Math.ceil(96 + voyagerPillLabel.length * 8.5));
  const displayedFamilySearchPreferredCollections = visibleFamilySearchPreferredCollections.slice(
    0,
    recordCollectionsDisplayLimit
  );
  const hasCollections = displayedFamilySearchPreferredCollections.length > 0;
  const selectedCountryResearchLinks = selectedCountry
    ? getLookupValue(countryResearchLinksByLookup, selectedCountry.name)
    : null;
  const researchHelpEntries = [
    {
      key: "gettingStarted",
      label: "Getting Started",
      value: selectedCountryResearchLinks?.gettingStarted,
    },
    {
      key: "onlineResearchHelp",
      label: "Online Research Help",
      value: selectedCountryResearchLinks?.onlineResearchHelp,
    },
    {
      key: "genealogyRecords",
      label: "Genealogy Records",
      value: selectedCountryResearchLinks?.genealogyRecords,
    },
  ].filter((entry) => entry.value?.url).map((entry) => {
    if (/https?:\/\/(www\.)?familysearch\.org/i.test(entry.value.url)) {
      return {
        ...entry,
        value: {
          ...entry.value,
          url: appendFamilySearchCampaignId(entry.value.url),
        },
      };
    }
    return entry;
  });

  const LINK_BASE_COLOR = "#87b940";
  const LINK_HOVER_COLOR = "#9ecd4e";
  const SUBTLE_DARK_CARD_TEXT_COLOR = "rgba(255,255,255,0.65)";
  const STORY_CARD_SIDE_PADDING = "2rem";
  const springEase = "cubic-bezier(0.22, 1, 0.36, 1)";
  const DEFAULT_HERO_IMAGE_URL = "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80";
  const HERO_IMAGE_ALLOWED_TERMS = /(landscape|cityscape|skyline|mountain|coast|nature|panorama|aerial|harbor|waterfront|architecture|scenic)/i;
  const HERO_IMAGE_BLOCKED_TERMS = /(people|person|portrait|selfie|face|crowd|group|wedding|fashion|product|object|still\s?life|abstract|illustration|graphic|pattern)/i;
  const HERO_IMAGE_NON_COUNTRY_TERMS = /(flag|coat\s*of\s*arms|logo|seal|locator\s*map|map\s*of)/i;
  const WIKIPEDIA_TITLE_OVERRIDES = {
    "the bahamas": "Bahamas",
    "the gambia": "Gambia",
    "brunei darussalam": "Brunei",
    "united republic of tanzania": "Tanzania",
    "st kitts and nevis": "Saint Kitts and Nevis",
    "st vincent and the grenadines": "Saint Vincent and the Grenadines",
  };

  const getCountryMatchTerms = (countryName = "") => {
    const raw = countryName.toLowerCase().trim();
    const terms = new Set([raw]);
    const noLeadingThe = raw.replace(/^the\s+/, "").trim();
    if (noLeadingThe) {
      terms.add(noLeadingThe);
    }
    terms.add(raw.replace(/\bst\b/g, "saint"));
    terms.add(raw.replace(/\bsaint\b/g, "st"));
    terms.add(raw.replace(/\bunited republic of\b/g, ""));
    return [...terms].map((term) => term.replace(/\s+/g, " ").trim()).filter(Boolean);
  };

  const doesUrlContainCountryTerm = (url = "", countryName = "") => {
    const decodedUrl = decodeURIComponent(url).toLowerCase();
    const terms = getCountryMatchTerms(countryName);

    return terms.some((term) => {
      const compact = term.replace(/\s+/g, "");
      const hyphenated = term.replace(/\s+/g, "-");
      const underscored = term.replace(/\s+/g, "_");
      return (
        decodedUrl.includes(term) ||
        decodedUrl.includes(compact) ||
        decodedUrl.includes(hyphenated) ||
        decodedUrl.includes(underscored)
      );
    });
  };

  const openCertificateFlow = () => {
    const badgeLevel = getVoyagerBadgeLevel(voyagerProgressCount);
    if (!badgeLevel) {
      return;
    }

    if (!achievementUnlocked) {
      setAchievementUnlocked({
        count: badgeLevel,
        badgeLevel,
        levelName: LEVEL_NAMES[badgeLevel],
      });
    }

    setCertificateStep('name');
    setIsVoyagerExpanded(false);
  };

  const isCountrySpecificHeroUrl = (url = "", countryName = "") => {
    if (!url || !countryName) {
      return false;
    }

    const decodedUrl = decodeURIComponent(url).toLowerCase();
    const isWikimedia = /upload\.wikimedia\.org|wikimedia\.org/i.test(decodedUrl);
    if (isWikimedia) {
      if (HERO_IMAGE_NON_COUNTRY_TERMS.test(decodedUrl)) {
        return false;
      }
      return doesUrlContainCountryTerm(decodedUrl, countryName);
    }

    return doesUrlContainCountryTerm(decodedUrl, countryName);
  };

  const isPreferredHeroImageProvider = (url = "") => {
    if (!url) {
      return false;
    }

    return /(images\.unsplash\.com|unsplash\.com|images\.pexels\.com|pexels\.com|pixabay\.com|cdn\.pixabay\.com|upload\.wikimedia\.org|wikimedia\.org)/i.test(url);
  };

  const isLandscapeOrCityscapeHeroUrl = (url = "") => {
    if (!isPreferredHeroImageProvider(url)) {
      return false;
    }

    const decodedUrl = decodeURIComponent(url).toLowerCase();
    if (/upload\.wikimedia\.org|wikimedia\.org/i.test(decodedUrl)) {
      return true;
    }

    if (HERO_IMAGE_BLOCKED_TERMS.test(decodedUrl)) {
      return false;
    }

    return HERO_IMAGE_ALLOWED_TERMS.test(decodedUrl);
  };

  const buildUnsplashHeroFallbackUrl = (countryName = "") => {
    const query = encodeURIComponent(`${countryName} cityscape landscape skyline scenic nature`);
    return `https://source.unsplash.com/1600x900/?${query}&orientation=landscape`;
  };

  const fetchCountrySpecificWikimediaHero = async (countryName = "") => {
    if (!countryName) {
      return null;
    }

    try {
      const bundledImages = countryDataBundle[countryName]?.images;
      if (bundledImages && bundledImages.length > 0) {
        for (const img of bundledImages) {
          if (img.url) {
            const valid = await testImageUrl(img.url, 6000);
            if (valid) return img.url;
          }
        }
      }
    } catch {
      return null;
    }

    return null;
  };

  const testImageUrl = (url, timeoutMs = 5000) => {
    return new Promise((resolve) => {
      const img = new Image();
      let settled = false;

      const finish = (result) => {
        if (settled) return;
        settled = true;
        img.onload = null;
        img.onerror = null;
        resolve(result);
      };

      img.onload = () => {
        const hasMinimumSize = img.naturalWidth > 100 && img.naturalHeight > 100;
        const isLandscape = img.naturalWidth >= img.naturalHeight * 1.2;
        finish(hasMinimumSize && isLandscape);
      };
      img.onerror = () => finish(false);
      setTimeout(() => finish(false), timeoutMs);
      img.src = url;
    });
  };

  const selectedCountryHeroImage = selectedCountry?.image || DEFAULT_HERO_IMAGE_URL;

  useEffect(() => {
    if (!selectedCountry) {
      setValidatedHeroImage(null);
      return;
    }

    let isActive = true;
    // Use curated image from countries.json and only fall back if it fails to load.
    const candidateUrl = selectedCountry.image || null;

    setValidatedHeroImage(candidateUrl || DEFAULT_HERO_IMAGE_URL);

    const validate = async () => {
      if (candidateUrl) {
        const candidateValid = await testImageUrl(candidateUrl);
        if (!isActive) return;

        if (candidateValid) {
          return;
        }
      }

      setValidatedHeroImage(DEFAULT_HERO_IMAGE_URL);
    };

    validate();

    return () => {
      isActive = false;
    };
  }, [selectedCountry?.name, selectedCountry?.image]);

  const getRevealStyle = (order, baseDelay = 0) => ({
    opacity: isContentVisible ? 1 : 0,
    transform: isContentVisible ? "translateY(0)" : "translateY(15px)",
    transition: `opacity 380ms ${springEase}, transform 420ms ${springEase}`,
    transitionDelay: isContentVisible ? `${baseDelay + order * 50}ms` : "0ms",
    willChange: "opacity, transform",
  });

  const handlePressableMouseEnter = (event) => {
    event.currentTarget.style.transform = "scale(1.02)";
  };

  const handlePressableMouseLeave = (event) => {
    event.currentTarget.style.transform = "scale(1)";
  };

  const handlePressableMouseDown = (event) => {
    event.currentTarget.style.transform = "scale(0.98)";
  };

  const handlePressableMouseUp = (event) => {
    event.currentTarget.style.transform = "scale(1.02)";
  };

  const seeMoreLikeLinkStyle = {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.45rem",
    color: LINK_BASE_COLOR,
    fontSize: "0.9rem",
    fontWeight: 600,
    textDecoration: "none",
    padding: "0.3rem 0",
    transform: "translateX(0)",
    transition: "color 150ms ease, opacity 150ms ease, transform 150ms ease",
  };

  const familySearchRecordLinkStyle = {
    display: "block",
    textAlign: "left",
    color: LINK_BASE_COLOR,
    lineHeight: 1.5,
    fontSize: "0.9rem",
    fontWeight: 500,
    textDecoration: "none",
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    width: "100%",
    transform: "translateX(0)",
    transition: "color 150ms ease, opacity 150ms ease, transform 150ms ease",
  };

  const researchHelpLinkStyle = {
    ...familySearchRecordLinkStyle,
    color: LINK_BASE_COLOR,
  };

  const handleFamilySearchRecordMouseEnter = (event) => {
    event.currentTarget.style.color = LINK_HOVER_COLOR;
    event.currentTarget.style.opacity = "0.95";
    event.currentTarget.style.transform = "translateX(4px)";
  };

  const handleFamilySearchRecordMouseLeave = (event) => {
    event.currentTarget.style.color = LINK_BASE_COLOR;
    event.currentTarget.style.opacity = "1";
    event.currentTarget.style.transform = "translateX(0)";
  };

  const handleSeeMoreLikeLinkMouseEnter = (event) => {
    event.currentTarget.style.color = LINK_HOVER_COLOR;
    event.currentTarget.style.opacity = "0.95";
    event.currentTarget.style.transform = "translateX(4px)";
  };

  const handleSeeMoreLikeLinkMouseLeave = (event) => {
    event.currentTarget.style.color = LINK_BASE_COLOR;
    event.currentTarget.style.opacity = "1";
    event.currentTarget.style.transform = "translateX(0)";
  };

  const handleResearchHelpMouseEnter = (event) => {
    event.currentTarget.style.color = LINK_HOVER_COLOR;
    event.currentTarget.style.opacity = "0.95";
    event.currentTarget.style.transform = "translateX(4px)";
  };

  const handleResearchHelpMouseLeave = (event) => {
    event.currentTarget.style.color = LINK_BASE_COLOR;
    event.currentTarget.style.opacity = "1";
    event.currentTarget.style.transform = "translateX(0)";
  };

  const renderLinkArrowIcon = () => {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M5 12H19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13 6L19 12L13 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const renderGlobeIcon = (size = 16) => {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 12H21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 3C14.6 5.5 16 8.6 16 12C16 15.4 14.6 18.5 12 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 3C9.4 5.5 8 8.6 8 12C8 15.4 9.4 18.5 12 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  };

  const renderGiftIcon = (size = 15) => {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M4 10H20V20H4V10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 10V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M3 10H21V7C21 6.45 20.55 6 20 6H4C3.45 6 3 6.45 3 7V10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 6C12 4.34 13.34 3 15 3C16.66 3 18 4.34 18 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 6C12 4.34 10.66 3 9 3C7.34 3 6 4.34 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  };

  const renderTrophyIcon = (size = 20) => {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="trophyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#87B940" />
            <stop offset="100%" stopColor="#1BA9E6" />
          </linearGradient>
        </defs>
        {/* Sleeker Cup + Thinner Handles */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7 3.5C7 3.22386 7.22386 3 7.5 3H16.5C16.7761 3 17 3.22386 17 3.5V8C17 10.7614 14.7614 13 12 13C9.23858 13 7 10.7614 7 8V3.5ZM5.2 4.8C4.54 4.8 4 5.34 4 6C4 7.5 5.1 8.7 6.5 9.1V7.7C5.8 7.4 5.4 6.8 5.4 6C5.4 5.7 5.6 5.4 5.9 5.3L6.5 5.1V4.8H5.2ZM18.8 4.8C19.46 4.8 20 5.34 20 6C20 7.5 18.9 8.7 17.5 9.1V7.7C18.2 7.4 18.6 6.8 18.6 6C18.6 5.7 18.4 5.4 18.1 5.3L17.5 5.1V4.8H18.8Z"
          fill="url(#trophyGradient)"
        />
        {/* Slender Stem & Pedestal */}
        <path
          d="M10 14C9.4 15.2 8.8 16.3 7.8 17H16.2C15.2 16.3 14.6 15.2 14 14H10Z"
          fill="url(#trophyGradient)"
        />
        {/* Sleek Base Plate */}
        <rect
          x="6"
          y="18.2"
          width="12"
          height="2"
          rx="0.5"
          fill="url(#trophyGradient)"
        />
      </svg>
    );
  };

  const VOYAGER_BADGES = {
    5: { icon: BADGE_ICONS[5] },
    10: { icon: BADGE_ICONS[10] },
    25: { icon: BADGE_ICONS[25] },
    40: { icon: BADGE_ICONS[40] },
    56: { icon: BADGE_ICONS[56] },
  };

  const renderVoyagerBadge = (count, size = "full", shouldBounce = false) => {
    // Determine which badge to show based on current progress
    let badgeLevel = null;
    if (count >= 56) badgeLevel = 56;
    else if (count >= 40) badgeLevel = 40;
    else if (count >= 25) badgeLevel = 25;
    else if (count >= 10) badgeLevel = 10;
    else if (count >= 5) badgeLevel = 5;

    if (!badgeLevel) return null;

    const badge = VOYAGER_BADGES[badgeLevel];
    if (!badge) return null;

    const isSmall = size === "small";
    const badgeColors = {
      5: { primary: "#87B940", glow: "rgba(135, 185, 64, 0.6)" },
      10: { primary: "#9C947A", glow: "rgba(156, 148, 122, 0.56)" },
      25: { primary: "#27C4F4", glow: "rgba(39, 196, 244, 0.58)" },
      40: { primary: "#F16458", glow: "rgba(241, 100, 88, 0.58)" },
      56: { primary: "#996799", glow: "rgba(153, 103, 153, 0.64)" },
    };

    const colors = badgeColors[badgeLevel];

    return (
      <div style={{
        width: isSmall ? "32px" : "64px",
        height: isSmall ? "32px" : "64px",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: shouldBounce
          ? "badgeScale 700ms cubic-bezier(0.34, 1.56, 0.64, 1)"
          : isSmall
            ? "none"
            : "badgePulse 3s ease-in-out infinite",
        transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}>
        <div style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 0,
        }}>
          {badge.icon}
        </div>
      </div>
    );
  };

  const getBadgeForCount = (count) => {
    const badge = VOYAGER_BADGES[count];
    return badge ? badge.icon : null;
  };



  const getVoyagerBrandColor = (count) => {
    if (count >= 5) return "#87B940";
    return "#87B940";
  };

  // Returns a conic-gradient CSS string that reflects voyage progress.
  // Low progress → neutral silvers/warm whites.
  // Mid progress → silver-sage blend.
  // High / Platinum → FamilySearch green shimmer.
  const getVoyagerAuraGradient = (percent) => {
    const p = Math.min(Math.max(percent, 0), 100);

    if (p >= 100) {
      // Platinum — full green with holographic shimmer
      return `conic-gradient(from 0deg,
        rgba(134,185,64,0.3) 0%,
        rgba(175,207,104,0.9) 8%,
        rgba(134,185,64,0.75) 22%,
        rgba(198,214,170,0.45) 30%,
        rgba(134,185,64,0.6) 42%,
        rgba(175,207,104,0.85) 56%,
        rgba(189,208,156,0.38) 64%,
        rgba(134,185,64,0.5) 78%,
        rgba(134,185,64,0.3) 100%)`;
    }

    if (p >= 50) {
      // Mid–high: balanced greens and silvers
      const g = `rgba(134,185,64,${0.55 + (p - 50) * 0.006})`;
      const minOpa = 0.25;
      return `conic-gradient(from 0deg,
        rgba(187,183,177,${minOpa}) 0%,
        ${g} 10%,
        rgba(203,210,196,0.42) 20%,
        rgba(156,148,122,0.4) 38%,
        ${g} 55%,
        rgba(198,206,188,0.34) 65%,
        rgba(187,183,177,0.35) 80%,
        rgba(187,183,177,${minOpa}) 100%)`;
    }

    if (p >= 15) {
      // Low–mid: mostly warm silver with a hint of sage
      return `conic-gradient(from 0deg,
        rgba(187,183,177,0.25) 0%,
        rgba(206,210,200,0.4) 8%,
        rgba(187,183,177,0.55) 20%,
        rgba(156,148,122,0.35) 36%,
        rgba(175,207,104,0.45) 50%,
        rgba(199,206,190,0.32) 62%,
        rgba(187,183,177,0.4) 78%,
        rgba(187,183,177,0.25) 100%)`;
    }

    // Very early: pure elegant silver/white
    return `conic-gradient(from 0deg,
      rgba(187,183,177,0.25) 0%,
      rgba(205,210,200,0.42) 8%,
      rgba(187,183,177,0.6) 22%,
      rgba(156,148,122,0.3) 45%,
      rgba(197,205,189,0.34) 62%,
      rgba(187,183,177,0.45) 80%,
      rgba(187,183,177,0.25) 100%)`;
  };

  // Schedules a randomised idle aura trigger (20–40 s) while exploring
  const scheduleVoyagerAuraIdleTick = () => {
    if (voyagerAuraIntervalRef.current) {
      clearTimeout(voyagerAuraIntervalRef.current);
    }
    const delay = 20000 + Math.random() * 20000; // 20–40 s
    voyagerAuraIntervalRef.current = window.setTimeout(() => {
      setVoyagerAuraToken((t) => t + 1);
      scheduleVoyagerAuraIdleTick(); // reschedule
    }, delay);
  };

  const renderStatIcon = (label = "") => {
    const normalized = label.toLowerCase();

    if (normalized.includes("capital")) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 22C12 22 18 16.4 18 11A6 6 0 1 0 6 11C6 16.4 12 22 12 22Z" stroke="#87b940" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <animateTransform attributeName="transform" type="translate" values="0 0;0 -0.8;0 0" dur="2.4s" repeatCount="indefinite" />
          </path>
          <circle cx="12" cy="11" r="2.2" fill="#87b940" opacity="0.9" />
        </svg>
      );
    }

    if (normalized.includes("population")) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="2.5" fill="#87b940" opacity="0.9">
            <animate attributeName="r" values="2.4;2.6;2.4" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="15" cy="10" r="2.2" fill="#87b940" opacity="0.65">
            <animate attributeName="r" values="2.1;2.3;2.1" dur="2.2s" begin="0.25s" repeatCount="indefinite" />
          </circle>
          <path d="M5.5 18.5C6.4 16.2 8.2 15 10.6 15H13.4C15.8 15 17.6 16.2 18.5 18.5" stroke="#87b940" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    }

    return null;
  };

  const renderCommonwealthStamp = (year) => {
    if (!year) return null;
    const rotation = -5 + (Math.random() * 2 - 1); // ~-5deg to -6deg
    return (
      <div
        aria-label={`Commonwealth member since ${year}`}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          width: "100%",
          aspectRatio: "1 / 1",
          border: "2px solid rgba(255, 255, 255, 0.72)",
          background: "radial-gradient(circle at 40% 35%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 60%, transparent 100%)",
          transform: `rotate(${rotation}deg)`,
          padding: "0.25rem",
          position: "relative",
          boxSizing: "border-box",
          boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.18)",
        }}
      >
        {/* Inner ring */}
        <div
          style={{
            position: "absolute",
            inset: "6px",
            borderRadius: "50%",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            pointerEvents: "none",
          }}
        />
        {/* Decorative dots at cardinal points */}
        {[0, 90, 180, 270].map((angle) => (
          <div
            key={angle}
            style={{
              position: "absolute",
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.55)",
              top: angle === 0 ? "3px" : angle === 180 ? undefined : "50%",
              bottom: angle === 180 ? "3px" : undefined,
              left: angle === 270 ? "3px" : angle === 90 ? undefined : "50%",
              right: angle === 90 ? "3px" : undefined,
              transform: angle === 0 || angle === 180 ? "translateX(-50%)" : "translateY(-50%)",
            }}
          />
        ))}
        <div
          style={{
            fontSize: "0.74rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255, 255, 255, 0.84)",
            fontWeight: 600,
            lineHeight: 1.1,
            textAlign: "center",
            marginTop: "0.1rem",
          }}
        >
          Member
          <br />
          Since
        </div>
        <div
          style={{
            fontSize: "1.66rem",
            fontWeight: 700,
            color: "rgba(255, 255, 255, 0.95)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            marginTop: "0.05rem",
          }}
        >
          {year}
        </div>
      </div>
    );
  };

  const selectedCountryNormalizedName = selectedCountry
    ? normalizeName(selectedCountry.name)
    : "";
  const extractYoutubeId = (url = '') => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const countryMediaItems = selectedCountry
    ? (COUNTRY_MEDIA_BY_NAME[selectedCountry.name] || [])
    : [];
  const galleryItems = countryMediaItems.reduce((acc, item, index) => {
    const baseId = `${selectedCountry.name}-media-${index}`;
    const youtubeId = item.videoId || extractYoutubeId(item.url);

    if (item.type === 'video' && youtubeId) {
      acc.push({
        id: baseId,
        type: 'video',
        title: item.title || `${selectedCountry.name} Video`,
        description: item.description || '',
        credit: item.credit || '',
        thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        sourceUrl: item.url,
        videoId: youtubeId,
      });
      return acc;
    }

    if (item.type === 'photo' && item.imageUrl) {
      acc.push({
        id: baseId,
        type: 'photo',
        title: item.title || `${selectedCountry.name} Photo`,
        description: item.description || '',
        credit: item.credit || '',
        thumbnailUrl: item.imageUrl,
        sourceUrl: item.imageUrl || item.url,
      });
      return acc;
    }

    // Skip items that are neither valid videos nor valid photos
    return acc;
  }, []);
  const lightboxIndex = lightboxItem
    ? galleryItems.findIndex((item) => item.id === lightboxItem.id)
    : -1;
  const hasGalleryNavigation = galleryItems.length > 1 && lightboxIndex >= 0;

  const showPreviousLightboxItem = () => {
    if (!hasGalleryNavigation) {
      return;
    }

    const previousIndex = (lightboxIndex - 1 + galleryItems.length) % galleryItems.length;
    setLightboxItem(galleryItems[previousIndex]);
  };

  const showNextLightboxItem = () => {
    if (!hasGalleryNavigation) {
      return;
    }

    const nextIndex = (lightboxIndex + 1) % galleryItems.length;
    setLightboxItem(galleryItems[nextIndex]);
  };

  const scrollGallery = (direction) => {
    if (!galleryTrackRef.current) {
      return;
    }

    const offset = direction === "left" ? -320 : 320;
    galleryTrackRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  useEffect(() => {
    if (!isPanelVisible) {
      return;
    }

    if (!visibleFamilySearchCollections.length) {
      setRecordCollectionsDisplayLimit(3);
      return;
    }

    const evaluateWrappedTitles = () => {
      const hasWrappedTitle = recordTitleRefs.current.some((element) => {
        if (!element) {
          return false;
        }

        const style = window.getComputedStyle(element);
        const lineHeight = Number.parseFloat(style.lineHeight);
        if (!lineHeight || Number.isNaN(lineHeight)) {
          return element.scrollHeight > element.clientHeight + 1;
        }

        const lineCount = Math.round(element.getBoundingClientRect().height / lineHeight);
        return lineCount > 1;
      });

      setRecordCollectionsDisplayLimit(hasWrappedTitle ? 2 : 3);
    };

    const rafId = window.requestAnimationFrame(evaluateWrappedTitles);
    window.addEventListener("resize", evaluateWrappedTitles);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", evaluateWrappedTitles);
    };
  }, [visibleFamilySearchCollections, isPanelVisible, selectedCountry?.name]);

  // Attract mode is timer-driven; this guard only prevents overlay conflicts.
  const hasActiveExplorationSurface = Boolean(selectedCountry || isMenuOpen || lightboxItem);
  const isAttractMode = isIdleAttractMode && !hasActiveExplorationSurface;
  const isDockTransitioning = isMenuClosing || isMenuOpening;

  // ─── MAP DRIFT ─────────────────────────────────────────────────────
  // Two distinct motion modes layered onto the map wrapper:
  //
  // 1. ATTRACT (idle) → gentle Ken Burns pan + zoom so the map never
  //    reads as a static image. Springs out when the visitor engages.
  //
  // 2. EXPLORATION (dock closed, no country selected, not attracting) →
  //    slow horizontal-only pan that hints "there's more map to see".
  //    Springs back to centre the instant the user touches the map.
  // ─────────────────────────────────────────────────────────────────────
  const [mapDriftSuppressed, setMapDriftSuppressed] = useState(false);

  useEffect(() => {
    const node = mapAtmosphereRef.current;
    if (!node) return;

    const isExplorationMode = !isAttractMode && !selectedCountry && !isMenuOpen && !mapDriftSuppressed;

    if (!isAttractMode && !isExplorationMode) {
      const start = { ...mapDriftStateRef.current };
      const stop = animateSpring({
        from: 1,
        to: 0,
        stiffness: 110,
        damping: 18,
        onUpdate: (progress) => {
          const x = start.x * progress;
          const y = start.y * progress;
          const scale = 1 + (start.scale - 1) * progress;
          node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
          mapDriftStateRef.current = { x, y, scale };
        },
      });
      return () => stop();
    }

    let rafId;
    const startedAt = performance.now();
    const startX = mapDriftStateRef.current.x;
    const startScale = mapDriftStateRef.current.scale;

    if (isAttractMode) {
      const drift = (now) => {
        const t = (now - startedAt) / 1000;
        const scale = 1.02 + Math.sin(t / 21) * 0.011;
        const x = Math.sin(t / 27) * 9;
        const y = Math.sin(t / 33 + 1.4) * 6;
        mapDriftStateRef.current = { x, y, scale };
        node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        rafId = requestAnimationFrame(drift);
      };
      rafId = requestAnimationFrame(drift);
    } else {
      const drift = (now) => {
        const t = (now - startedAt) / 1000;
        const x = startX + Math.sin(t / 31) * 110;
        const scale = startScale || 1;
        const y = 0;
        mapDriftStateRef.current = { x, y, scale };
        node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        rafId = requestAnimationFrame(drift);
      };
      rafId = requestAnimationFrame(drift);
    }

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isAttractMode, selectedCountry, isMenuOpen, mapDriftSuppressed]);

  // Spring the headline block in on entry instead of easing to a flat stop,
  // so it grows past its resting position by a couple of px and settles —
  // the overshoot is what reads as "alive" rather than merely animated.
  useEffect(() => {
    if (!isAttractMode) return;

    const targets = [
      { ref: attractEyebrowRef, delay: 100, from: 10 },
      { ref: attractTitleRef, delay: 240, from: 10 },
      { ref: attractSubRef, delay: 560, from: 8 },
    ];

    const stopFns = [];
    const timeoutIds = targets.map(({ ref, delay, from }) =>
      window.setTimeout(() => {
        if (!ref.current) return;
        ref.current.style.transform = `translateY(${from}px)`;
        const stop = animateSpring({
          from,
          to: 0,
          stiffness: 165,
          damping: 15,
          mass: 1,
          onUpdate: (value) => {
            if (ref.current) {
              ref.current.style.transform = `translateY(${value.toFixed(2)}px)`;
            }
          },
        });
        stopFns.push(stop);
      }, delay)
    );

    return () => {
      timeoutIds.forEach((id) => window.clearTimeout(id));
      stopFns.forEach((stop) => stop());
    };
  }, [isAttractMode]);

  const clearAttractCycleTimer = () => {
    if (attractCycleTimeoutRef.current) {
      clearTimeout(attractCycleTimeoutRef.current);
      attractCycleTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    clearAttractCycleTimer();

    if (!isAttractMode) {
      setAttractAutoCountryName("");
      setAttractRouteSwooshes([]);
      setAttractHeroRoute(null);
      return;
    }

    let isActive = true;
    const journeyCountries = ATTRACT_JOURNEY_SEQUENCE
      .map((name) => countries.find((country) => country.name === name))
      .filter((country) => country && Number.isFinite(country.lat) && Number.isFinite(country.lng));

    if (!journeyCountries.length) {
      return;
    }

    let journeyIndex = 0;
    let lastRouteStep = -ATTRACT_ROUTE_MIN_GAP_STEPS;
    let routeRotationIntervalId = null;
    let heroRouteTimerId = null;
    let heroRouteClearTimerId = null;

    const getRoutePoint = (name = "") => {
      if (ATTRACT_CUSTOM_ROUTE_POINTS[name]) {
        return ATTRACT_CUSTOM_ROUTE_POINTS[name];
      }

      const country = countries.find((item) => item.name === name);
      if (!country || !Number.isFinite(country.lat) || !Number.isFinite(country.lng)) {
        return null;
      }

      return [country.lat, country.lng];
    };

    const createRouteEntry = (routeSpec, options = {}) => {
      const { hero = false } = options;
      const from = getRoutePoint(routeSpec.from);
      const to = getRoutePoint(routeSpec.to);

      if (!from || !to) {
        return null;
      }

      const key = `${routeSpec.from}|${routeSpec.to}`;

      return {
        id: `${hero ? "hero" : "base"}-${key}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        key,
        from,
        to,
        hero,
        durationMs: hero ? ATTRACT_HERO_ARC_DURATION_MS : ATTRACT_BASE_ARC_DURATION_MS,
      };
    };

    const pickVisibleRouteCount = () =>
      ATTRACT_VISIBLE_ROUTE_MIN + Math.floor(Math.random() * (ATTRACT_VISIBLE_ROUTE_MAX - ATTRACT_VISIBLE_ROUTE_MIN + 1));

    const pickUnusedSpec = (library, usedKeys = new Set()) => {
      const candidates = library.filter((spec) => !usedKeys.has(`${spec.from}|${spec.to}`));
      const pool = candidates.length ? candidates : library;
      return pool[Math.floor(Math.random() * pool.length)] || null;
    };

    const initialRouteCount = pickVisibleRouteCount();
    const initialRoutes = [];
    const usedInitialKeys = new Set();

    while (initialRoutes.length < initialRouteCount && usedInitialKeys.size < ATTRACT_ROUTE_LIBRARY.length) {
      const spec = pickUnusedSpec(ATTRACT_ROUTE_LIBRARY, usedInitialKeys);
      if (!spec) {
        break;
      }

      usedInitialKeys.add(`${spec.from}|${spec.to}`);
      const route = createRouteEntry(spec);
      if (route) {
        initialRoutes.push(route);
      }
    }

    setAttractRouteSwooshes(initialRoutes);

    routeRotationIntervalId = window.setInterval(() => {
      if (!isActive) {
        return;
      }

      setAttractRouteSwooshes((currentRoutes) => {
        const targetCount = currentRoutes.length || initialRouteCount;
        const activeKeys = new Set(currentRoutes.map((route) => route.key));
        const nextSpec = pickUnusedSpec(ATTRACT_ROUTE_LIBRARY, activeKeys);

        if (!nextSpec) {
          return currentRoutes;
        }

        const nextRoute = createRouteEntry(nextSpec);
        if (!nextRoute) {
          return currentRoutes;
        }

        if (!currentRoutes.length) {
          return [nextRoute];
        }

        const replaceIndex = Math.floor(Math.random() * Math.max(1, currentRoutes.length));
        const next = [...currentRoutes];
        next[replaceIndex] = nextRoute;

        return next.slice(0, targetCount);
      });
    }, ATTRACT_ROUTE_ROTATE_MS);

    const scheduleHeroRoute = () => {
      const delay =
        ATTRACT_HERO_ROUTE_INTERVAL_MIN_MS +
        Math.floor(Math.random() * (ATTRACT_HERO_ROUTE_INTERVAL_MAX_MS - ATTRACT_HERO_ROUTE_INTERVAL_MIN_MS + 1));

      heroRouteTimerId = window.setTimeout(() => {
        if (!isActive) {
          return;
        }

        const heroSpec = pickUnusedSpec(ATTRACT_HERO_ROUTE_LIBRARY);
        const nextHeroRoute = heroSpec ? createRouteEntry(heroSpec, { hero: true }) : null;

        if (nextHeroRoute) {
          setAttractHeroRoute(nextHeroRoute);

          if (heroRouteClearTimerId) {
            clearTimeout(heroRouteClearTimerId);
          }

          heroRouteClearTimerId = window.setTimeout(() => {
            if (isActive) {
              setAttractHeroRoute(null);
            }
          }, Math.max(9000, nextHeroRoute.durationMs - 1200));
        }

        scheduleHeroRoute();
      }, delay);
    };

    scheduleHeroRoute();

    const scheduleNext = (delayMs) => {
      clearAttractCycleTimer();
      attractCycleTimeoutRef.current = window.setTimeout(() => {
        if (!isActive) {
          return;
        }

        const nextCountry = journeyCountries[journeyIndex % journeyCountries.length];
        const previousCountry = journeyCountries[(journeyIndex - 1 + journeyCountries.length) % journeyCountries.length];
        journeyIndex += 1;

        setHoveredCountry(nextCountry.name);
        setAttractAutoCountryName(nextCountry.name);
        if (previousCountry && nextCountry) {
          setAttractActiveJourney({
            from: previousCountry.name,
            to: nextCountry.name,
          });
        } else {
          setAttractActiveJourney(null);
        }

        const routeKey = `${previousCountry?.name || ""}|${nextCountry.name}`;
        const canShowRoute =
          previousCountry &&
          ATTRACT_ROUTE_SEGMENTS.has(routeKey) &&
          journeyIndex - lastRouteStep >= ATTRACT_ROUTE_MIN_GAP_STEPS &&
          Math.random() < ATTRACT_ROUTE_CHANCE;

        if (canShowRoute) {
          lastRouteStep = journeyIndex;
        }

        const holdMs = 2200;
        const pauseMs = 520;

        attractCycleTimeoutRef.current = window.setTimeout(() => {
          if (!isActive) {
            return;
          }

          scheduleNext(pauseMs);
        }, holdMs);
      }, delayMs);
    };

    scheduleNext(320);

    return () => {
      isActive = false;
      clearAttractCycleTimer();
      if (routeRotationIntervalId) {
        clearInterval(routeRotationIntervalId);
      }
      if (heroRouteTimerId) {
        clearTimeout(heroRouteTimerId);
      }
      if (heroRouteClearTimerId) {
        clearTimeout(heroRouteClearTimerId);
      }
      setAttractAutoCountryName("");
      setAttractRouteSwooshes([]);
      setAttractHeroRoute(null);
      setAttractActiveJourney(null);
      setHoveredCountry((current) => (current && !selectedCountry ? null : current));
    };
  }, [isAttractMode, selectedCountry]);

  // When panel closes, if no country is selected, restore Explore button (if the menu is not opening).
  useEffect(() => {
    if (!selectedCountry && !isPanelOpen && !isPanelVisible && !isMenuOpen && !isMenuOpening) {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
    }
  }, [selectedCountry, isPanelOpen, isPanelVisible, isMenuOpen, isMenuOpening]);


  const contextValue = {
    selectedCountry,
    handleClosePanel,
    setLightboxItem,
    lightboxItem,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          background: "#1a1f2e",
          fontFamily: "'Noto Sans', 'Segoe UI', sans-serif",
        }}
      >
        {/* ATTRACT MODE OVERLAY - Shows when idle */}
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            if (isAttractMode) {
              openCountryDock();
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 800,
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            justifyContent: "flex-start",
            pointerEvents: isAttractMode ? "auto" : "none",
            opacity: isAttractMode ? 1 : 0,
            transition: isAttractMode
              ? "opacity 800ms cubic-bezier(0.22, 1, 0.36, 1)"
              : "opacity 500ms cubic-bezier(0.22, 1, 0.36, 1) 150ms",
          }}
        >
          {/* Subtle vignette: radial in portrait to highlight central hero graphic, linear in landscape */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: isPortrait
                ? "radial-gradient(ellipse 95% 75% at 50% 48%, rgba(8, 11, 20, 0.3) 0%, rgba(8, 11, 20, 0.88) 100%)"
                : "linear-gradient(90deg, rgba(8, 11, 20, 0.85) 0%, rgba(8, 11, 20, 0.5) 30%, rgba(8, 11, 20, 0) 65%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(120% 100% at 50% 50%, rgba(8, 11, 20, 0) 40%, rgba(8, 11, 20, 0.35) 100%)",
              pointerEvents: "none",
            }}
          />

          {/* Glowing Slow-Spinning Orbit Backdrop */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: isPortrait ? "1150px" : "800px",
              height: isPortrait ? "1150px" : "800px",
              pointerEvents: "none",
              opacity: isAttractMode ? (isPortrait ? 0.28 : 0.22) : 0,
              transition: isAttractMode
                ? "opacity 2000ms cubic-bezier(0.22, 1, 0.36, 1)"
                : "opacity 400ms cubic-bezier(0.25, 1, 0.5, 1)",
              zIndex: 0,
            }}
          >
            <div
              className="celestial-orbit"
              style={{
                width: "100%",
                height: "100%",
                transformOrigin: "center center",
              }}
            >
              <svg viewBox="0 0 800 800" width="100%" height="100%" style={{ stroke: "rgba(255,255,255,0.14)", strokeWidth: 0.85, fill: "none" }}>
                <circle cx="400" cy="400" r="160" strokeDasharray="3,12" />
                <circle cx="400" cy="400" r="280" strokeDasharray="6,18" />
                <circle cx="400" cy="400" r="380" strokeDasharray="1,24" />

                <line x1="400" y1="120" x2="400" y2="680" strokeDasharray="4,8" />
                <line x1="120" y1="400" x2="680" y2="400" strokeDasharray="4,8" />

                <circle cx="400" cy="120" r="5" fill="#ffd080" style={{ filter: "drop-shadow(0 0 6px #ffd080)" }} />
                <circle cx="400" cy="680" r="4" fill="#87b940" style={{ filter: "drop-shadow(0 0 6px #87b940)" }} />
                <circle cx="120" cy="400" r="4" fill="#87b940" style={{ filter: "drop-shadow(0 0 6px #87b940)" }} />
                <circle cx="680" cy="400" r="5" fill="#ffd080" style={{ filter: "drop-shadow(0 0 6px #ffd080)" }} />

                <circle cx="302" cy="230" r="3" fill="rgba(255,255,255,0.4)" />
                <circle cx="498" cy="570" r="3.5" fill="rgba(255,255,255,0.3)" />
                <circle cx="498" cy="230" r="4" fill="#ffd080" style={{ filter: "drop-shadow(0 0 4px #ffd080)" }} />
                <circle cx="302" cy="570" r="3" fill="#87b940" style={{ filter: "drop-shadow(0 0 4px #87b940)" }} />
              </svg>
            </div>
          </div>

          {/* Editorial Content Column */}
          <div
            className="attract-editorial-column"
            style={{
              position: "relative",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: isPortrait ? "center" : "flex-start",
              textAlign: isPortrait ? "center" : "left",
              width: "100%",
              maxWidth: isPortrait ? "840px" : "600px",
              height: "100%",
              margin: isPortrait ? "0 auto" : undefined,
              paddingLeft: isPortrait ? "2rem" : "10%",
              paddingRight: "2rem",
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          >
            {/* Refined Brand Logo */}
            <div
              style={{
                opacity: isAttractMode ? 0.95 : 0,
                transform: isAttractMode ? "translateY(0)" : "translateY(16px)",
                transition: isAttractMode
                  ? "opacity 1200ms cubic-bezier(0.22, 1, 0.36, 1) 120ms, transform 1200ms cubic-bezier(0.22, 1, 0.36, 1) 120ms"
                  : "opacity 400ms cubic-bezier(0.25, 1, 0.5, 1), transform 400ms cubic-bezier(0.25, 1, 0.5, 1)",
                marginBottom: isPortrait ? "2.5rem" : "2rem",
                pointerEvents: isAttractMode ? "auto" : "none",
              }}
            >
              <img
                src={FAMILYSEARCH_LOGO_URL}
                alt="FamilySearch"
                style={{
                  width: isPortrait ? "230px" : "148px",
                  height: "auto",
                  filter: "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.45))",
                }}
              />
            </div>

            {/* Heading */}
            <h1
              style={{
                margin: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: isPortrait ? "center" : "flex-start",
                gap: "0.4rem",
                pointerEvents: isAttractMode ? "auto" : "none",
              }}
            >
              <span
                ref={attractEyebrowRef}
                style={{
                  fontFamily: "var(--heading)",
                  fontSize: isPortrait ? "clamp(3.4rem, 6.5vw, 5.2rem)" : "clamp(2.4rem, 4.6vw, 3.8rem)",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.98)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.02em",
                  textShadow: "0 4px 24px rgba(0, 0, 0, 0.5)",
                  opacity: isAttractMode ? 1 : 0,
                  transform: isAttractMode ? undefined : "translateY(16px)",
                  transition: isAttractMode
                    ? "opacity 1400ms cubic-bezier(0.22, 1, 0.36, 1) 100ms"
                    : "opacity 400ms cubic-bezier(0.25, 1, 0.5, 1), transform 400ms cubic-bezier(0.25, 1, 0.5, 1)",
                }}
              >
                One Commonwealth.
              </span>
              <span
                ref={attractTitleRef}
                style={{
                  fontFamily: "var(--heading)",
                  fontSize: isPortrait ? "clamp(3.4rem, 6.5vw, 5.2rem)" : "clamp(2.4rem, 4.6vw, 3.8rem)",
                  fontWeight: 500,
                  color: "rgba(255, 255, 255, 0.78)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.02em",
                  textShadow: "0 4px 24px rgba(0, 0, 0, 0.4)",
                  opacity: isAttractMode ? 1 : 0,
                  transform: isAttractMode ? undefined : "translateY(16px)",
                  transition: isAttractMode
                    ? "opacity 1500ms cubic-bezier(0.22, 1, 0.36, 1) 240ms"
                    : "opacity 400ms cubic-bezier(0.25, 1, 0.5, 1), transform 400ms cubic-bezier(0.25, 1, 0.5, 1)",
                }}
              >
                Millions of Stories.
              </span>
            </h1>

            {/* Body Copy */}
            <p
              ref={attractSubRef}
              style={{
                fontFamily: "var(--sans)",
                fontSize: isPortrait ? "clamp(1.2rem, 2.4vw, 1.55rem)" : "clamp(1.05rem, 1.8vw, 1.25rem)",
                fontWeight: 350,
                color: "rgba(255, 255, 255, 0.75)",
                lineHeight: 1.55,
                maxWidth: isPortrait ? "680px" : "460px",
                margin: isPortrait ? "2.2rem 0 3rem 0" : "1.8rem 0 2.5rem 0",
                textShadow: "0 2px 12px rgba(0, 0, 0, 0.4)",
                opacity: isAttractMode ? 1 : 0,
                transform: isAttractMode ? undefined : "translateY(16px)",
                transition: isAttractMode
                  ? "opacity 1700ms cubic-bezier(0.22, 1, 0.36, 1) 560ms"
                  : "opacity 400ms cubic-bezier(0.25, 1, 0.5, 1), transform 400ms cubic-bezier(0.25, 1, 0.5, 1)",
                pointerEvents: isAttractMode ? "auto" : "none",
              }}
            >
              Explore 56 nations and discover the people, connections and records that unite them.
            </p>

            {/* Premium Glass-Pill CTA */}
            <div
              style={{
                opacity: isAttractMode ? 1 : 0,
                transform: isAttractMode ? "translateY(0)" : "translateY(16px)",
                transition: isAttractMode
                  ? "opacity 1800ms cubic-bezier(0.22, 1, 0.36, 1) 600ms, transform 1800ms cubic-bezier(0.22, 1, 0.36, 1) 600ms"
                  : "opacity 350ms cubic-bezier(0.25, 1, 0.5, 1), transform 350ms cubic-bezier(0.25, 1, 0.5, 1)",
                pointerEvents: isAttractMode ? "auto" : "none",
              }}
            >
              <button
                className="premium-attract-cta"
                onClick={(e) => {
                  e.stopPropagation();
                  openCountryDock();
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: isPortrait ? "1.25rem 3.4rem" : "1rem 2.2rem",
                  borderRadius: "100px",
                  border: "none",
                  background: "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)",
                  backdropFilter: "blur(28px) saturate(200%)",
                  WebkitBackdropFilter: "blur(28px) saturate(200%)",
                  color: "rgba(255, 255, 255, 0.98)",
                  fontFamily: "var(--sans)",
                  fontSize: isPortrait ? "1.3rem" : "1.05rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                  boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
                  whiteSpace: "nowrap",
                  transition: "all 400ms cubic-bezier(0.22, 1, 0.36, 1)",
                  position: "relative",
                }}
              >
                {/* Glowing animated gradient border */}
                <span className="glowing-border-container">
                  <span className="glowing-border-rotating-part" />
                </span>

                {/* Animated indicator dot transitioning softly through brand colors */}
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "attractDotHueCycle 16s ease-in-out infinite",
                    position: "relative",
                    zIndex: 2,
                  }}
                />
                <span style={{ position: "relative", zIndex: 2 }}>Start Exploring</span>
                <span style={{ fontSize: "1.3rem", lineHeight: 1, marginLeft: "4px", transition: "transform 300ms ease", position: "relative", zIndex: 2 }} className="cta-arrow">→</span>
              </button>
            </div>

            {/* Quiet Information Layer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: isPortrait ? "3.2rem" : "2.5rem",
                marginTop: isPortrait ? "3.5rem" : "3rem",
                marginBottom: "1rem",
                padding: isPortrait ? "16px 36px" : undefined,
                borderRadius: isPortrait ? "999px" : undefined,
                background: isPortrait ? "rgba(255, 255, 255, 0.08)" : undefined,
                backdropFilter: isPortrait ? "blur(20px) saturate(180%)" : undefined,
                WebkitBackdropFilter: isPortrait ? "blur(20px) saturate(180%)" : undefined,
                border: isPortrait ? "1px solid rgba(255, 255, 255, 0.15)" : undefined,
                boxShadow: isPortrait ? "0 12px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)" : undefined,
                opacity: isAttractMode ? 1 : 0,
                transform: isAttractMode ? "translateY(0)" : "translateY(16px)",
                transition: isAttractMode
                  ? "opacity 2000ms cubic-bezier(0.22, 1, 0.36, 1) 720ms, transform 2000ms cubic-bezier(0.22, 1, 0.36, 1) 720ms"
                  : "opacity 300ms cubic-bezier(0.25, 1, 0.5, 1), transform 300ms cubic-bezier(0.25, 1, 0.5, 1)",
                pointerEvents: isAttractMode ? "auto" : "none",
              }}
            >
              <div>
                <div style={{ fontSize: isPortrait ? "2.2rem" : "1.6rem", fontWeight: 800, color: "rgba(255,255,255,0.96)", fontFamily: "var(--sans)" }}>56</div>
                <div style={{ textTransform: "uppercase", fontSize: isPortrait ? "0.78rem" : "0.7rem", color: "rgba(255,255,255,0.55)", letterSpacing: "0.18em", marginTop: "2px" }}>Nations</div>
              </div>
              <div style={{ width: "1px", height: isPortrait ? "3rem" : "2.5rem", background: "rgba(255,255,255,0.18)", alignSelf: "center" }} />
              <div>
                <div style={{ fontSize: isPortrait ? "2.2rem" : "1.6rem", fontWeight: 800, color: "rgba(255,255,255,0.96)", fontFamily: "var(--sans)" }}>2.7B</div>
                <div style={{ textTransform: "uppercase", fontSize: isPortrait ? "0.78rem" : "0.7rem", color: "rgba(255,255,255,0.55)", letterSpacing: "0.18em", marginTop: "2px" }}>People</div>
              </div>
              <div style={{ width: "1px", height: isPortrait ? "3rem" : "2.5rem", background: "rgba(255,255,255,0.18)", alignSelf: "center" }} />
              <div>
                <div style={{ fontSize: isPortrait ? "2.2rem" : "1.6rem", fontWeight: 800, color: "rgba(255,255,255,0.96)", fontFamily: "var(--sans)" }}>Countless</div>
                <div style={{ textTransform: "uppercase", fontSize: isPortrait ? "0.78rem" : "0.7rem", color: "rgba(255,255,255,0.55)", letterSpacing: "0.18em", marginTop: "2px" }}>Stories</div>
              </div>
            </div>
          </div>

          {/* Storytelling Active Connection Overlay */}
          <div
            style={{
              position: "absolute",
              bottom: "4.5rem",
              right: "8%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "6px",
              opacity: isAttractMode && attractActiveJourney ? 0.85 : 0,
              transform: isAttractMode && attractActiveJourney ? "translateY(0)" : "translateY(16px)",
              transition: isAttractMode
                ? "opacity 1000ms cubic-bezier(0.22, 1, 0.36, 1), transform 1000ms cubic-bezier(0.22, 1, 0.36, 1)"
                : "opacity 400ms cubic-bezier(0.25, 1, 0.5, 1), transform 400ms cubic-bezier(0.25, 1, 0.5, 1)",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <span style={{
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "rgba(255, 255, 255, 0.4)",
              fontWeight: 600,
            }}>
              Family Journeys
            </span>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontFamily: "var(--heading)",
              fontSize: "1.3rem",
              color: "#111",
              background: "rgba(255, 255, 255, 0.6)",
              padding: "0.5rem 1.2rem",
              borderRadius: "50px",
              border: "1px solid rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(36px) saturate(200%)",
              WebkitBackdropFilter: "blur(36px) saturate(200%)",
            }}>
              <span>{attractActiveJourney?.from}</span>
              <span style={{ color: "#87b940", fontWeight: "bold", fontSize: "1.1rem" }}>→</span>
              <span>{attractActiveJourney?.to}</span>
            </div>
          </div>
        </div>

        {(() => {
          const shouldShowExploreButton = !isMenuOpen && !isMenuOpening && !isMenuClosing;
          const isExploreButtonVisible = shouldShowExploreButton && !isButtonTransitioning && !isAttractMode;
          const hiddenExploreTransform = isAttractMode
            ? "translateY(16px) scale(0.97)"
            : "translateY(14px) scale(0.97)";
          const baseExploreTransform = isExploreButtonVisible
            ? "translateY(0) scale(1)"
            : hiddenExploreTransform;
          const exploreButtonLabel = isAttractMode ? "Touch to Begin" : "Explore by Country";
          const hideRecentre = selectedCountry || isMenuOpen || isDockExpanding || isButtonTransitioning;

          const applyCtaTransform = (node) => {
            if (!node) return;
            const lift = ctaLiftRef.current;
            const press = ctaPressAmountRef.current;
            const ty = -3 * lift;
            const scale = (1 + 0.04 * lift) * (1 - 0.06 * press);
            node.style.transform = `translateX(-50%) ${baseExploreTransform} translateY(${ty.toFixed(2)}px) scale(${scale.toFixed(4)})`;
          };

          const releaseCtaPress = (node) => {
            if (!node) return;
            ctaPressStopRef.current?.();
            ctaPressStopRef.current = animateSpring({
              from: ctaPressAmountRef.current,
              to: 0,
              stiffness: 300,
              damping: 14,
              onUpdate: (value) => {
                ctaPressAmountRef.current = value;
                applyCtaTransform(node);
              },
            });
          };
          if (!isExploreButtonVisible && !isMenuOpening && !isMenuClosing && !isButtonTransitioning) {
            return null;
          }

          return (
            <div
              className={`explore-cta-button ${isExploreButtonVisible ? "explore-cta-visible" : "explore-cta-hidden"}${isAttractMode ? " explore-cta-button-attract" : ""}${isDockExpanding ? " explore-cta-expanding" : ""}`}
              onPointerEnter={(event) => {
                if (!isExploreButtonVisible || event.pointerType !== "mouse") return;
                const node = event.currentTarget;
                ctaLiftStopRef.current?.();
                ctaLiftStopRef.current = animateSpring({
                  from: ctaLiftRef.current,
                  to: 1,
                  stiffness: 260,
                  damping: 20,
                  onUpdate: (value) => {
                    ctaLiftRef.current = value;
                    applyCtaTransform(node);
                  },
                });
                // Subtle dark shadow lift
                node.style.boxShadow = "0 22px 44px rgba(0,0,0,0.4)";
              }}
              onPointerLeave={(event) => {
                const node = event.currentTarget;
                if (isExploreButtonVisible && event.pointerType === "mouse") {
                  ctaLiftStopRef.current?.();
                  ctaLiftStopRef.current = animateSpring({
                    from: ctaLiftRef.current,
                    to: 0,
                    stiffness: 260,
                    damping: 22,
                    onUpdate: (value) => {
                      ctaLiftRef.current = value;
                      applyCtaTransform(node);
                    },
                  });
                  node.style.boxShadow = "0 18px 40px rgba(0,0,0,0.36)";
                }
                releaseCtaPress(node);
              }}
              onPointerDown={(event) => {
                if (!isExploreButtonVisible) return;
                const node = event.currentTarget;
                const rect = node.getBoundingClientRect();
                spawnGlassRipple(node, event.clientX - rect.left, event.clientY - rect.top);

                ctaPressStopRef.current?.();
                ctaPressStopRef.current = animateSpring({
                  from: ctaPressAmountRef.current,
                  to: 1,
                  stiffness: 340,
                  damping: 26,
                  onUpdate: (value) => {
                    ctaPressAmountRef.current = value;
                    applyCtaTransform(node);
                  },
                });
              }}
              onPointerUp={(event) => releaseCtaPress(event.currentTarget)}
              onPointerCancel={(event) => releaseCtaPress(event.currentTarget)}
              style={{
                position: "fixed",
                left: "50%",
                top: isAttractMode ? "72%" : "5rem",
                bottom: "auto",
                transform: `translateX(-50%) ${baseExploreTransform}`,
                zIndex: selectedCountry ? 995 : 910,
                display: "flex",
                alignItems: "center",
                gap: (isAttractMode || isPanelOpen) ? "0px" : "4px",
                padding: "7px", // 10% larger outer padding
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(25, 25, 30, 0.65)",
                backdropFilter: "blur(40px) saturate(220%)",
                WebkitBackdropFilter: "blur(40px) saturate(220%)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                pointerEvents: isExploreButtonVisible ? "auto" : "none",
                transition: `opacity ${EXHIBIT_TRANSITION_MS}ms ${EXHIBIT_TRANSITION_EASE}, filter ${EXHIBIT_TRANSITION_MS}ms ${EXHIBIT_TRANSITION_EASE}`,
                opacity: isExploreButtonVisible ? 1 : 0,
                filter: isExploreButtonVisible ? "blur(0px)" : "blur(0.8px)",
                isolation: "isolate",
                overflow: "hidden",
              }}
            >
              {/* Sheen effect across the whole pill */}
              <span className="explore-cta-sheen" aria-hidden="true" style={{ borderRadius: "999px", pointerEvents: "none" }} />

              {/* Explore Option */}
              <button
                aria-label={isAttractMode ? undefined : "Explore by Country"}
                onClick={(event) => {
                  event.stopPropagation();
                  handleExploreCommonwealthPress();
                }}
                style={{
                  position: "relative",
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  padding: (isAttractMode) ? "18px 36px" : (hideRecentre ? "11px 22px" : "11px 24px 11px 20px"),
                  borderRadius: "999px",
                  border: "none",
                  background: "linear-gradient(180deg, rgba(135, 185, 64, 0.85) 0%, rgba(115, 160, 50, 0.85) 100%)",
                  color: "#ffffff",
                  fontSize: isAttractMode ? "1.6rem" : "1.24rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(135, 185, 64, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
                  transition: "all 200ms ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(180deg, rgba(145, 195, 74, 0.95) 0%, rgba(125, 170, 60, 0.95) 100%)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(180deg, rgba(135, 185, 64, 0.85) 0%, rgba(115, 160, 50, 0.85) 100%)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {renderGlobeIcon(isAttractMode ? 22 : 24)}
                </div>
                {!isAttractMode && <span>Explore</span>}
                {isAttractMode && <span>{exploreButtonLabel}</span>}
              </button>

              {/* Recentre — hidden elegantly when card is open */}
              {!isAttractMode && (
                <div
                  style={{
                    overflow: "hidden",
                    width: hideRecentre ? "0px" : "52px", // 10% larger
                    minWidth: hideRecentre ? "0px" : "52px",
                    maxWidth: hideRecentre ? "0px" : "52px",
                    opacity: hideRecentre ? 0 : 1,
                    transition: "width 400ms cubic-bezier(0.22,1,0.36,1), min-width 400ms cubic-bezier(0.22,1,0.36,1), max-width 400ms cubic-bezier(0.22,1,0.36,1), opacity 280ms ease",
                    pointerEvents: hideRecentre ? "none" : "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <button
                    aria-label="Recentre Map"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    style={{
                      position: "relative",
                      zIndex: 2,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "48px", // 10% larger size
                      height: "48px",
                      borderRadius: "50%",
                      border: "none",
                      background: "transparent",
                      color: "rgba(255,255,255,0.95)",
                      cursor: "pointer",
                      transition: "background 200ms ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="2" y1="12" x2="6" y2="12"></line>
                      <line x1="18" y1="12" x2="22" y2="12"></line>
                      <line x1="12" y1="2" x2="12" y2="6"></line>
                      <line x1="12" y1="18" x2="12" y2="22"></line>
                      <circle cx="12" cy="12" r="6"></circle>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* TOP BAR - Always visible */}
        <div
          style={{
            position: "fixed",
            top: "2.2rem",
            left: "2.2rem",
            zIndex: 920,
            display: "flex",
            alignItems: "center",
            padding: 0,
            pointerEvents: "none",
            opacity: isAttractMode ? 0 : 1,
            transition: "opacity 800ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {/* FamilySearch logo - simple plaque */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              borderRadius: 0,
              border: "none",
              background: "transparent",
              boxShadow: "none",
            }}
          >
            <img
              src={FAMILYSEARCH_LOGO_URL}
              alt="FamilySearch"
              style={{
                position: "relative",
                zIndex: 1,
                width: "192px",
                height: "auto",
                filter: "brightness(0) invert(1) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45)) drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35))",
                opacity: 0.96,
                transition: `opacity 520ms ${DOCK_GENTLE_EASE}`,
              }}
            />
          </div>
        </div>

        {hoveredCountryPos && (() => {
          const countryObj = countries.find(c => c.name.toLowerCase() === (hoveredCountry || "").toLowerCase());
          const flagCode = countryObj?.countryCode?.toLowerCase();
          return (
            <div
              style={{
                position: "fixed",
                left: `${hoveredCountryPos.x}px`,
                top: `${hoveredCountryPos.y - 28}px`,
                transform: hoveredCountry && !isAttractMode
                  ? "translateX(-50%) translateY(-50%) scale(1)"
                  : "translateX(-50%) translateY(-50%) scale(0.85)",
                opacity: hoveredCountry && !isAttractMode ? 1 : 0,
                pointerEvents: "none",
                zIndex: 920,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                background: "rgba(20, 20, 25, 0.75)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                transition: "left 120ms cubic-bezier(0.22, 1, 0.36, 1), top 120ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease, transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {flagCode && (
                <img
                  src={`https://flagcdn.com/w40/${flagCode}.png`}
                  alt=""
                  style={{
                    width: "16px",
                    height: "11px",
                    borderRadius: "2px",
                    objectFit: "cover",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                />
              )}
              <span
                style={{
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'SF Pro', 'Inter', sans-serif",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  color: "rgba(255, 255, 255, 0.96)",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {hoveredCountry}
              </span>
            </div>
          );
        })()}

        {/* VOYAGER PROGRESS - Top right corner */}
        {!isAttractMode ? (
          <div
            onClick={() => setIsVoyagerExpanded((value) => !value)}
            style={{
              position: "fixed",
              top: "2.2rem",
              right: "2.2rem",
              zIndex: 820,
              width: isVoyagerExpanded
                ? "min(340px, calc(100vw - 1.5rem))"
                : `min(${voyagerCollapsedWidth}px, calc(100vw - 1.5rem))`,
              height: isVoyagerExpanded
                ? (voyagerProgressCount >= 5 ? "400px" : (visitedVoyagerCountries.length === 0 ? "224px" : "252px"))
                : "44px",
              borderRadius: "22px",
              padding: "2px",
              background: "rgba(135, 185, 64, 0.28)", // Subtle FamilySearch Green rim
              pointerEvents: "auto",
              overflow: "hidden",
              isolation: "isolate",
              cursor: "pointer",
              transition: "all 400ms cubic-bezier(0.22, 1, 0.36, 1)",
              boxSizing: "border-box",
              willChange: "width, height, border-radius",
              transform: "translateZ(0)",
              contain: "layout",
            }}
          >
            {/* Conic-gradient rotating border beam (FamilySearch brand colors) that fades in/out occasionally */}
            <div
              className="voyager-border-beam-mask"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "22px",
                opacity: isVoyagerExpanded ? 0 : 0.85, // Subtle elegant glow
                transition: "opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)",
                pointerEvents: "none",
                zIndex: 1,
                overflow: "hidden",
                padding: "2px",
                boxSizing: "border-box",
                filter: "blur(4px)", // Softens the gradient to a glow
              }}
            >
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "100vh", // Perfect square prevents gradient distortion
                height: "100vh",
                marginLeft: "-50vh",
                marginTop: "-50vh",
                background: "conic-gradient(from 0deg, #87B940, #1BA9E6, #4C7D1E, #0F5D80, #87B940)", // FamilySearch Brand Colors
                animation: "spin 5s linear infinite",
              }} />
            </div>

            {/* Inner Premium Light Glass Container (FamilySearch Style) */}
            <div style={{
              position: "relative",
              zIndex: 2,
              borderRadius: "20px",
              background: "rgba(255, 255, 255, 0.85)", // Light Apple-like glass surface
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              boxShadow: "0 8px 32px rgba(32, 39, 56, 0.12), inset 0 0 0 1px rgba(255,255,255,0.6)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              height: "100%",
              padding: isVoyagerExpanded ? "1.1rem 1.2rem" : "6px 16px 6px 12px",
              boxSizing: "border-box",
              justifyContent: "space-between",
              color: "#202738", // Charcoal text
            }}>

              {/* Removed glossy top reflection to match matte AI pill */}              {/* Progress aura ring */}
              <div
                key={`voyager-aura-${voyagerAuraToken}`}
                className={`voyager-aura-ring${voyagerAuraToken > 0 ? (voyagerProgressPercent >= 100 ? " aura-platinum" : " aura-active") : ""}`}
                style={{
                  "--aura-gradient": getVoyagerAuraGradient(voyagerProgressPercent),
                  borderRadius: "21px",
                  zIndex: 2,
                }}
              >
                <div className="voyager-aura-gradient" style={{ borderRadius: "21px" }} />
              </div>

              {/* Classy Cross-fade container for Expanded View */}
              <div style={{
                opacity: isVoyagerExpanded ? 1 : 0,
                visibility: isVoyagerExpanded ? "visible" : "hidden",
                pointerEvents: isVoyagerExpanded ? "auto" : "none",
                transition: "opacity 300ms ease, transform 350ms cubic-bezier(0.22, 1, 0.36, 1)",
                transform: isVoyagerExpanded ? "translateY(0)" : "translateY(10px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                height: isVoyagerExpanded ? (voyagerProgressCount >= 5 ? "100%" : "auto") : "0px",
                justifyContent: voyagerProgressCount >= 5 ? "space-between" : "flex-start",
                gap: voyagerProgressCount >= 5 ? "0" : "0.55rem",
                zIndex: 3,
              }}>
                {/* Badge Icon — only rendered if unlocked (count >= 5) */}
                {voyagerProgressCount >= 5 ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "64px",
                  }}>
                    {renderVoyagerBadge(voyagerProgressCount, "full", true)}
                  </div>
                ) : null}

                {/* Title */}
                <div style={{
                  fontSize: "0.75rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: hoveredMilestone ? "#87B940" : "#202738", // FS Green / Slate
                  fontWeight: 800,
                  textAlign: "center",
                  transition: "color 150ms ease",
                  lineHeight: 1.3,
                  padding: "0.25rem 0",
                }}>
                  {hoveredMilestone
                    ? {
                      5: "Curious Explorer",
                      10: "Commonwealth Traveller",
                      25: "Global Navigator",
                      40: "World Voyager",
                      56: "Golden Commonwealth Explorer"
                    }[hoveredMilestone]
                    : (voyagerProgressCount >= 5 ? voyagerProgressTitle : "Commonwealth Explorer")}
                </div>

                {/* Progress Count */}
                <div style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "#202738",
                }}>
                  {voyagerProgressCount} / {VOYAGER_TOTAL_COUNTRIES}
                </div>

                {/* Milestone Progress Bar */}
                <div style={{ width: "100%" }}>
                  {/* Progress track */}
                  <div style={{
                    height: "4px",
                    background: "rgba(51, 51, 49, 0.12)",
                    borderRadius: "2px",
                    position: "relative",
                    overflow: "hidden"
                  }}>
                    {/* Progress fill */}
                    <div style={{
                      height: "100%",
                      width: `${voyagerProgressPercent}%`,
                      background: "linear-gradient(90deg, #87B940 0%, #A2D853 100%)", // FamilySearch Green gradient
                      borderRadius: "2px",
                      transition: "width 600ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }} />
                  </div>

                  {/* Milestone markers */}
                  <div style={{
                    position: "relative",
                    marginTop: "0.45rem",
                    height: "22px",
                  }}>
                    {[
                      { count: 5, label: "5" },
                      { count: 10, label: "10" },
                      { count: 25, label: "25" },
                      { count: 40, label: "40" },
                      { count: 56, label: "56" }
                    ].map((milestone) => {
                      const isReached = voyagerProgressCount >= milestone.count;
                      const isMh = hoveredMilestone === milestone.count;
                      return (
                        <div
                          key={milestone.count}
                          onMouseEnter={() => setHoveredMilestone(milestone.count)}
                          onMouseLeave={() => setHoveredMilestone(null)}
                          style={{
                            position: "absolute",
                            left: `calc(${(milestone.count / VOYAGER_TOTAL_COUNTRIES) * 100}% - 3px)`,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "0.22rem",
                            opacity: isReached || isMh ? 1 : 0.45,
                            cursor: "pointer",
                            transform: isMh ? "scale(1.18)" : "scale(1)",
                            transition: "all 150ms ease",
                          }}
                        >
                          <div style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: isMh || isReached
                              ? "#87B940"
                              : "rgba(51, 51, 49, 0.25)",
                            boxShadow: isMh || isReached ? "0 0 6px rgba(135, 185, 64, 0.6)" : "none",
                            transition: "all 150ms ease",
                          }} />
                          <div style={{
                            fontSize: "0.72rem",
                            color: isMh ? "#87B940" : isReached ? "#333331" : "rgba(51, 51, 49, 0.45)",
                            fontWeight: isReached || isMh ? 800 : 600,
                            letterSpacing: "0.02em",
                            transition: "all 150ms ease",
                          }}>
                            {milestone.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {visitedVoyagerCountries.length === 0 ? (
                  <div
                    style={{
                      marginTop: "0.85rem",
                      fontSize: "0.75rem",
                      color: "rgba(51, 51, 49, 0.45)",
                      textAlign: "center",
                      lineHeight: 1.45,
                      maxWidth: "240px",
                    }}
                  >
                    Select a country to begin your journey.
                  </div>
                ) : null}
              </div>

              {/* Clicked Country List */}
              {visitedVoyagerCountries.length > 0 ? (
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px",
                  justifyContent: "center",
                  maxHeight: "80px",
                  overflowY: "auto",
                  marginTop: voyagerProgressCount >= 5 ? "16px" : "6px",
                  marginBottom: "8px",
                  width: "100%",
                  padding: "4px",
                  scrollbarWidth: "none"
                }}>
                  {visitedVoyagerCountries.map(countryKey => (
                    <span key={countryKey} style={{
                      fontSize: "0.65rem",
                      background: "rgba(135, 185, 64, 0.08)",
                      border: "1px solid rgba(135, 185, 64, 0.18)",
                      padding: "3px 8px",
                      borderRadius: "12px",
                      color: "#333331",
                      whiteSpace: "nowrap"
                    }}>
                      {getVoyagerCountryLabel(countryKey)}
                    </span>
                  ))}
                </div>
              ) : null}

              {/* Download Certificate Option */}
              {voyagerProgressCount >= 5 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openCertificateFlow();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#D5548E", // AI pinkish tint
                    textDecoration: "underline",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    padding: "4px",
                    transition: "color 150ms ease"
                  }}
                  onMouseEnter={(e) => e.target.style.color = "#E78351"}
                  onMouseLeave={(e) => e.target.style.color = "#D5548E"}
                >
                  Download your certificate
                </button>
              )}

              {/* Classy Cross-fade container for Minimal View */}
              <div style={{
                position: "absolute",
                inset: "0 16px",
                opacity: isVoyagerExpanded ? 0 : 1,
                visibility: isVoyagerExpanded ? "hidden" : "visible",
                pointerEvents: isVoyagerExpanded ? "none" : "auto",
                transition: "opacity 280ms ease, transform 350ms cubic-bezier(0.22, 1, 0.36, 1)",
                transform: isVoyagerExpanded ? "translateY(-10px)" : "translateY(0)",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                whiteSpace: "nowrap",
                height: "100%",
                zIndex: 3,
              }}>
                {voyagerProgressCount >= 5 ? (
                  <>
                    <div
                      key={`voyager-badge-minimal-${voyagerBadgeAnimToken}`}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: "32px", height: "32px" }}
                    >
                      {renderVoyagerBadge(voyagerProgressCount, "small", true)}
                    </div>
                    <div style={{
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      letterSpacing: "0.02em",
                      color: "#202738",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}>
                      {voyagerProgressTitle}
                    </div>
                    <div style={{
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      letterSpacing: "0.01em",
                      color: "#202738", // Slate text
                      marginLeft: "auto",
                      flexShrink: 0,
                    }}>
                      <span style={{ fontWeight: 800 }}>{voyagerProgressCount}</span>/{VOYAGER_TOTAL_COUNTRIES}
                    </div>
                  </>
                ) : (
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    color: "#202738", // Slate text
                    width: "100%",
                  }}>
                    <span style={{ display: "inline-flex", alignItems: "center" }}>{renderTrophyIcon(20)}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ fontWeight: 800 }}>{voyagerCountriesUntilSurprise}</span> {voyagerCountriesUntilSurprise === 1 ? "country" : "countries"} to go!
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}



        <UniversalDock
          isMenuOpen={isMenuOpen}
          isDockTransitioning={isDockTransitioning}
          markDockInteraction={markDockInteraction}
          searchResults={filteredCountries}
          selectedCountryIndex={filteredCountries.findIndex(c => c.name === selectedCountry?.name)}
          isDockExpanding={isDockExpanding}
          handleSelectCountry={handleSelectCountry}
          handleCountryHover={handleCountryHover}
          handleReset={handleReset}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isDockSearchExpanded={isDockSearchExpanded}
          setIsDockSearchExpanded={setIsDockSearchExpanded}
          setIsMenuOpen={setIsMenuOpen}
          setIsMenuClosing={setIsMenuClosing}
        />

        <div
          ref={mapAtmosphereRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "calc(100% + 240px)",
            height: "100%",
            left: "-120px",
            boxSizing: "border-box",
            overflow: "hidden",
            transformOrigin: "50% 50%",
            willChange: "transform",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "#202738",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              background: "rgba(156, 148, 122, 0.12)",
              mixBlendMode: "overlay",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
          <MapLibreMap
            ref={mapRef}
            onCountrySelect={handleSelectCountry}
            onMapClick={(options = {}) => {
              if (isAttractMode || isIdleAttractMode || (Date.now() - attractExitTimeRef.current < 500)) return;
              if (selectedCountry) {
                handleReset(options);
              } else if (isMenuOpen) {
                setIsMenuClosing(true);
                window.setTimeout(() => {
                  setIsMenuOpen(false);
                  setIsMenuClosing(false);
                }, 480);
              }
            }}
            onCountryHover={handleCountryHover}
            selectedCountry={selectedCountry}
            activatedCountryName={activatedCountryName}
            isPanelOpen={isPanelOpen}
            isAttractMode={isAttractMode}
            hoveredCountry={hoveredCountry}
          />



          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0, 0, 0, 0.12)",
              backdropFilter: "none",
              WebkitBackdropFilter: "none",
              pointerEvents: "none",
              zIndex: 3,
              opacity: isOverlayVisible ? 1 : 0,
              transition: "opacity 300ms cubic-bezier(0.22, 1, 0.36, 1)",
              // GPU layer isolation — prevents the full-screen blur from being re-evaluated
              // during every child scroll / animation frame
              willChange: "opacity",
              transform: "translateZ(0)",
              display: isOverlayVisible ? undefined : "none",
            }}
          />

          {/* Blocks all map interaction while a country card is open. Clicking
            it closes the card; the same gesture can never reach a country. */}
          {selectedCountry && !achievementUnlocked && !certificateStep ? (
            <div
              aria-hidden="true"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleClosePanel();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 990,
                cursor: "default",
              }}
            />
          ) : null}
        </div>

        {/* FLOATING STORY CARD - Decoupled background to prevent scroll repaint flicker */}
        <div
          ref={storyCardWrapperRef}
          className="floating-story-card-wrapper"
          onClick={(event) => event.stopPropagation()}
          onWheel={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerMove={(event) => event.stopPropagation()}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: isPanelVisible
              ? "translate(-50%, -50%) translateZ(0)"
              : "translate(-50%, calc(-50% + 90px)) translateZ(0)",
            width: "min(900px, 92vw)",
            maxHeight: "75vh",
            background: "linear-gradient(155deg, rgba(15, 23, 42, 0.96) 0%, rgba(2, 6, 23, 0.92) 52%, rgba(15, 23, 42, 0.94) 100%)",
            boxShadow: "0 42px 120px rgba(0, 0, 0, 0.6), 0 16px 34px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
            borderRadius: "32px",
            opacity: isPanelVisible ? 1 : 0,
            transition: "opacity 500ms cubic-bezier(0.22, 1, 0.36, 1), transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
            pointerEvents: isPanelVisible ? "auto" : "none",
            overflow: "hidden",
            zIndex: 1000,
            border: "1px solid rgba(203, 213, 225, 0.44)",
            display: "flex",
            flexDirection: "column",
            willChange: "transform, opacity", // Own GPU layer — scrolling inside never triggers outer repaint
            isolation: "isolate", // Stacking context so children can't bleed into page compositor
          }}
        >
          {/* Fixed Close button at the top-right of the card */}
          {selectedCountry ? (
            <button
              onClick={handleClosePanel}
              style={{
                position: "absolute",
                top: "1.2rem",
                right: "1.2rem",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                border: "1px solid rgba(148, 163, 184, 0.42)",
                background: "rgba(15, 23, 42, 0.92)",
                color: "#fff",
                fontSize: "1.4rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 200ms ease",
                zIndex: 1010, // Sit on top of the scrolling viewport and fixed hero
                boxShadow: "0 6px 14px rgba(2,6,23,0.45)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(30, 41, 59, 0.98)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(15, 23, 42, 0.92)";
                e.currentTarget.style.transform = "scale(1)";
              }}
              aria-label="Close"
            >
              ×
            </button>
          ) : null}

          {/* ── HERO ── Outside the scroll container so its height change never
              affects scrollTop. The scroll handler drives height + glass opacity
              via direct DOM refs — zero React re-render, zero jitter. */}
          {selectedCountry ? (
            <div
              key={`hero-${selectedCountry.name}-${heroMotionSeed}`}
              ref={heroOuterRef}
              style={{
                flexShrink: 0,
                height: "348px",
                position: "relative",
                overflow: "hidden",
                borderRadius: "32px 32px 0 0",
                ...getRevealStyle(0),
              }}
            >
              {/* Background image */}
              <img
                className="country-hero-image"
                src={validatedHeroImage || selectedCountryHeroImage}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center 30%",
                  display: "block",
                  position: "absolute",
                  inset: 0,
                  zIndex: 0,
                  willChange: "transform",
                }}
              />
              {/* Gradient overlay */}
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0.15) 40%, rgba(15,23,42,0.78) 100%)",
                zIndex: 1,
              }} />
              {/* Glass blur — fades in as user scrolls */}
              <div
                ref={heroGlassRef}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(15, 23, 42, 0.45)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  opacity: 0,
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              />
              {/* Flag + Title + Member since — pinned to bottom */}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                zIndex: 4,
                padding: `1.4rem ${STORY_CARD_SIDE_PADDING}`,
              }}>
                {selectedCountry.countryCode && (
                  <img
                    src={`https://flagcdn.com/w40/${selectedCountry.countryCode}.png`}
                    alt=""
                    style={{
                      width: "26px", height: "17px", borderRadius: "4px",
                      objectFit: "cover", border: "1px solid rgba(255,255,255,0.4)",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.3)", opacity: 0.92,
                    }}
                  />
                )}
                <h2 style={{
                  margin: "0.4rem 0 0",
                  fontSize: "2.8rem",
                  lineHeight: 1.02,
                  fontWeight: 700,
                  color: "#fff",
                  textShadow: "0 2px 8px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.25)",
                  letterSpacing: "-0.02em",
                  opacity: isContentVisible ? 1 : 0,
                  transform: isContentVisible ? "translateY(0)" : "translateY(24px)",
                  transition: `opacity 550ms ${springEase}, transform 550ms ${springEase}`,
                  transitionDelay: isContentVisible ? "100ms" : "0ms",
                }}>
                  {selectedCountry.name}
                </h2>
                {selectedCountryMetadata?.memberSince ? (
                  <div style={{
                    fontSize: "0.65rem", fontWeight: 600, color: "#97d749",
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                    pointerEvents: "none", marginTop: "0.35rem", lineHeight: 1.4,
                  }}>
                    Member since {selectedCountryMetadata.memberSince}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div
            className="floating-story-card-scroll"
            onScroll={(e) => {
              const node = e.currentTarget;
              const scrollTop = node.scrollTop;

              if (heroScrollRafRef.current) {
                cancelAnimationFrame(heroScrollRafRef.current);
              }

              heroScrollRafRef.current = requestAnimationFrame(() => {
                // Animate hero height via DOM ref — no React re-render, no jitter
                if (heroOuterRef.current) {
                  const newHeight = Math.max(130, 348 - scrollTop);
                  heroOuterRef.current.style.height = `${newHeight}px`;
                }
                // Fade in glass blur as hero compresses
                if (heroGlassRef.current) {
                  heroGlassRef.current.style.opacity = Math.min(1, scrollTop / 128).toFixed(3);
                }

                const scrolled = scrollTop > 20;
                if (panelScrolledRef.current !== scrolled) {
                  panelScrolledRef.current = scrolled;
                  setIsPanelScrolled(scrolled);
                }

                heroScrollRafRef.current = null;
              });
            }}
            style={{
              width: "100%",
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              color: "#fff",
              boxSizing: "border-box",
            }}
          >
            {/* Hero is now above the scroll container — see sibling div */}

            {selectedCountry ? (
              <div
                style={{
                  padding: "0",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  width: "100%",
                }}
              >

                {/* FamilySearch Collections and Research Helps */}
                <div style={{ padding: `1.5rem ${STORY_CARD_SIDE_PADDING} 1.4rem` }}>
                  {isFamilySearchCollectionsLoading || hasCollections ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr)",
                        gap: "1.5rem",
                        alignItems: "start",
                      }}
                    >
                      <div style={{ minWidth: 0, ...getRevealStyle(1) }}>
                        <div style={{ display: "grid", gap: "0.38rem" }}>
                          {hasCollections ? (
                            <>
                              <div style={{ color: SUBTLE_DARK_CARD_TEXT_COLOR, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginTop: "0.12rem" }}>
                                {isGenealogyCollectionsView ? "FamilySearch Genealogies" : isImageOnlyCollectionsView ? "Image-Only Historical Records" : "FamilySearch Records"}
                              </div>
                              {displayedFamilySearchPreferredCollections.map((collection, index) => (
                                <button
                                  key={`${isGenealogyCollectionsView ? "Genealogies" : isImageOnlyCollectionsView ? "ImageOnly" : "Records"}-${collection.title}-${collection.link}`}
                                  type="button"
                                  onClick={() => setFamilySearchQrDestination({ title: collection.title, url: appendFamilySearchCampaignId(collection.link) })}
                                  style={{ ...familySearchRecordLinkStyle, padding: 0, border: "none", background: "transparent", cursor: "pointer" }}
                                  onMouseEnter={handleFamilySearchRecordMouseEnter}
                                  onMouseLeave={handleFamilySearchRecordMouseLeave}
                                >
                                  <span
                                    ref={(element) => {
                                      recordTitleRefs.current[index] = element;
                                    }}
                                    style={
                                      isGenealogyCollectionsView
                                        ? {
                                          minWidth: 0,
                                          display: "-webkit-box",
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: "vertical",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          wordBreak: "break-word",
                                          overflowWrap: "anywhere",
                                        }
                                        : { minWidth: 0, whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere", display: "block" }
                                    }
                                  >
                                    {collection.title}
                                  </span>
                                </button>
                              ))}
                            </>
                          ) : (
                            <div className="fs-loading-pulse" style={{ color: SUBTLE_DARK_CARD_TEXT_COLOR, fontSize: "0.95rem", textAlign: "left" }}>
                              Loading collections...
                            </div>
                          )}
                        </div>
                        {showFamilySearchLocationUrl ? (
                          <button
                            type="button"
                            onClick={() => setFamilySearchQrDestination({ title: `${selectedCountry.name} FamilySearch research`, url: familySearchLocationUrl })}
                            style={{
                              marginTop: "0.72rem",
                              ...seeMoreLikeLinkStyle,
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                            }}
                            onMouseEnter={handleSeeMoreLikeLinkMouseEnter}
                            onMouseLeave={handleSeeMoreLikeLinkMouseLeave}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                              {renderLinkArrowIcon()}
                              <span>See more</span>
                            </span>
                          </button>
                        ) : (
                          <div style={{ marginTop: "0.72rem", color: SUBTLE_DARK_CARD_TEXT_COLOR, fontSize: "0.9rem", textAlign: "left" }}>
                            Country research page not available.
                          </div>
                        )}
                      </div>

                      <div style={{ minWidth: 0, ...getRevealStyle(2) }}>
                        <h3 style={{ margin: "0 0 0.45rem", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.14em", color: SUBTLE_DARK_CARD_TEXT_COLOR, fontWeight: 700 }}>
                          Research Help
                        </h3>
                        <div style={{ display: "grid", gap: "0.38rem" }}>
                          {researchHelpEntries.length ? (
                            researchHelpEntries.map((entry) => (
                              <button
                                key={`${entry.key}-${entry.value.url}`}
                                type="button"
                                onClick={() => setFamilySearchQrDestination({ title: entry.value.title || entry.label, url: entry.value.url })}
                                style={{ ...researchHelpLinkStyle, padding: 0, border: "none", background: "transparent", cursor: "pointer" }}
                                onMouseEnter={handleResearchHelpMouseEnter}
                                onMouseLeave={handleResearchHelpMouseLeave}
                                title={entry.value.title || entry.label}
                              >
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", minWidth: 0, maxWidth: "100%" }}>
                                  {renderLinkArrowIcon()}
                                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{entry.label}</span>
                                </span>
                              </button>
                            ))
                          ) : (
                            <div style={{ color: SUBTLE_DARK_CARD_TEXT_COLOR, fontSize: "0.95rem", textAlign: "left" }}>No research help links available.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr)",
                        gap: "1.5rem",
                        alignItems: "start",
                      }}
                    >
                      <div style={{ minWidth: 0, ...getRevealStyle(1) }}>
                        <h3 style={{ margin: "0 0 0.65rem", fontSize: "0.85rem", color: "#f8fafc", fontWeight: 600, letterSpacing: "0.01em", lineHeight: 1.4 }}>
                          We don't have collections yet. Get started with our help!
                        </h3>
                        <div style={{ display: "grid", gap: "0.38rem" }}>
                          {researchHelpEntries.length ? (
                            researchHelpEntries.map((entry) => (
                              <button
                                key={`${entry.key}-${entry.value.url}`}
                                type="button"
                                onClick={() => setFamilySearchQrDestination({ title: entry.value.title || entry.label, url: entry.value.url })}
                                style={{ ...researchHelpLinkStyle, padding: 0, border: "none", background: "transparent", cursor: "pointer" }}
                                onMouseEnter={handleResearchHelpMouseEnter}
                                onMouseLeave={handleResearchHelpMouseLeave}
                                title={entry.value.title || entry.label}
                              >
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", minWidth: 0, maxWidth: "100%" }}>
                                  {renderLinkArrowIcon()}
                                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{entry.label}</span>
                                </span>
                              </button>
                            ))
                          ) : (
                            <div style={{ color: SUBTLE_DARK_CARD_TEXT_COLOR, fontSize: "0.95rem", textAlign: "left" }}>No research help links available.</div>
                          )}
                        </div>
                        {showFamilySearchLocationUrl ? (
                          <button
                            type="button"
                            onClick={() => setFamilySearchQrDestination({ title: `${selectedCountry.name} FamilySearch research`, url: familySearchLocationUrl })}
                            style={{
                              marginTop: "0.85rem",
                              ...seeMoreLikeLinkStyle,
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                            }}
                            onMouseEnter={handleSeeMoreLikeLinkMouseEnter}
                            onMouseLeave={handleSeeMoreLikeLinkMouseLeave}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                              {renderLinkArrowIcon()}
                              <span>See more</span>
                            </span>
                          </button>
                        ) : (
                          <div style={{ marginTop: "0.85rem", color: SUBTLE_DARK_CARD_TEXT_COLOR, fontSize: "0.9rem", textAlign: "left" }}>
                            Country research page not available.
                          </div>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }} />
                    </div>
                  )}
                </div>

                {/* Gallery — only show when the country has media items */}
                {galleryItems.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    overflow: "visible",
                    padding: `0 ${STORY_CARD_SIDE_PADDING} 1.4rem`,
                    ...getRevealStyle(3),
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: "8px",
                        width: "32px",
                        background: "linear-gradient(90deg, rgba(2,6,23,0.56) 0%, rgba(2,6,23,0) 100%)",
                        pointerEvents: "none",
                        zIndex: 2,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: "8px",
                        width: "32px",
                        background: "linear-gradient(270deg, rgba(2,6,23,0.56) 0%, rgba(2,6,23,0) 100%)",
                        pointerEvents: "none",
                        zIndex: 2,
                      }}
                    />
                    <div
                      ref={galleryTrackRef}
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        overflowX: "auto",
                        overflowY: "hidden",
                        paddingTop: "2px",
                        paddingBottom: "10px",
                        flex: 1,
                        minHeight: 0,
                        alignItems: "stretch",
                        scrollBehavior: "smooth",
                        WebkitOverflowScrolling: "touch",
                        touchAction: "pan-x",
                        scrollSnapType: "x mandatory",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      {galleryItems.map((item, index) => (
                        <button
                          key={item.id}
                          onClick={() => setLightboxItem(item)}
                          style={{
                            border: "none",
                            background: "transparent",
                            padding: 0,
                            borderRadius: "16px",
                            overflow: "visible",
                            cursor: "pointer",
                            position: "relative",
                            flex: "0 0 72%",
                            minWidth: "0",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.55rem",
                            transform: "translateY(0)",
                            transition: "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)",
                            scrollSnapAlign: "center",
                            opacity: index === galleryActiveIndex ? 1 : 0.72,
                            filter: index === galleryActiveIndex ? "saturate(1.08)" : "saturate(0.88)",
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.transform = "translateY(-2px)";
                            event.currentTarget.style.opacity = "1";
                            event.currentTarget.style.filter = "saturate(1.12)";
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.transform = "translateY(0)";
                            event.currentTarget.style.opacity = index === galleryActiveIndex ? "1" : "0.72";
                            event.currentTarget.style.filter = index === galleryActiveIndex ? "saturate(1.08)" : "saturate(0.88)";
                          }}
                        >
                          <div style={{
                            borderRadius: "14px",
                            overflow: "hidden",
                            aspectRatio: "32 / 9",
                            position: "relative",
                            transform: "translate3d(0, 0, 0)",
                            WebkitTransform: "translate3d(0, 0, 0)",
                            isolation: "isolate",
                            boxShadow: index === galleryActiveIndex
                              ? "0 18px 38px rgba(15,23,42,0.38), inset 0 0 0 1px rgba(255,255,255,0.22)"
                              : "0 8px 18px rgba(15,23,42,0.2), inset 0 0 0 1px rgba(255,255,255,0.1)",
                            transition: "box-shadow 240ms cubic-bezier(0.22, 1, 0.36, 1)",
                          }}>
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              style={{ width: "100%", height: "100%", objectFit: "cover", background: "#1a1a1a", display: "block", borderRadius: "inherit" }}
                            />
                            {item.type === "video" ? (
                              <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.4) 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#c4302b">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                            ) : null}
                          </div>
                          <div style={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: index === galleryActiveIndex ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.6)",
                            lineHeight: 1.3,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textAlign: "left",
                            paddingLeft: "4px",
                            transition: "color 240ms ease",
                          }}>
                            {item.title}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {galleryItems.length > 1 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginTop: "0.45rem" }}>
                      <div style={{ flex: 1, display: "flex", justifyContent: showGalleryNavigation ? "flex-start" : "center", gap: "0.34rem" }}>
                        {galleryItems.map((item, index) => (
                          <div
                            key={`gallery-dot-${item.id}`}
                            style={{
                              width: index === galleryActiveIndex ? "20px" : "7px",
                              height: "7px",
                              borderRadius: "999px",
                              background: index === galleryActiveIndex
                                ? "linear-gradient(90deg, rgba(255,255,255,0.95), rgba(226,232,240,0.82))"
                                : "rgba(148, 163, 184, 0.46)",
                              boxShadow: index === galleryActiveIndex ? "0 0 10px rgba(255,255,255,0.32)" : "none",
                              transition: "all 220ms cubic-bezier(0.22, 1, 0.36, 1)",
                            }}
                          />
                        ))}
                      </div>

                      {showGalleryNavigation ? (
                        <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                          <button
                            onClick={() => scrollGallery("left")}
                            style={{
                              border: "1px solid rgba(226,232,240,0.28)",
                              background: "linear-gradient(160deg, rgba(255,255,255,0.18), rgba(148,163,184,0.12))",
                              color: "#e2e8f0",
                              borderRadius: "999px",
                              width: "30px",
                              height: "30px",
                              cursor: "pointer",
                              lineHeight: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 200ms cubic-bezier(0.22, 1, 0.36, 1)",
                              opacity: 0.9,
                              boxShadow: "0 6px 16px rgba(15,23,42,0.28)",
                              flexShrink: 0,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "#ffffff";
                              e.currentTarget.style.transform = "translateY(-1px)";
                              e.currentTarget.style.background = "linear-gradient(160deg, rgba(255,255,255,0.25), rgba(148,163,184,0.18))";
                              e.currentTarget.style.opacity = "1";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "#e2e8f0";
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.background = "linear-gradient(160deg, rgba(255,255,255,0.18), rgba(148,163,184,0.12))";
                              e.currentTarget.style.opacity = "0.9";
                            }}
                            aria-label="Previous"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m15 18-6-6 6-6" />
                            </svg>
                          </button>

                          <button
                            onClick={() => scrollGallery("right")}
                            style={{
                              border: "1px solid rgba(226,232,240,0.28)",
                              background: "linear-gradient(160deg, rgba(255,255,255,0.18), rgba(148,163,184,0.12))",
                              color: "#e2e8f0",
                              borderRadius: "999px",
                              width: "30px",
                              height: "30px",
                              cursor: "pointer",
                              lineHeight: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 200ms cubic-bezier(0.22, 1, 0.36, 1)",
                              opacity: 0.9,
                              boxShadow: "0 6px 16px rgba(15,23,42,0.28)",
                              flexShrink: 0,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "#ffffff";
                              e.currentTarget.style.transform = "translateY(-1px)";
                              e.currentTarget.style.background = "linear-gradient(160deg, rgba(255,255,255,0.25), rgba(148,163,184,0.18))";
                              e.currentTarget.style.opacity = "1";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "#e2e8f0";
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.background = "linear-gradient(160deg, rgba(255,255,255,0.18), rgba(148,163,184,0.12))";
                              e.currentTarget.style.opacity = "0.9";
                            }}
                            aria-label="Next"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                ) : null}

                {/* Overview + Statistics in editorial two-column */}
                <div style={{ padding: `0 ${STORY_CARD_SIDE_PADDING} 2rem`, ...getRevealStyle(4) }}>
                  <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.1)", margin: "0 0 1.3rem" }} />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 0.7fr)",
                      gap: "1.4rem",
                      alignItems: "start",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <p
                        ref={overviewTextRef}
                        style={{
                          margin: 0,
                          lineHeight: 1.8,
                          fontSize: "1.02rem",
                          color: "rgba(255,255,255,0.88)",
                          overflow: "hidden",
                          display: isOverviewExpanded ? "block" : "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: isOverviewExpanded ? "unset" : 7,
                        }}
                      >
                        {selectedCountry.overview}
                      </p>
                      {hasOverviewOverflow ? (
                        <button
                          onClick={() => setIsOverviewExpanded((value) => !value)}
                          style={{
                            marginTop: "0.8rem",
                            border: "none",
                            background: "transparent",
                            color: "#87b940",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            textAlign: "left",
                            cursor: "pointer",
                            padding: 0,
                            alignSelf: "flex-start",
                          }}
                        >
                          {isOverviewExpanded ? "Read Less" : "Read More →"}
                        </button>
                      ) : null}
                    </div>

                    <div style={{ display: "grid", gap: "0.78rem", minWidth: 0 }}>
                      {detailStatItems.map((item) => (
                        <div
                          key={item.label}
                          style={{
                            borderRadius: "16px",
                            background: "linear-gradient(180deg, rgba(17, 24, 39, 0.9) 0%, rgba(15, 23, 42, 0.82) 100%)",
                            border: "1px solid rgba(148, 163, 184, 0.34)",
                            boxShadow: "inset 0 1px 0 rgba(226,232,240,0.12), 0 10px 22px rgba(2,6,23,0.34)",
                            padding: "1rem 1.05rem",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                          }}
                        >
                          <div style={{ marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            {renderStatIcon(item.label)}
                            <span style={{ fontSize: "0.69rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(226,232,240,0.76)", fontWeight: 700 }}>
                              {item.label}
                            </span>
                          </div>
                          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", textShadow: "0 1px 0 rgba(2,6,23,0.55)" }}>{item.value}</div>
                        </div>
                      ))}
                      {selectedCountry && getCountryData(selectedCountry)?.source && (
                        <div style={{ fontSize: "0.62rem", color: "rgba(226, 232, 240, 0.45)", textAlign: "right", marginTop: "-0.2rem", paddingRight: "0.2rem", fontStyle: "italic" }}>
                          Source: {getCountryData(selectedCountry).source}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* ACHIEVEMENT + CERTIFICATE FLOW (Phases 1-3) */}
        {achievementUnlocked && !certificateStep ? (
          <AchievementModal
            unlocked={achievementUnlocked}
            onClose={() => setAchievementUnlocked(null)}
            onViewCertificate={openCertificateFlow}
            onAddToWallet={async () => {
              const res = await createPass({
                milestone: achievementUnlocked.count,
                totalVisited: visitedVoyagerCountries.length,
                visitedNames: visitedVoyagerCountries,
                heroImageUrl: null,
                userId: explorerId
              });
              return res?.shareUrl;
            }}
            isWalletLoading={isWalletLoading}
            walletError={walletError}
            hasWalletPass={hasPass(achievementUnlocked.count)}
          />
        ) : null}

        {certificateStep === 'name' ? (
          <CertificateNameDialog
            onCancel={() => setCertificateStep(null)}
            onSubmit={(name) => {
              setCertificateName(name);
              setCertificateStep('qr');
            }}
          />
        ) : null}

        {certificateStep === 'qr' && activeCertificateBadgeLevel && activeCertificateLevelName ? (
          <CertificateQRCode
            name={certificateName}
            badgeLevel={activeCertificateBadgeLevel}
            levelName={activeCertificateLevelName}
            certificateUrl={buildCertificateUrl({
              name: certificateName,
              level: activeCertificateLevelName,
              badgeLevel: activeCertificateBadgeLevel,
              date: new Date().toISOString(),
            })}
            onClose={() => {
              setAchievementUnlocked(null);
              setCertificateStep(null);
              setCertificateName('');
            }}
          />
        ) : null}

        {familySearchQrDestination ? (
          <FamilySearchQrModal
            destination={familySearchQrDestination.url}
            title={familySearchQrDestination.title}
            onClose={() => setFamilySearchQrDestination(null)}
          />
        ) : null}

        {lightboxItem ? (
          <div
            onClick={() => setLightboxItem(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(5, 5, 5, 0.98)", // Replaced 0.88 + blur(40px) with almost solid black for performance on thin clients
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className="lightbox-outer-row"
              style={{ position: "relative" }}
            >
              {/* Glass Close Button (positioned absolute at top-right of the whole lightbox modal) */}
              <button
                onClick={() => setLightboxItem(null)}
                style={{
                  position: "absolute",
                  top: "1.15rem",
                  right: "1.15rem",
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 200ms ease",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.08), 0 4px 12px rgba(0,0,0,0.2)",
                  zIndex: 99,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                aria-label="Close"
              >
                ×
              </button>
              {/* Main Content Row: Left Column (Media + Thumbnails) + Right Sidebar (Details) */}
              <div className="lightbox-content-row" style={{ display: "flex", flexDirection: "row", flex: 1, minHeight: 0 }}>
                {/* Left Column (Video/Photo Player + Thumbnails Carousel) */}
                <div className="lightbox-left-column">
                  {/* Player wrapper */}
                  <div style={{
                    position: "relative",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.12)",
                    background: "#000",
                    width: "100%",
                    flexShrink: 0,
                  }}>
                    {lightboxItem.type === "video" ? (
                      <div style={{ position: "relative", paddingTop: "56.25%" }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${lightboxItem.videoId}?autoplay=1&rel=0&modestbranding=1&controls=0&showinfo=0&iv_load_policy=3&cc_load_policy=0`}
                          title={lightboxItem.title}
                          allow="autoplay; encrypted-media; picture-in-picture"
                          allowFullScreen
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            border: "none",
                          }}
                        />
                      </div>
                    ) : (
                      <img
                        src={lightboxItem.sourceUrl}
                        alt={lightboxItem.title}
                        style={{ width: "100%", maxHeight: "50vh", objectFit: "contain", display: "block" }}
                      />
                    )}
                  </div>

                  {/* Horizontal Playlist Thumbnails Dock underneath player */}
                  {galleryItems.length > 1 ? (
                    <div className="lightbox-thumbnails-row" style={{ flexShrink: 0 }}>
                      <div
                        ref={thumbnailsTrackRef}
                        className="lightbox-thumbnails-track fade-right"
                        onScroll={(e) => updateScrollFades(e.currentTarget)}
                      >
                        {(() => {
                          const sortedGalleryItems = [...galleryItems].sort((a, b) => {
                            if (a.id === lightboxItem.id) return -1;
                            if (b.id === lightboxItem.id) return 1;
                            return 0;
                          });
                          return sortedGalleryItems.map((item) => {
                            const isActive = item.id === lightboxItem.id;
                            const isViewed = viewedVideoIds.has(item.id);
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setViewedVideoIds(prev => {
                                    const next = new Set(prev);
                                    next.add(item.id);
                                    return next;
                                  });
                                  setLightboxItem(item);
                                }}
                                className={`lightbox-thumbnail-btn ${isActive ? 'active' : ''}`}
                                title={item.title}
                              >
                                <img
                                  src={item.thumbnailUrl}
                                  alt=""
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    filter: (!isActive && isViewed) ? "grayscale(100%) opacity(0.65)" : "none",
                                    transition: "filter 300ms ease",
                                  }}
                                />
                                {item.type === 'video' ? (
                                  <div style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "rgba(0,0,0,0.3)",
                                  }}>
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ color: "#fff", margin: "auto" }}>
                                      <path d="M8 5v14l11-7z"/>
                                    </svg>
                                  </div>
                                ) : null}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Right Sidebar (Header: flag; Body: title + description scroll + credit) */}
                <div className="lightbox-sidebar">
                  {/* Sidebar Header */}
                  <div className="lightbox-sidebar-header">
                    {/* Flag Badge Pill */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      padding: "0.35rem 0.65rem",
                      borderRadius: "999px",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}>
                      {selectedCountry.countryCode && (
                        <img
                          src={`https://flagcdn.com/w40/${selectedCountry.countryCode}.png`}
                          alt=""
                          style={{
                            width: "18px",
                            height: "12px",
                            borderRadius: "2px",
                            objectFit: "cover",
                          }}
                        />
                      )}
                      <span style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "rgba(255, 255, 255, 0.85)",
                        letterSpacing: "0.02em",
                      }}>
                        {selectedCountry.name}
                      </span>
                    </div>
                  </div>

                  {/* Sidebar Body */}
                  <div className="lightbox-sidebar-body" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                    <h2 style={{
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      color: "#fff",
                      margin: "0 0 0.5rem 0",
                      lineHeight: 1.35,
                      flexShrink: 0,
                    }}>
                      {lightboxItem.title}
                    </h2>

                    {/* Apple-like scrolling description wrapper with vertical fade effect */}
                    <div className="lightbox-desc-wrapper lightbox-desc-fade-scroll">
                      <div className="lightbox-desc-container">
                        <div style={{
                          fontSize: "0.88rem",
                          color: "rgba(255, 255, 255, 0.72)",
                          lineHeight: 1.55,
                          whiteSpace: "pre-wrap",
                          paddingBottom: "1.5rem",
                        }}>
                          {lightboxItem.description}
                        </div>
                      </div>
                    </div>

                    {lightboxItem.credit ? (
                      <div style={{
                        fontSize: "0.75rem",
                        color: "rgba(255, 255, 255, 0.38)",
                        fontStyle: "italic",
                        marginTop: "auto",
                        paddingTop: "0.85rem",
                        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                        flexShrink: 0,
                      }}>
                        {lightboxItem.credit}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : null}
      </div>
    </AppContext.Provider>
  );
}
