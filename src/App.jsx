import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, useMap } from "react-leaflet";
import countries from "./data/countries.json";
import countryResearchLinks from "./data/countryResearchLinks.json";
import commonwealthMetadata from "./data/commonwealthMetadata.json";
import countryStats from "./data/countryStats.json";
import "leaflet/dist/leaflet.css";

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

const GEOJSON_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson";
const GEOJSON_FALLBACK_URLS = [
  GEOJSON_URL,
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_admin_0_countries.geojson",
];
const FAMILYSEARCH_LOGO_URL = "https://edge.fscdn.org/assets/static/media/familysearch-tree.dc22204d2135c739e39d0af7d519e182.svg";
const MAP_BACKGROUND_ART_URL = "https://plus.unsplash.com/premium_photo-1779463020508-7cd254b1d37f?auto=format&fit=crop&w=2400&q=80";
const FAMILYSEARCH_COLLECTIONS_BASE_URL = "https://www.familysearch.org/en/search/collection/list";
const FAMILYSEARCH_FETCH_MIRROR_BASE_URL = "https://r.jina.ai/http://www.familysearch.org";
const FAMILYSEARCH_CACHE_STORAGE_KEY = "familySearchCollectionsCache:v6";
const FAMILYSEARCH_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const FAMILYSEARCH_GENEALOGY_KEYWORD_REGEX = /\b(genealog(?:y|ies)|family\s*tree|lineage)\b/i;
const DEFAULT_GALLERY_VIDEO_ID = "aqz-KE-bpKQ";
const COUNTRY_GALLERY_VIDEO_ID_BY_NAME = {
  australia: "mWl65Qriw6A",
  canada: "9Auq9mYxFEE",
  india: "35npVaFGHMY",
  "new zealand": "fHCemviY06Y",
  "south africa": "4N5vBf2M6fQ",
};
const FAMILYSEARCH_LOCATION_URL_BY_COUNTRY = {
  "antigua and barbuda": "https://www.familysearch.org/en/search/location/caribbean-and-central-america/antigua-and-barbuda",
  australia: "https://www.familysearch.org/en/search/location/australia-&-new-zealand/australia",
  "the bahamas": "https://www.familysearch.org/en/search/location/caribbean-and-central-america/bahamas",
  bangladesh: "https://www.familysearch.org/en/search/location/asia-&-middle-east/bangladesh",
  barbados: "https://www.familysearch.org/en/search/location/caribbean-and-central-america/barbados",
  belize: "https://www.familysearch.org/en/search/location/caribbean-and-central-america/belize",
  botswana: "https://www.familysearch.org/en/search/location/africa/botswana",
  "brunei darussalam": "https://www.familysearch.org/en/search/location/asia-&-middle-east/brunei",
  cameroon: "https://www.familysearch.org/en/search/location/africa/cameroon",
  canada: "https://www.familysearch.org/en/search/location/canada",
  cyprus: "https://www.familysearch.org/en/search/location/asia-&-middle-east/cyprus",
  dominica: "https://www.familysearch.org/en/search/location/caribbean-and-central-america/dominica",
  eswatini: "https://www.familysearch.org/en/search/location/africa/eswatini",
  fiji: "https://www.familysearch.org/en/search/location/pacific-islands/fiji",
  gabon: "https://www.familysearch.org/en/search/location/africa/gabon",
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
  "st kitts and nevis": "https://www.familysearch.org/en/search/location/caribbean-and-central-america/saint-kitts-and-nevis",
  "saint lucia": "https://www.familysearch.org/en/search/location/caribbean-and-central-america/saint-lucia",
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
  "united republic of tanzania": { region: "Tanzania" },
  vanuatu: { region: "Vanuatu" },
  zambia: { region: "Zambia" },
};
const COMMONWEALTH_VIEW = {
  center: [18, 20],
  zoom: 2.8,
};
const COMMONWEALTH_MAP_BOUNDS = [
  [-62, -178],
  [84, 178],
];
const COMMONWEALTH_MIN_ZOOM = 2.8;
const KIOSK_IDLE_TIMEOUT_MS = 70_000;
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
const VOYAGER_TOTAL_COUNTRIES = countries.length;

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
  const match = pageText.match(/\[See all [^\]]*Collections\]\((https?:\/\/www\.familysearch\.org\/en\/search\/collection\/list\?[^)]+)\)/i);
  return match ? match[1] : null;
}

function parseGenealogySeeAllUrlFromLocationPage(pageText = "") {
  const match = pageText.match(/\[See all [^\]]*Genealogies\]\((https?:\/\/www\.familysearch\.org\/en\/search\/genealogies\/submissions\?[^)]+)\)/i);
  return match ? match[1] : null;
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

  return /\/en\/search\/genealogies\/submission\//i.test(pageText);
}

function buildFamilySearchGenealogyFallback(countryName = "") {
  return [
    {
      title: `${countryName} Genealogies`,
      link: `https://www.familysearch.org/en/search/genealogies/submissions?q.place=${encodeURIComponent(countryName)}`,
      updated: "",
      updatedAt: new Date(0),
      category: "genealogy",
    },
  ];
}

function parseFamilySearchCollectionsFromLocationPage(pageText = "") {
  const seenRecordLinks = new Set();
  const seenGenealogyLinks = new Set();
  const records = [];
  const genealogies = [];
  let activeSection = "";

  pageText.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      return;
    }

    if (/^##\s+Indexed Historical Records$/i.test(trimmedLine) || /^##\s+Image-Only Historical Records$/i.test(trimmedLine)) {
      activeSection = "records";
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
    const link = match[2].trim();
    if (!title || !link) {
      return;
    }

    if (activeSection === "records" && /\/en\/search\/collection\/\d+/i.test(link)) {
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

    if (activeSection === "genealogies" && /\/en\/search\/genealogies\/submission\//i.test(link)) {
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
    records: records.slice(0, 3),
    genealogies: genealogies.slice(0, 3),
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

function splitFamilySearchCollectionsByCategory(collections = []) {
  const records = [];
  const genealogies = [];

  collections.forEach((collection) => {
    if (!collection?.title || !collection?.link) {
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

  return { records, genealogies };
}

function getFamilySearchCollectionsForFallback(collections = []) {
  const { records, genealogies } = splitFamilySearchCollectionsByCategory(collections);

  if (records.length > 0) {
    return {
      categoryLabel: "Records Available",
      collections: records,
      hasRecords: true,
      hasGenealogies: genealogies.length > 0,
    };
  }

  if (genealogies.length > 0) {
    return {
      categoryLabel: "Genealogies Available",
      collections: genealogies,
      hasRecords: false,
      hasGenealogies: true,
    };
  }

  return {
    categoryLabel: "",
    collections: [],
    hasRecords: false,
    hasGenealogies: false,
  };
}

function MapBounds() {
  const map = useMap();

  useEffect(() => {
    // Only constrain minimum zoom to prevent zooming out too far.
    // No maxBounds — let the map feel open and premium like Apple Maps.
    // The app controls all meaningful camera movement via flyTo.
    map.setMinZoom(COMMONWEALTH_MIN_ZOOM);
    map.options.worldCopyJump = false;
  }, [map]);

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
    
    // Longitude lines every 20 degrees
    for (let lng = -160; lng <= 160; lng += 20) {
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

  const commonwealthNames = new Set(countries.map((c) => normalizeName(c.name)));
  const hoveredCountryNormalized = normalizeName(hoveredCountry || "");

  // Get marker style that mirrors getCountryStyle for polygons
  const getMarkerStyle = (country) => {
    const isSelected = Boolean(
      country && selectedCountry?.name && country.name === selectedCountry.name
    );
    const isActivatedSelected = Boolean(
      isSelected && activatedCountryName && country.name === activatedCountryName
    );
    const isExternallyHovered = Boolean(
      country &&
        hoveredCountryNormalized &&
        normalizeName(country.name) === hoveredCountryNormalized
    );
    const isHovered = Boolean(isExternallyHovered && !isSelected);

    // Activated selected state (panel open/closed)
    if (isActivatedSelected) {
      const selectedColor = isPanelOpen ? "#F16458" : "#333536";
      return {
        radius: 10,
        fillColor: selectedColor,
        color: selectedColor,
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
        glow: isPanelOpen,
      };
    }

    // Selected state
    if (isSelected) {
      return {
        radius: 10,
        fillColor: "#87B940",
        color: "#87B940",
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
        glow: false,
      };
    }

    // Hovered state
    if (isHovered) {
      return {
        radius: 10,
        fillColor: "#F16458",
        color: "#F16458",
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
        glow: true,
      };
    }

    // Default state
    return {
      radius: 8,
      fillColor: "#87B940",
      color: "#87B940",
      weight: 2,
      opacity: 1,
      fillOpacity: 1,
      glow: false,
    };
  };

  useEffect(() => {
    if (!geojson || !map) {
      return;
    }

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
        radius: 8,
        fillColor: "#87B940",
        color: "#87B940",
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      });

      // Store country data with marker
      markerDataRef.current.set(marker, country);

      // Get marker element and apply transition styles
      const applyTransitionStyles = () => {
        const element = marker.getElement();
        if (element) {
          element.style.transition =
            `fill ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}, stroke ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}, r ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}, filter ${MAP_HIGHLIGHT_TRANSITION_MS}ms ${MAP_HIGHLIGHT_EASE}`;
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
        const element = marker.getElement();
        if (element) {
          element.style.cursor = "pointer";
        }
        onCountryHover?.(country.name);
      });

      marker.on("mouseout", () => {
        onCountryHover?.(null);
      });

      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        onCountryHover?.(null);
        onSelectCountry(country);
      });

      markers.addLayer(marker);
    });

    markers.addTo(map);

    return () => {
      markers.remove();
      markerDataRef.current.clear();
    };
  }, [geojson, map, onSelectCountry, onCountryHover]);

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

      // Apply glow effect
      if (element) {
        element.style.filter = isAttractMode
          ? "none"
          : style.glow
            ? "drop-shadow(0 0 8px rgba(241, 100, 88, 0.35))"
            : "none";
      }
    });
  }, [hoveredCountry, selectedCountry, activatedCountryName, isPanelOpen, isAttractMode]);

  // Update marker visibility based on zoom
  useEffect(() => {
    if (!map || !markersRef.current) {
      return;
    }

    const updateMarkerVisibility = () => {
      const zoom = map.getZoom();
      const showMarkers = zoom < 4.5;

      markersRef.current.eachLayer((layer) => {
        if (showMarkers) {
          layer.setStyle({ opacity: 1, fillOpacity: 1 });
        } else {
          layer.setStyle({ opacity: 0, fillOpacity: 0 });
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

  const commonwealthNames = new Set(countries.map((c) => normalizeName(c.name)));
  const hoveredCountryNormalized = normalizeName(hoveredCountry || "");

  const getCountryStyle = (feature, options = {}) => {
    const country = findCountryByFeature(feature, commonwealthNames);
    const isCommonwealth = Boolean(country);
    const isSelected = Boolean(country && selectedCountry?.name && country.name === selectedCountry.name);
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
        weight: 1.5,
        fillColor: selectedColor,
        fillOpacity: 0.7,
        opacity: 1,
        noClip: true,
      };
    }

    if (isSelected) {
      return {
        color: "#87B940",
        weight: 0.45,
        fillColor: "#87B940",
        fillOpacity: 1,
        opacity: 1,
        noClip: true,
      };
    }

    if (isHovered) {
      return {
        color: "#F16458",
        weight: 0.9,
        fillColor: "#F16458",
        fillOpacity: 1,
        opacity: 1,
        noClip: true,
      };
    }

    if (isCommonwealth) {
      return {
        color: "#87B940",
        weight: 0.3,
        fillColor: "#87B940",
        fillOpacity: 1,
        opacity: 1,
        noClip: true,
      };
    }

    return {
      color: "#E8E5E0",
      weight: 0.15,
      fillColor: "#F3F1EE",
      fillOpacity: 0.85,
      opacity: 1,
      noClip: true,
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
              element.style.filter = "drop-shadow(0 0 8px rgba(241, 100, 88, 0.5)) drop-shadow(0 0 16px rgba(241, 100, 88, 0.25))";
            } else if (isHovered) {
              element.style.filter = "drop-shadow(0 0 6px rgba(241, 100, 88, 0.35)) drop-shadow(0 0 12px rgba(241, 100, 88, 0.18))";
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
      key={selectedCountry?.name || "default"}
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
          applySoftTransition("in");
          layer.setStyle(getCountryStyle(feature, { isHovered: true }));
          layer.getElement()?.style?.setProperty("cursor", "pointer");
          onCountryHover?.(country.name);
        });

        layer.on("mouseout", () => {
          applySoftTransition("out");
          layer.setStyle(getCountryStyle(feature));
          onCountryHover?.(null);
        });

        layer.on("click", (event) => {
          event.originalEvent?.stopPropagation();
          L.DomEvent.stopPropagation(event);

          const country = findCountryByFeature(feature, commonwealthNames);
          if (!country) {
            return;
          }

          onCountryHover?.(null);
          onSelectCountry(country);
        });
      }}
    />
  );
}

export default function App() {
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
  const [activatedCountryName, setActivatedCountryName] = useState(null);
  const [heroMotionSeed, setHeroMotionSeed] = useState(0);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [countryDataCache] = useState(countryStatsByLookup);
  const [familySearchCollections, setFamilySearchCollections] = useState([]);
  const [lightboxItem, setLightboxItem] = useState(null);
  const [showGalleryNavigation, setShowGalleryNavigation] = useState(false);
  const [galleryActiveIndex, setGalleryActiveIndex] = useState(0);
  const [isFamilySearchCacheReady, setIsFamilySearchCacheReady] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [hasOverviewOverflow, setHasOverviewOverflow] = useState(false);
  const [recordCollectionsDisplayLimit, setRecordCollectionsDisplayLimit] = useState(3);
  const [validatedHeroImage, setValidatedHeroImage] = useState(null);
  const [isIdleAttractMode, setIsIdleAttractMode] = useState(true);
  const [isButtonTransitioning, setIsButtonTransitioning] = useState(false);
  const [attractRouteSwooshes, setAttractRouteSwooshes] = useState([]);
  const [attractHeroRoute, setAttractHeroRoute] = useState(null);
  const [isDockSearchExpanded, setIsDockSearchExpanded] = useState(false);
  const [dockSearchActivityTick, setDockSearchActivityTick] = useState(0);
  const [isMenuOpening, setIsMenuOpening] = useState(false);
  const [visitedVoyagerCountries, setVisitedVoyagerCountries] = useState([]);
  const [voyagerNotice, setVoyagerNotice] = useState(null);
  const [voyagerCompletionVisible, setVoyagerCompletionVisible] = useState(false);
  const [achievementUnlocked, setAchievementUnlocked] = useState(null);
  const [isVoyagerExpanded, setIsVoyagerExpanded] = useState(false);
  const [voyagerBadgeAnimToken, setVoyagerBadgeAnimToken] = useState(0);
  const mapRef = useRef(null);
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
  };

  const exitIdleAttractMode = () => {
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
    const getPanelAwareCenter = (latlng, zoom) => {
      const projectedPoint = map.project(latlng, zoom);
      const shiftedPoint = L.point(projectedPoint.x + panelWidth / 2, projectedPoint.y);
      return map.unproject(shiftedPoint, zoom);
    };

    const override = countryZoomOverrides[country.name];
    if (override) {
      map.flyTo(getPanelAwareCenter(override.center, override.zoom), override.zoom, {
        duration: 1.6,
        easeLinearity: 0.15,
      });
      return;
    }

    const normalized = normalizeName(country.name);
    const layer = countryLayerRefs.current[normalized];

    if (layer) {
      try {
        const bounds = layer.getBounds();

        // Use asymmetric padding to keep selected country visible left of the side panel.
        map.flyToBounds(bounds, {
          paddingTopLeft: [80, 80],
          paddingBottomRight: [rightPadding, 80],
          maxZoom: 6,
          duration: 1.6,
          easeLinearity: 0.15
        });
        return;
      } catch (_) {
        // fall through to flyTo
      }
    }

    const fallbackZoom = 2.6;
    map.flyTo(getPanelAwareCenter([country.lat, country.lng], fallbackZoom), fallbackZoom, {
      duration: 1.6,
      easeLinearity: 0.15,
    });
  };

  const handleReset = ({ reopenDock = false } = {}) => {
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

    window.setTimeout(() => {
      if (reopenDock) {
        setIsMenuOpen(true);
        setIsMenuClosing(false);
        return;
      }

      setIsMenuOpen(false);
      setIsMenuClosing(false);
    }, 200);

    if (mapRef?.current) {
      mapRef.current.stop();

      // Let the panel start closing first so the map does not feel clipped,
      // then perform a soft zoom-out to the default view.
      panelOpenTimeoutRef.current = setTimeout(() => {
        if (!mapRef?.current) {
          return;
        }

        mapRef.current.invalidateSize();
        mapRef.current.flyTo(COMMONWEALTH_VIEW.center, COMMONWEALTH_VIEW.zoom, {
          duration: 0.85,
          easeLinearity: 0.22,
        });
        panelOpenTimeoutRef.current = null;
      }, 180);
    }
  };

  const handleSelectCountry = (country) => {
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
    const alreadyVisited = visitedVoyagerCountriesRef.current.includes(countryKey);

    if (!alreadyVisited) {
      const nextVisitedCountries = [...visitedVoyagerCountriesRef.current, countryKey];
      visitedVoyagerCountriesRef.current = nextVisitedCountries;
      setVisitedVoyagerCountries(nextVisitedCountries);

      clearVoyagerProgressTimers();

      // Check for milestone achievements
      const milestoneCounts = [5, 10, 25, 40, 56];
      const milestoneTitles = {
        5: "It Begins as a Curious Explorer",
        10: "That Feeling of Commonwealth Traveller",
        25: "You're a serious Global Navigator",
        40: "Way to go World Voyager",
        56: "You're a Golden Commonwealth Explorer"
      };
      
      const reachedMilestone = milestoneCounts.find(m => nextVisitedCountries.length === m);
      
      if (reachedMilestone) {
        setVoyagerBadgeAnimToken((value) => value + 1);

        // Show achievement unlock animation
        setAchievementUnlocked({
          count: reachedMilestone,
          title: milestoneTitles[reachedMilestone],
          badge: getBadgeForCount(reachedMilestone)
        });

        // Auto-dismiss after 4 seconds
        achievementUnlockTimeoutRef.current = window.setTimeout(() => {
          setAchievementUnlocked(null);
          achievementUnlockTimeoutRef.current = null;
        }, 4000);
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
          label: `${country.name} added`,
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
    setIsPanelOpen(true);
    setIsPanelVisible(false);
    setIsOverlayVisible(false);
    setIsContentVisible(false);
    setActivatedCountryName(null);

    const hasCachedCollections = Object.prototype.hasOwnProperty.call(
      familySearchCollectionsCacheRef.current,
      countryKey
    );

    if (!hasCachedCollections) {
      loadFamilySearchCollectionsForCountry(country.name).then((collections) => {
        if (selectedCountryKeyRef.current === countryKey) {
          setFamilySearchCollections(collections || []);
        }
      });
    }

    const activationTimeout = window.setTimeout(() => {
      setActivatedCountryName(country.name);
    }, 150);
    const overlayTimeout = window.setTimeout(() => {
      setIsOverlayVisible(true);
    }, 300);
    const panelTimeout = window.setTimeout(() => {
      setIsPanelVisible(true);
    }, 700);
    const contentTimeout = window.setTimeout(() => {
      setIsContentVisible(true);
    }, 760);

    selectionTimelineTimeoutsRef.current = [
      activationTimeout,
      overlayTimeout,
      panelTimeout,
      contentTimeout,
    ];

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
    setIsButtonTransitioning(true);

    // Exit idle mode and bring dock in from the same visual anchor as the button.
    setIsIdleAttractMode(false);
    clearAttractPresentation();

    setIsMenuClosing(false);
    setIsMenuOpen(true);

    window.setTimeout(() => {
      setIsButtonTransitioning(false);
    }, EXHIBIT_TRANSITION_MS);
  };

  const handleExploreCommonwealthPress = () => {
    if (selectedCountry) {
      setIsButtonTransitioning(true);
      handleReset({ reopenDock: true });
      window.setTimeout(() => {
        setIsButtonTransitioning(false);
      }, EXHIBIT_TRANSITION_MS);
      return;
    }

    beginExploration();
  };

  const handleGeojsonLoad = (data) => {
    setGeojson(data);
    setMapLoadError("");
  };

  const handleGeojsonError = (message = "") => {
    setMapLoadError(message);
  };

  const handleCountryHover = (countryName = null) => {
    if (countryName) {
      markUserActivity();
    }
    setHoveredCountry(countryName);
  };

  // Get country data with Wikidata cache fallback to countries.json
  const getCountryData = (country) => {
    const lookupKeys = getCountryLookupKeys(country.name);
    const cached = lookupKeys.reduce((match, lookupKey) => match || countryDataCache[lookupKey], null);

    if (cached) {
      return {
        capital: cached.capital || country.capital || "Not available",
        population: cached.population || country.population || null,
      };
    }

    if (!loggedMissingApiMatches.current.has(country.name)) {
      console.log("No API match:", country.name);
      loggedMissingApiMatches.current.add(country.name);
    }

    return {
      capital: country.capital || "Not available",
      population: country.population || null,
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
        familySearchCollectionsCacheRef.current = parsed.collectionsByCountry || {};
        familySearchCollectionUrlCacheRef.current = parsed.urlByCountry || {};
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

    if (Object.prototype.hasOwnProperty.call(familySearchCollectionsCacheRef.current, cacheKey)) {
      return familySearchCollectionsCacheRef.current[cacheKey];
    }

    if (familySearchCollectionsInFlightRef.current[cacheKey]) {
      return familySearchCollectionsInFlightRef.current[cacheKey];
    }

    const strictFallbackUrl = buildFamilySearchCollectionUrl(countryName, { requirePlaceId: true });
    const broadFallbackUrl = buildFamilySearchCollectionUrl(countryName, { requirePlaceId: false });
    const locationUrl = getFamilySearchLocationUrl(countryName);

    const requestPromise = (async () => {
      try {
      let url = familySearchCollectionUrlCacheRef.current[cacheKey] || null;
      const candidateUrls = [];
      let genealogyFallbackCollections = null;
      const countryTerms = getCountryMatchTerms(countryName);

      const filterCollectionsByCountryRelevance = (collections = []) => {
        if (!countryTerms.length) {
          return collections;
        }

        return collections.filter((collection) => {
          const title = (collection?.title || "").toLowerCase();
          const link = decodeURIComponent(collection?.link || "").toLowerCase();
          const haystack = `${title} ${link}`;

          return countryTerms.some((term) => {
            const normalizedTerm = term.toLowerCase();
            const compactTerm = normalizedTerm.replace(/\s+/g, "");
            const hyphenatedTerm = normalizedTerm.replace(/\s+/g, "-");
            const underscoredTerm = normalizedTerm.replace(/\s+/g, "_");

            return (
              haystack.includes(normalizedTerm) ||
              haystack.includes(compactTerm) ||
              haystack.includes(hyphenatedTerm) ||
              haystack.includes(underscoredTerm)
            );
          });
        });
      };

      let locationPageText = "";
      let locationSectionCollections = { records: [], genealogies: [] };

      if (locationUrl) {
        const locationFetchUrl = toFamilySearchFetchUrl(locationUrl);

        if (locationFetchUrl) {
          const locationResponse = await fetch(locationFetchUrl, {
            headers: { Accept: "text/plain, text/html, */*" },
          });
          locationPageText = await locationResponse.text();
          locationSectionCollections = parseFamilySearchCollectionsFromLocationPage(locationPageText);

          if (locationSectionCollections.records.length > 0) {
            familySearchCollectionsCacheRef.current[cacheKey] = locationSectionCollections.records;
            persistFamilySearchCache();
            return locationSectionCollections.records;
          }

          if (locationSectionCollections.genealogies.length > 0) {
            genealogyFallbackCollections = locationSectionCollections.genealogies;
          }

          const genealogySeeAllUrl = parseGenealogySeeAllUrlFromLocationPage(locationPageText);
          if (genealogySeeAllUrl) {
            const seeAllGenealogyFallback = buildFamilySearchGenealogyFallback(countryName);
            seeAllGenealogyFallback[0].link = genealogySeeAllUrl;

            if (!genealogyFallbackCollections?.length) {
              genealogyFallbackCollections = seeAllGenealogyFallback;
            }
          }

          const constructedGenealogyFallback = buildFamilySearchGenealogyFallback(countryName);
          const constructedGenealogyUrl = constructedGenealogyFallback[0].link;
          const genealogySearchFetchUrl = toFamilySearchFetchUrl(constructedGenealogyUrl);

          if (genealogySearchFetchUrl) {
            try {
              const genealogySearchResponse = await fetch(genealogySearchFetchUrl, {
                headers: { Accept: "text/plain, text/html, */*" },
              });
              const genealogySearchText = await genealogySearchResponse.text();

              if (hasFamilySearchGenealogyResults(genealogySearchText)) {
                if (!genealogyFallbackCollections?.length) {
                  genealogyFallbackCollections = constructedGenealogyFallback;
                }
              }
            } catch (_) {
              // If genealogy verification is blocked upstream, still provide the direct genealogy search link.
              if (!genealogyFallbackCollections?.length) {
                genealogyFallbackCollections = constructedGenealogyFallback;
              }
            }
          }

          const canonicalAbsoluteUrl = parseCanonicalCollectionsUrlFromLocationPage(locationPageText);

          if (!url && canonicalAbsoluteUrl) {
            url = canonicalAbsoluteUrl;
          }
        }
      }

      if (url) {
        candidateUrls.push(url);
      }

      if (!url) {
        url = strictFallbackUrl || broadFallbackUrl;
      }

      if (strictFallbackUrl && !candidateUrls.includes(strictFallbackUrl)) {
        candidateUrls.push(strictFallbackUrl);
      }

      if (broadFallbackUrl && !candidateUrls.includes(broadFallbackUrl)) {
        candidateUrls.push(broadFallbackUrl);
      }

      if (!candidateUrls.length) {
        console.log("Collection URL:", null);
        console.log("Collections found:", 0);
        familySearchCollectionsCacheRef.current[cacheKey] = [];
        persistFamilySearchCache();
        return [];
      }

      for (const candidateUrl of candidateUrls) {
        console.log("Collection URL:", candidateUrl);

        const fetchUrl = toFamilySearchFetchUrl(candidateUrl) || candidateUrl;

        const response = await fetch(fetchUrl, {
          headers: { Accept: "text/plain, text/html, */*" },
        });
        const pageText = await response.text();
        let collections = parseFamilySearchCollections(pageText);

        if (!strictFallbackUrl && broadFallbackUrl && candidateUrl === broadFallbackUrl) {
          collections = filterCollectionsByCountryRelevance(collections);
        }

        console.log("Collections found:", collections.length);

        if (collections.length > 0) {
          familySearchCollectionUrlCacheRef.current[cacheKey] = candidateUrl;
          familySearchCollectionsCacheRef.current[cacheKey] = collections;
          persistFamilySearchCache();
          return collections;
        }
      }

      if (genealogyFallbackCollections?.length) {
        familySearchCollectionsCacheRef.current[cacheKey] = genealogyFallbackCollections;
        persistFamilySearchCache();
        return genealogyFallbackCollections;
      }

      delete familySearchCollectionsCacheRef.current[cacheKey];
      persistFamilySearchCache();
      return [];
      } catch (error) {
        console.error("Failed to fetch FamilySearch collections:", error);
        delete familySearchCollectionsCacheRef.current[cacheKey];
        return [];
      } finally {
        delete familySearchCollectionsInFlightRef.current[cacheKey];
      }
    })();

    familySearchCollectionsInFlightRef.current[cacheKey] = requestPromise;
    return requestPromise;
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
    track.addEventListener("scroll", updateGalleryAffordances, { passive: true });

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateGalleryAffordances);
      resizeObserver.observe(track);
    }

    window.addEventListener("resize", updateGalleryAffordances);

    return () => {
      track.removeEventListener("scroll", updateGalleryAffordances);
      window.removeEventListener("resize", updateGalleryAffordances);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
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
        exitIdleAttractMode();
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
      return;
    }

    let isActive = true;
    const cacheKey = normalizeName(selectedCountry.name);
    const hasCachedCollections = Object.prototype.hasOwnProperty.call(
      familySearchCollectionsCacheRef.current,
      cacheKey
    );

    if (hasCachedCollections) {
      const cachedCollections = familySearchCollectionsCacheRef.current[cacheKey];
      setFamilySearchCollections(cachedCollections || []);

      if (Array.isArray(cachedCollections) && cachedCollections.length === 0) {
        loadFamilySearchCollectionsForCountry(selectedCountry.name).then((collections) => {
          if (isActive && Array.isArray(collections) && collections.length > 0) {
            setFamilySearchCollections(collections);
          }
        });
      }

      return () => {
        isActive = false;
      };
    }

    setFamilySearchCollections([]);

    loadFamilySearchCollectionsForCountry(selectedCountry.name).then((collections) => {
      if (isActive) {
        setFamilySearchCollections(collections || []);
      }
    });

    return () => {
      isActive = false;
    };
  }, [selectedCountry?.name, isFamilySearchCacheReady]);

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
    ? getFamilySearchLocationUrl(selectedCountry.name)
    : null;
  const visibleFamilySearchCollections = familySearchCollections.filter(
    (collection) => !/no collections found/i.test(collection.title)
  );
  const {
    categoryLabel: familySearchCollectionsCategoryLabel,
    collections: visibleFamilySearchPreferredCollections,
    hasRecords: hasFamilySearchRecordCollections,
    hasGenealogies: hasFamilySearchGenealogyCollections,
  } = getFamilySearchCollectionsForFallback(visibleFamilySearchCollections);
  const isGenealogyCollectionsView = familySearchCollectionsCategoryLabel === "Genealogies Available";

  const voyagerProgressCount = visitedVoyagerCountries.length;
  const voyagerCountriesUntilSurprise = Math.max(5 - voyagerProgressCount, 0);
  const voyagerProgressPercent = Math.min((voyagerProgressCount / VOYAGER_TOTAL_COUNTRIES) * 100, 100);
  const voyagerProgressTitle = getVoyagerTitle(voyagerProgressCount);
  const displayedFamilySearchPreferredCollections = visibleFamilySearchPreferredCollections.slice(
    0,
    recordCollectionsDisplayLimit
  );
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
  ].filter((entry) => entry.value?.url);

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
      const overrideName = WIKIPEDIA_TITLE_OVERRIDES[countryName.toLowerCase()] || countryName;
      const searchTerms = [`${overrideName} landscape`, `${overrideName} skyline`, overrideName];

      for (const term of searchTerms) {
        const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&srnamespace=6&format=json&srlimit=6&srprop=size`;
        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok) {
          continue;
        }

        const searchData = await searchRes.json();
        const matches = (searchData.query?.search || []).filter((item) => {
          const title = item.title || "";
          return isCountrySpecificHeroUrl(title, countryName) && !HERO_IMAGE_NON_COUNTRY_TERMS.test(title.toLowerCase());
        });
        if (!matches.length) {
          continue;
        }

        const imageTitles = matches.slice(0, 4).map((item) => item.title);
        const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(imageTitles.join("|"))}&prop=imageinfo&iiprop=url|size&iiurlwidth=1600&format=json`;
        const imageInfoRes = await fetch(imageInfoUrl);
        if (!imageInfoRes.ok) {
          continue;
        }

        const imageInfoData = await imageInfoRes.json();
        const pages = imageInfoData.query?.pages || {};

        for (const pageId of Object.keys(pages)) {
          const page = pages[pageId];
          const imageInfo = page.imageinfo?.[0];
          const thumbUrl = imageInfo?.thumburl;

          if (!thumbUrl || !isCountrySpecificHeroUrl(page.title || thumbUrl, countryName)) {
            continue;
          }

          const valid = await testImageUrl(thumbUrl, 6000);
          if (valid) {
            return thumbUrl;
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

  // Voyager badge icons mapping
  const VOYAGER_BADGES = {
    5: { // Curious Explorer - Compass
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="28" fill="url(#compassGrad)" stroke="rgba(135,185,64,0.72)" strokeWidth="1.5"/>
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75"/>
          <path d="M32 8L34.5 27.5L32 32L29.5 27.5L32 8Z" fill="rgba(255,255,255,0.95)"/>
          <path d="M32 56L34.5 36.5L32 32L29.5 36.5L32 56Z" fill="rgba(255,255,255,0.5)"/>
          <path d="M8 32L27.5 29.5L32 32L27.5 34.5L8 32Z" fill="rgba(255,255,255,0.5)"/>
          <path d="M56 32L36.5 29.5L32 32L36.5 34.5L56 32Z" fill="rgba(255,255,255,0.5)"/>
          <circle cx="32" cy="32" r="3" fill="rgba(135,185,64,0.9)"/>
          <defs>
            <linearGradient id="compassGrad" x1="4" y1="4" x2="60" y2="60">
              <stop stopColor="#87b940"/>
              <stop offset="1" stopColor="#5f8f24"/>
            </linearGradient>
          </defs>
        </svg>
      )
    },
    10: { // Commonwealth Traveller - Ship Wheel
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="28" fill="url(#wheelGrad)" stroke="rgba(156,148,122,0.72)" strokeWidth="1.5"/>
          <circle cx="32" cy="32" r="6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
          <circle cx="32" cy="32" r="2" fill="rgba(255,255,255,0.8)"/>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const innerR = 10;
            const outerR = 24;
            const x1 = 32 + innerR * Math.sin(rad);
            const y1 = 32 - innerR * Math.cos(rad);
            const x2 = 32 + outerR * Math.sin(rad);
            const y2 = 32 - outerR * Math.cos(rad);
            return (
              <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
            );
          })}
          <defs>
            <linearGradient id="wheelGrad" x1="4" y1="4" x2="60" y2="60">
              <stop stopColor="#9c947a"/>
              <stop offset="1" stopColor="#6f6a58"/>
            </linearGradient>
          </defs>
        </svg>
      )
    },
    25: { // Global Navigator - Sextant
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="28" fill="url(#sextantGrad)" stroke="rgba(241,100,88,0.72)" strokeWidth="1.5"/>
          <path d="M32 12L33.5 32L32 52L30.5 32L32 12Z" fill="rgba(255,255,255,0.3)"/>
          <path d="M12 32L30.5 30.5L32 32L30.5 33.5L12 32Z" fill="rgba(255,255,255,0.3)"/>
          <path d="M52 32L33.5 30.5L32 32L33.5 33.5L52 32Z" fill="rgba(255,255,255,0.3)"/>
          <path d="M32 48C35.3137 48 38 45.3137 38 42C38 38.6863 35.3137 36 32 36C28.6863 36 26 38.6863 26 42C26 45.3137 28.6863 48 32 48Z" fill="rgba(255,255,255,0.6)"/>
          <circle cx="32" cy="32" r="2" fill="rgba(241,100,88,0.95)"/>
          <defs>
            <linearGradient id="sextantGrad" x1="4" y1="4" x2="60" y2="60">
              <stop stopColor="#f16458"/>
              <stop offset="1" stopColor="#c84f45"/>
            </linearGradient>
          </defs>
        </svg>
      )
    },
    40: { // World Voyager - Historic Map
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="28" fill="url(#mapGrad)" stroke="rgba(39,196,244,0.72)" strokeWidth="1.5"/>
          <rect x="16" y="16" width="32" height="32" rx="2" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
          <path d="M16 24H48" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75"/>
          <path d="M16 32H48" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75"/>
          <path d="M16 40H48" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75"/>
          <path d="M24 16V48" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75"/>
          <path d="M32 16V48" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75"/>
          <path d="M40 16V48" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75"/>
          <circle cx="24" cy="24" r="2" fill="rgba(39,196,244,0.92)"/>
          <circle cx="40" cy="32" r="2" fill="rgba(39,196,244,0.92)"/>
          <circle cx="32" cy="40" r="2" fill="rgba(39,196,244,0.92)"/>
          <path d="M20 44L24 40L28 44L32 40L36 44L40 40L44 44" stroke="rgba(255,255,255,0.3)" strokeWidth="0.75" fill="none"/>
          <defs>
            <linearGradient id="mapGrad" x1="4" y1="4" x2="60" y2="60">
              <stop stopColor="#27c4f4"/>
              <stop offset="1" stopColor="#198fb2"/>
            </linearGradient>
          </defs>
        </svg>
      )
    },
    56: { // Golden Commonwealth Explorer - Gold Compass Rose
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="28" fill="url(#goldGrad)" stroke="rgba(153,103,153,0.84)" strokeWidth="2"/>
          <circle cx="32" cy="32" r="24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.75"/>
          <circle cx="32" cy="32" r="18" fill="none" stroke="rgba(255,215,0,0.3)" strokeWidth="0.5"/>
          <path d="M32 6L35 29L32 32L29 29L32 6Z" fill="rgba(255,255,255,0.95)"/>
          <path d="M32 58L35 35L32 32L29 35L32 58Z" fill="rgba(153,103,153,0.72)"/>
          <path d="M6 32L29 29L32 32L29 35L6 32Z" fill="rgba(153,103,153,0.72)"/>
          <path d="M58 32L35 29L32 32L35 35L58 32Z" fill="rgba(153,103,153,0.72)"/>
          <text x="32" y="4" textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.8)" fontFamily="serif" fontWeight="bold">N</text>
          <text x="32" y="62" textAnchor="middle" fontSize="5" fill="rgba(255,215,0,0.8)" fontFamily="serif" fontWeight="bold">S</text>
          <text x="4" y="34" textAnchor="middle" fontSize="5" fill="rgba(255,215,0,0.8)" fontFamily="serif" fontWeight="bold">W</text>
          <text x="60" y="34" textAnchor="middle" fontSize="5" fill="rgba(255,215,0,0.8)" fontFamily="serif" fontWeight="bold">E</text>
          <circle cx="32" cy="32" r="2.5" fill="rgba(153,103,153,0.95)"/>
          <defs>
            <linearGradient id="goldGrad" x1="4" y1="4" x2="60" y2="60">
              <stop stopColor="#996799"/>
              <stop offset="0.5" stopColor="#b881b8"/>
              <stop offset="1" stopColor="#744b74"/>
            </linearGradient>
          </defs>
        </svg>
      )
    }
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
      25: { primary: "#F16458", glow: "rgba(241, 100, 88, 0.58)" },
      40: { primary: "#27C4F4", glow: "rgba(39, 196, 244, 0.58)" },
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
        borderRadius: "999px",
        border: `1px solid ${colors.primary}66`,
        background: `radial-gradient(circle at 35% 30%, ${colors.primary}26 0%, rgba(9, 14, 24, 0.2) 58%, rgba(9, 14, 24, 0.05) 100%)`,
        boxShadow: `0 0 0 1px ${colors.primary}26 inset, 0 0 16px ${colors.glow}`,
        filter: `drop-shadow(0 4px 12px ${colors.glow})`,
        animation: shouldBounce
          ? "badgeScale 700ms cubic-bezier(0.34, 1.56, 0.64, 1)"
          : isSmall
            ? "none"
            : "badgePulse 3s ease-in-out infinite",
        transform: isSmall ? "scale(1)" : "scale(1)",
        transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}>
        <div style={{
          width: "64px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 0,
          transform: isSmall ? "scale(0.5)" : "scale(1)",
          transformOrigin: "center center",
          transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
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
  const galleryVideoId = selectedCountry
    ? COUNTRY_GALLERY_VIDEO_ID_BY_NAME[selectedCountryNormalizedName] || DEFAULT_GALLERY_VIDEO_ID
    : null;
  const galleryItems = selectedCountry
    ? [
        {
          id: `${selectedCountry.name}-photo-main`,
          type: "photo",
          title: `${selectedCountry.name} Photo`,
          thumbnailUrl: validatedHeroImage || selectedCountryHeroImage,
          sourceUrl: validatedHeroImage || selectedCountryHeroImage,
        },
        {
          id: `${selectedCountry.name}-photo-flag`,
          type: "photo",
          title: `${selectedCountry.name} Flag`,
          thumbnailUrl: `https://flagcdn.com/w640/${selectedCountry.countryCode || "xx"}.png`,
          sourceUrl: `https://flagcdn.com/w1280/${selectedCountry.countryCode || "xx"}.png`,
        },
        {
          id: `${selectedCountry.name}-video`,
          type: "video",
          title: `${selectedCountry.name} Video`,
          thumbnailUrl: `https://img.youtube.com/vi/${galleryVideoId}/hqdefault.jpg`,
          sourceUrl: `https://www.youtube.com/watch?v=${galleryVideoId}`,
          videoId: galleryVideoId,
        },
      ]
    : [];
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
      setHoveredCountry((current) => (current && !selectedCountry ? null : current));
    };
  }, [isAttractMode, selectedCountry]);

  // When panel closes, if no country is selected, restore Explore button.
  useEffect(() => {
    if (!selectedCountry && !isPanelOpen && !isPanelVisible) {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
    }
  }, [selectedCountry, isPanelOpen, isPanelVisible]);

  return (
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
        onPointerDown={() => {
          if (isAttractMode) {
            beginExploration();
          }
        }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 800,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: isAttractMode ? "auto" : "none",
          opacity: isAttractMode ? 1 : 0,
          transition: "opacity 800ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 26%, rgba(255,255,255,0) 62%)",
            pointerEvents: "none",
          }}
        />
        {/* Subtle atmospheric overlays to preserve map as hero */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(125% 92% at 50% 44%, rgba(5, 10, 18, 0.1) 0%, rgba(5, 10, 18, 0.34) 60%, rgba(5, 10, 18, 0.56) 100%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(62% 44% at 50% 43%, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.14) 38%, rgba(0, 0, 0, 0) 100%)",
            pointerEvents: "none",
          }}
        />
        
        {/* Headline and invitation */}
        <div
          style={{
            position: "relative",
            textAlign: "center",
            color: "#fff",
            maxWidth: "1120px",
            padding: "0 2.25rem",
            display: "grid",
            gap: "1.3rem",
            animation: isAttractMode ? "attractHeroFloat 6s ease-in-out infinite" : "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "-30px -42px -34px",
              background: "radial-gradient(70% 56% at 50% 44%, rgba(0,0,0,0.54) 0%, rgba(0,0,0,0.24) 40%, rgba(0,0,0,0) 100%)",
              filter: "blur(10px)",
              pointerEvents: "none",
              zIndex: 0,
              borderRadius: "30px",
            }}
          />
          <h1
            style={{
              position: "relative",
              zIndex: 1,
              fontFamily: "'Museo Slab', 'Roboto Slab', Rockwell, serif",
              fontSize: "clamp(3.1rem, 8.2vw, 8rem)",
              fontWeight: 520,
              letterSpacing: "0.02em",
              lineHeight: 0.95,
              textTransform: "lowercase",
              margin: 0,
              color: "#f5f9ff",
              textShadow: "0 16px 34px rgba(3, 6, 14, 0.78), 0 5px 16px rgba(3, 6, 14, 0.62), 0 0 22px rgba(147, 204, 255, 0.18)",
              opacity: isAttractMode ? 1 : 0,
              transform: isAttractMode ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 1300ms cubic-bezier(0.22, 1, 0.36, 1) 220ms, transform 1300ms cubic-bezier(0.22, 1, 0.36, 1) 220ms",
            }}
          >
            <div
              style={{
                position: "relative",
                zIndex: 1,
                fontSize: "clamp(2.2rem, 5.2vw, 5rem)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(244, 251, 255, 0.92)",
                marginBottom: "0.22rem",
                textShadow: "0 2px 10px rgba(5, 8, 16, 0.46)",
                opacity: isAttractMode ? 1 : 0,
                transform: isAttractMode ? "translateY(0)" : "translateY(10px)",
                transition: "opacity 1400ms cubic-bezier(0.22, 1, 0.36, 1) 100ms, transform 1400ms cubic-bezier(0.22, 1, 0.36, 1) 100ms",
              }}
            >
              One Commonwealth
            </div>
            <div
              style={{
                position: "relative",
                zIndex: 1,
                fontSize: "clamp(1.5rem, 3.8vw, 3.3rem)",
                letterSpacing: "0.11em",
                textTransform: "uppercase",
                color: "rgba(235, 246, 255, 0.82)",
                marginBottom: "0.78rem",
                textShadow: "0 2px 10px rgba(5, 8, 16, 0.46)",
                opacity: isAttractMode ? 1 : 0,
                transform: isAttractMode ? "translateY(0)" : "translateY(10px)",
                transition: "opacity 1500ms cubic-bezier(0.22, 1, 0.36, 1) 240ms, transform 1500ms cubic-bezier(0.22, 1, 0.36, 1) 240ms",
              }}
            >
              Many Families
            </div>
          </h1>
          <p
            style={{
              position: "relative",
              zIndex: 1,
              margin: 0,
              fontFamily: "'Museo Slab', 'Roboto Slab', Rockwell, serif",
              fontSize: "clamp(1rem, 1.9vw, 1.55rem)",
              color: "rgba(238, 248, 255, 0.74)",
              letterSpacing: "0.02em",
              lineHeight: 1.25,
              textShadow: "0 2px 10px rgba(5, 8, 16, 0.48)",
              opacity: isAttractMode ? 1 : 0,
              transform: isAttractMode ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 1700ms cubic-bezier(0.22, 1, 0.36, 1) 560ms, transform 1700ms cubic-bezier(0.22, 1, 0.36, 1) 560ms",
            }}
          >
            Discover the stories that connect us.
          </p>
        </div>

      </div>

      {(() => {
        const shouldShowExploreButton = !isMenuOpen && !isMenuOpening && !isMenuClosing;
        const isExploreButtonVisible = shouldShowExploreButton && !isButtonTransitioning;
        const hiddenExploreTransform = isAttractMode
          ? "translateY(16px) scale(0.97)"
          : "translateY(14px) scale(0.97)";
        const baseExploreTransform = isExploreButtonVisible
          ? "translateY(0) scale(1)"
          : hiddenExploreTransform;
        const exploreButtonLabel = isAttractMode ? "Touch to Begin" : "Explore by Country";

        return (
          <button
            className={`explore-cta-button ${isExploreButtonVisible ? "explore-cta-visible" : "explore-cta-hidden"}${isAttractMode ? " explore-cta-button-attract" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              handleExploreCommonwealthPress();
            }}
            style={{
              position: "fixed",
              left: "50%",
              top: isAttractMode ? "72%" : "auto",
              bottom: isAttractMode ? "auto" : "1.2rem",
              transform: `translateX(-50%) ${baseExploreTransform}`,
              zIndex: 910,
              padding: isAttractMode ? "1rem 2rem" : "0.9rem 1.7rem",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.3)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.26) 100%)",
              backdropFilter: "blur(28px) saturate(200%)",
              WebkitBackdropFilter: "blur(28px) saturate(200%)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.35)",
              color: "rgba(248,250,252,0.95)",
              fontSize: isAttractMode ? "clamp(1rem, 2vw, 1.28rem)" : "clamp(0.95rem, 1.7vw, 1.16rem)",
              fontWeight: isAttractMode ? 610 : 600,
              letterSpacing: isAttractMode ? "0.2em" : "0.12em",
              textTransform: "sentence-case",
              lineHeight: 1,
              overflow: "hidden",
              isolation: "isolate",
              cursor: isExploreButtonVisible ? "pointer" : "default",
              textShadow: "0 1px 2px rgba(0,0,0,0.35)",
              opacity: isExploreButtonVisible ? 1 : 0,
              pointerEvents: isExploreButtonVisible ? "auto" : "none",
              transition: `opacity ${EXHIBIT_TRANSITION_MS}ms ${EXHIBIT_TRANSITION_EASE}, transform ${EXHIBIT_TRANSITION_MS}ms ${EXHIBIT_TRANSITION_EASE}, background 220ms ease, box-shadow 220ms ease, filter ${EXHIBIT_TRANSITION_MS}ms ${EXHIBIT_TRANSITION_EASE}`,
              filter: isExploreButtonVisible ? "blur(0px)" : "blur(0.8px)",
            }}
            onMouseEnter={(event) => {
              if (!isExploreButtonVisible) {
                return;
              }
              event.currentTarget.style.transform = "translateX(-50%) translateY(-2px) scale(1.01)";
              event.currentTarget.style.background = "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.3) 100%)";
              event.currentTarget.style.boxShadow = "0 22px 44px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.42)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = `translateX(-50%) ${baseExploreTransform}`;
              event.currentTarget.style.background = "linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.26) 100%)";
              event.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.35)";
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "999px",
                background: "radial-gradient(circle at 45% 35%, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0.08) 58%, rgba(0,0,0,0.01) 100%)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
            <span className="explore-cta-sheen" aria-hidden="true" />
            <span style={{ position: "relative", zIndex: 2, display: "inline-flex", alignItems: "center", gap: "0.52rem" }}>
              {renderGlobeIcon(isAttractMode ? 18 : 16)}
              <span>{exploreButtonLabel}</span>
            </span>
          </button>
        );
      })()}

      {/* TOP BAR - Always visible */}
      <div
        style={{
          position: "fixed",
          top: "1.2rem",
          left: "1.2rem",
          zIndex: 920,
          display: "flex",
          alignItems: "center",
          padding: 0,
          pointerEvents: "none",
          opacity: 1,
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
              width: "128px",
              height: "auto",
              filter: "brightness(0) invert(1)",
              opacity: 0.96,
              transition: `opacity 520ms ${DOCK_GENTLE_EASE}`,
            }}
          />
        </div>
      </div>

      {/* VOYAGER PROGRESS - Top right corner */}
      {!isAttractMode ? (
      <div
        onClick={() => setIsVoyagerExpanded((value) => !value)}
        style={{
          position: "fixed",
          top: "1.5rem",
          right: "1.5rem",
          zIndex: 820,
          width: isVoyagerExpanded ? "min(320px, calc(100vw - 3rem))" : "auto",
          padding: isVoyagerExpanded ? "1rem 1.1rem 0.9rem" : "0.58rem 0.95rem",
          borderRadius: isVoyagerExpanded ? "22px" : "999px",
          border: "1px solid rgba(255,255,255,0.52)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.68) 0%, rgba(255,255,255,0.5) 100%)",
          backdropFilter: "blur(28px) saturate(200%)",
          WebkitBackdropFilter: "blur(28px) saturate(200%)",
          boxShadow: "0 14px 30px rgba(15,23,42,0.2), inset 0 1px 0 rgba(255,255,255,0.65)",
          color: "rgba(15,23,42,0.94)",
          pointerEvents: "auto",
          overflow: "hidden",
          isolation: "isolate",
          cursor: "pointer",
          transition: "all 500ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
          {/* Subtle dark internal underlay for readability over bright backgrounds */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at 40% 30%, rgba(255,255,255,0.44) 0%, rgba(255,255,255,0.14) 58%, rgba(255,255,255,0.04) 100%)",
              borderRadius: "22px",
              pointerEvents: "none",
            }}
          />
          
          {isVoyagerExpanded ? (
            <>
              {/* Badge Icon */}
              <div style={{ 
                position: "relative", 
                zIndex: 1, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                marginBottom: "0.6rem"
              }}>
                <div
                  key={`voyager-badge-expanded-${voyagerBadgeAnimToken}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  {renderVoyagerBadge(voyagerProgressCount, "full", true)}
                </div>
              </div>
              
              {/* Title */}
              <div style={{ 
                position: "relative", 
                zIndex: 1, 
                fontSize: "0.68rem", 
                letterSpacing: "0.22em", 
                textTransform: "uppercase", 
                color: "rgba(15,23,42,0.82)", 
                fontWeight: 700, 
                textAlign: "center",
                textShadow: "none" 
              }}>
                {voyagerProgressCount >= 5 ? voyagerProgressTitle : "Commonwealth Explorer"}
              </div>
              
              {/* Progress Count */}
              <div style={{ 
                marginTop: "0.5rem", 
                textAlign: "center",
                position: "relative", 
                zIndex: 1,
                fontSize: "1.1rem", 
                fontWeight: 650, 
                letterSpacing: "-0.02em",
                color: "rgba(15,23,42,0.92)",
                textShadow: "none" 
              }}>
                {voyagerProgressCount} / {VOYAGER_TOTAL_COUNTRIES}
              </div>
              
              {/* Milestone Progress Bar */}
              <div style={{ 
                marginTop: "0.75rem",
                position: "relative",
                zIndex: 1 
              }}>
                {/* Progress track */}
                <div style={{
                  height: "3px",
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "2px",
                  position: "relative",
                  overflow: "hidden"
                }}>
                  {/* Progress fill */}
                  <div style={{
                    height: "100%",
                    width: `${voyagerProgressPercent}%`,
                    background: `linear-gradient(90deg, ${getVoyagerBrandColor(voyagerProgressCount)} 0%, ${getVoyagerBrandColor(voyagerProgressCount)} 100%)`,
                    borderRadius: "2px",
                    transition: "width 600ms cubic-bezier(0.22, 1, 0.36, 1)",
                    boxShadow: `0 0 8px ${getVoyagerBrandColor(voyagerProgressCount)}66`
                  }} />
                </div>
                
                {/* Milestone markers */}
                <div style={{ 
                  position: "relative",
                  marginTop: "0.4rem",
                  height: "18px",
                }}>
                  {[
                    { count: 5, label: "5" },
                    { count: 10, label: "10" },
                    { count: 25, label: "25" },
                    { count: 40, label: "40" },
                    { count: 56, label: "56" }
                  ].map((milestone) => {
                    const isReached = voyagerProgressCount >= milestone.count;
                    
                    return (
                      <div
                        key={milestone.count}
                        style={{
                          position: "absolute",
                          left: `calc(${(milestone.count / VOYAGER_TOTAL_COUNTRIES) * 100}% - 3px)`,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "0.2rem",
                          opacity: isReached ? 1 : 0.5,
                          transition: "opacity 400ms ease"
                        }}
                      >
                        <div style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: isReached ? getVoyagerBrandColor(milestone.count) : "rgba(255,255,255,0.4)",
                          boxShadow: isReached ? `0 0 6px ${getVoyagerBrandColor(milestone.count)}99` : "none",
                          transition: "all 400ms ease"
                        }} />
                        <div style={{
                          fontSize: "0.55rem",
                          color: isReached ? "rgba(51,51,49,0.9)" : "rgba(51,51,49,0.62)",
                          fontWeight: isReached ? 700 : 500,
                          letterSpacing: "0.05em",
                          transition: "all 400ms ease"
                        }}>
                          {milestone.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Minimal View */
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              position: "relative",
              zIndex: 1,
            }}>
              {voyagerProgressCount >= 5 ? (
                <>
                  <div
                    key={`voyager-badge-minimal-${voyagerBadgeAnimToken}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >
                    {renderVoyagerBadge(voyagerProgressCount, "small", true)}
                  </div>
                  <div style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    color: "rgba(15,23,42,0.84)",
                    textShadow: "none",
                    whiteSpace: "nowrap",
                  }}>
                    {voyagerProgressTitle}
                  </div>
                  <div style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    color: "rgba(15,23,42,0.92)",
                    textShadow: "none",
                    whiteSpace: "nowrap",
                    marginLeft: "0.18rem",
                  }}>
                    {voyagerProgressCount}/{VOYAGER_TOTAL_COUNTRIES}
                  </div>
                </>
              ) : (
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                  color: "rgba(15,23,42,0.9)",
                  textShadow: "none",
                  whiteSpace: "nowrap",
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center" }}>{renderGiftIcon(14)}</span>
                  <span>{voyagerCountriesUntilSurprise} {voyagerCountriesUntilSurprise === 1 ? "country" : "countries"} for surprise!</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}


      {isMenuOpen && (
        <div
          onMouseLeave={() => {
            markDockInteraction();
          }}
          onPointerDown={markDockInteraction}
          style={{
            position: "absolute",
            bottom: "1.1rem",
            left: "50%",
            transform: isDockTransitioning
              ? "translateX(-50%) translateY(18px) scale(0.995)"
              : "translateX(-50%) translateY(0) scale(1)",
            width: "min(1360px, 98vw)",
            zIndex: 900,
            padding: "0.9rem 1.1rem 1rem",
            background: "linear-gradient(180deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.11) 26%, rgba(16,22,35,0.78) 100%)",
            backdropFilter: "blur(32px) saturate(195%)",
            WebkitBackdropFilter: "blur(32px) saturate(195%)",
            border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: "30px",
            boxShadow: "0 20px 44px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.32)",
            opacity: isDockTransitioning ? 0 : 1,
            transition: `opacity ${EXHIBIT_TRANSITION_MS}ms ${EXHIBIT_TRANSITION_EASE}, transform ${EXHIBIT_TRANSITION_MS}ms ${EXHIBIT_TRANSITION_EASE}`,
          }}
        >
          <div
            style={{
              maxWidth: "760px",
              margin: isDockSearchExpanded ? "0 auto 0.85rem" : "0 auto 0",
              position: "relative",
              opacity: isDockSearchExpanded ? 1 : 0,
              maxHeight: isDockSearchExpanded ? "68px" : "0px",
              transform: isDockSearchExpanded ? "translateY(0) scale(1)" : "translateY(-10px) scale(0.985)",
              overflow: "hidden",
              pointerEvents: isDockSearchExpanded ? "auto" : "none",
              transition: `opacity 420ms ${DOCK_SOFT_EASE}, transform 520ms ${DOCK_GENTLE_EASE}, max-height 520ms ${DOCK_GENTLE_EASE}, margin 520ms ${DOCK_GENTLE_EASE}`,
            }}
          >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "absolute",
                  left: "1.25rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.5)",
                  pointerEvents: "none",
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  markDockInteraction();
                }}
                onFocus={markDockInteraction}
                onKeyDown={markDockInteraction}
                placeholder="Search countries..."
                style={{
                  width: "100%",
                  border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: "100px",
                  padding: "1rem 1.25rem 1rem 3.5rem",
                  fontSize: "1.1rem",
                  color: "#fff",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.12) 100%)",
                  outline: "none",
                  boxSizing: "border-box",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.24), 0 6px 18px rgba(0,0,0,0.18)",
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                  transition: "background 200ms ease",
                }}
                onFocusCapture={(e) => {
                  e.target.style.background = "linear-gradient(180deg, rgba(255,255,255,0.31) 0%, rgba(255,255,255,0.16) 100%)";
                }}
                onBlur={(e) => {
                  e.target.style.background = "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.12) 100%)";
                }}
              />
              {searchTerm ? (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    markDockInteraction();
                  }}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    fontSize: "1rem",
                    cursor: "pointer",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                    padding: 0,
                  }}
                  aria-label="Clear search"
                >
                  ×
                </button>
              ) : null}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                flexShrink: 0,
                paddingLeft: "0.2rem",
                opacity: isDockTransitioning ? 0 : 1,
                transform: isDockTransitioning
                  ? "translateX(-10px) translateY(8px)"
                  : "translateX(0) translateY(0)",
                transition: `opacity 420ms ${DOCK_SOFT_EASE}, transform 560ms ${DOCK_GENTLE_EASE}`,
              }}
            >
              <button
                onClick={() => {
                  markDockInteraction();
                  setIsDockSearchExpanded((value) => {
                    const next = !value;
                    if (!next) {
                      setSearchTerm("");
                    }
                    return next;
                  });
                }}
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.22)",
                  background: isDockSearchExpanded
                    ? "linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.16) 100%)"
                    : "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.24)",
                  transform: isDockSearchExpanded ? "translateY(0) scale(1.03)" : "translateY(0) scale(1)",
                  transition: `background 360ms ${DOCK_GENTLE_EASE}, transform 480ms ${DOCK_GENTLE_EASE}, box-shadow 360ms ${DOCK_GENTLE_EASE}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(180deg, rgba(255,255,255,0.44) 0%, rgba(255,255,255,0.18) 100%)";
                  e.currentTarget.style.transform = isDockSearchExpanded ? "translateY(-1px) scale(1.03)" : "translateY(-1px) scale(1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDockSearchExpanded
                    ? "linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.16) 100%)"
                    : "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)";
                  e.currentTarget.style.transform = isDockSearchExpanded ? "translateY(0) scale(1.03)" : "translateY(0) scale(1)";
                }}
                aria-label={isDockSearchExpanded ? "Hide search" : "Show search"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
            </div>

            <div
              aria-hidden="true"
              style={{
                width: "1px",
                height: "46px",
                alignSelf: "center",
                background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.34) 20%, rgba(255,255,255,0.34) 80%, rgba(255,255,255,0.06) 100%)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
                opacity: isDockTransitioning ? 0 : 0.9,
                transition: `opacity 420ms ${DOCK_SOFT_EASE}`,
                flexShrink: 0,
              }}
            />

            {/* Country cards horizontal scroll */}
            <div
              style={{
                flex: 1,
                display: "flex",
                gap: "0.72rem",
                overflowX: "auto",
                padding: "0.4rem 0.25rem 0.2rem",
                scrollSnapType: "x mandatory",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
            {filteredCountries.map((country) => {
              const isActive = selectedCountry?.name === country.name;
              return (
                <button
                  key={country.name}
                  onClick={() => {
                    markDockInteraction();
                    handleSelectCountry(country);
                    setIsDockSearchExpanded(false);
                    setSearchTerm("");
                  }}
                  onPointerEnter={() => {
                    markDockInteraction();
                    handleCountryHover(country.name);
                  }}
                  onPointerLeave={() => {
                    handleCountryHover(null);
                  }}
                  onPointerCancel={() => {
                    handleCountryHover(null);
                  }}
                  onPointerDown={() => {
                    markDockInteraction();
                    handleCountryHover(country.name);
                  }}
                  style={{
                    flex: "0 0 auto",
                    width: "124px",
                    minHeight: "68px",
                    padding: "0.4rem 0.62rem 0.28rem",
                    borderRadius: "16px",
                    background: isActive
                      ? "linear-gradient(180deg, rgba(222, 248, 170, 0.4) 0%, rgba(255,255,255,0.26) 36%, rgba(186, 230, 96, 0.26) 100%)"
                      : "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.16) 100%)",
                    border: isActive ? "1px solid rgba(214, 255, 163, 0.9)" : "1px solid rgba(255,255,255,0.34)",
                    boxShadow: isActive
                      ? "0 10px 20px rgba(68, 95, 33, 0.24), inset 0 1px 0 rgba(255,255,255,0.56), inset 0 -8px 18px rgba(190, 242, 100, 0.18)"
                      : "0 10px 20px rgba(15,23,42,0.2), inset 0 1px 0 rgba(255,255,255,0.46), inset 0 -8px 18px rgba(147, 197, 253, 0.12)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.1rem",
                    scrollSnapAlign: "start",
                    transform: isActive ? "translateY(-2px) scale(1.02)" : "translateY(0) scale(1)",
                    transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 280ms cubic-bezier(0.22, 1, 0.36, 1), background 280ms cubic-bezier(0.22, 1, 0.36, 1), border 280ms cubic-bezier(0.22, 1, 0.36, 1)",
                    willChange: "transform",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = "translateY(-3px) scale(1.03)";
                      e.currentTarget.style.boxShadow = "0 14px 28px rgba(15,23,42,0.28), inset 0 1px 0 rgba(255,255,255,0.56), inset 0 -8px 18px rgba(147, 197, 253, 0.18)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow = "0 10px 20px rgba(15,23,42,0.2), inset 0 1px 0 rgba(255,255,255,0.46), inset 0 -8px 18px rgba(147, 197, 253, 0.12)";
                    }
                  }}
                >
                  <img
                    src={`https://flagcdn.com/w80/${country.countryCode || "xx"}.png`}
                    alt=""
                    style={{
                      width: "42px",
                      height: "26px",
                      borderRadius: "5px",
                      objectFit: "cover",
                      border: "1px solid rgba(255,255,255,0.55)",
                      boxShadow: "0 2px 8px rgba(15,23,42,0.24)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.79rem",
                      fontWeight: 620,
                      color: "#f8fafc",
                      textAlign: "center",
                      lineHeight: 1.02,
                      letterSpacing: "0.005em",
                      textShadow: "0 1px 0 rgba(2,6,23,0.65)",
                    }}
                  >
                    {country.name}
                  </span>
                </button>
              );
            })}
            </div>

            <div
              aria-hidden="true"
              style={{
                width: "1px",
                height: "46px",
                alignSelf: "center",
                background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.34) 20%, rgba(255,255,255,0.34) 80%, rgba(255,255,255,0.06) 100%)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
                opacity: isDockTransitioning ? 0 : 0.9,
                transition: `opacity 420ms ${DOCK_SOFT_EASE}`,
                flexShrink: 0,
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                flexShrink: 0,
                paddingRight: "0.2rem",
                opacity: isDockTransitioning ? 0 : 1,
                transform: isDockTransitioning
                  ? "translateX(6px) translateY(6px)"
                  : "translateX(0) translateY(0)",
                transition: `opacity 380ms cubic-bezier(0.4, 0, 0.2, 1), transform 380ms cubic-bezier(0.4, 0, 0.2, 1)`,
              }}
            >
              <button
                onClick={() => {
                  handleCountryHover(null);
                  setIsDockSearchExpanded(false);
                  setSearchTerm("");
                  setIsMenuClosing(true);
                  clearDockSearchTimer();
                  setTimeout(() => {
                    setIsMenuOpen(false);
                    setIsMenuClosing(false);
                  }, 420);
                }}
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.22)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)",
                  color: "#fff",
                  fontSize: "1.45rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.24)",
                  transform: "translateY(0)",
                  transition: `background 360ms ${DOCK_GENTLE_EASE}, transform 480ms ${DOCK_GENTLE_EASE}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.16) 100%)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(156, 148, 122, 0.08)",
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
              background: "rgba(156, 148, 122, 0.3)",
              mixBlendMode: "multiply",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
          <MapContainer
            center={COMMONWEALTH_VIEW.center}
            zoom={COMMONWEALTH_VIEW.zoom}
            minZoom={COMMONWEALTH_MIN_ZOOM}
            maxZoom={12}
            worldCopyJump={false}
            zoomControl={false}
            scrollWheelZoom={false}
            touchZoom={false}
            doubleClickZoom={false}
            dragging={true}
            style={{ height: "100%", width: "100%", position: "relative", zIndex: 2, background: "rgba(156, 148, 122, 0)" }}
          >
        <MapArtOverlay imageUrl={MAP_BACKGROUND_ART_URL} opacity={0.28} />
        <MapBounds />
        <VintageMapDecorations />
        <WorldGeoLayer
          onSelectCountry={handleSelectCountry}
          onBackgroundClick={handleReset}
          mapRef={mapRef}
          selectedCountry={selectedCountry}
          activatedCountryName={activatedCountryName}
          isPanelOpen={isPanelOpen}
          isAttractMode={isAttractMode}
          hoveredCountry={hoveredCountry}
          onCountryHover={handleCountryHover}
          countryLayerRefs={countryLayerRefs}
          onGeojsonLoad={handleGeojsonLoad}
          onGeojsonError={handleGeojsonError}
        />
        <SmallCountryMarkers
          geojson={geojson}
          onSelectCountry={handleSelectCountry}
          selectedCountry={selectedCountry}
          hoveredCountry={hoveredCountry}
          activatedCountryName={activatedCountryName}
          isPanelOpen={isPanelOpen}
          isAttractMode={isAttractMode}
          onCountryHover={handleCountryHover}
        />
        {isAttractMode
          ? attractRouteSwooshes.map((route) => (
              <AttractSeaRouteSwoosh key={route.id} route={route} />
            ))
          : null}
        {isAttractMode && attractHeroRoute ? (
          <AttractSeaRouteSwoosh key={attractHeroRoute.id} route={attractHeroRoute} />
        ) : null}
        </MapContainer>

        {!geojson ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 4,
            }}
          >
            <div
              style={{
                padding: "0.7rem 1rem",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.32)",
                background: "rgba(15,23,42,0.62)",
                color: "rgba(248,250,252,0.95)",
                fontSize: "0.82rem",
                letterSpacing: "0.03em",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              {mapLoadError || "Loading map data..."}
            </div>
          </div>
        ) : null}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.12)",
            backdropFilter: isOverlayVisible ? "blur(4px)" : "blur(0px)",
            pointerEvents: "none",
            zIndex: 3,
            opacity: isOverlayVisible ? 1 : 0,
            transition: "opacity 300ms cubic-bezier(0.22, 1, 0.36, 1), backdrop-filter 300ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>

      {/* FLOATING STORY CARD - Replaces side panel */}
      <div
        className="floating-story-card-scroll"
        onClick={(event) => event.stopPropagation()}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: isPanelVisible
            ? "translate(-50%, -50%)"
            : "translate(-50%, calc(-50% + 90px))",
          width: "min(900px, 92vw)",
          maxHeight: "75vh",
          background: "linear-gradient(155deg, rgba(15, 23, 42, 0.86) 0%, rgba(2, 6, 23, 0.8) 52%, rgba(15, 23, 42, 0.74) 100%)",
          boxShadow: "0 42px 120px rgba(0, 0, 0, 0.54), 0 16px 34px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(20px) saturate(140%)",
          WebkitBackdropFilter: "blur(20px) saturate(140%)",
          borderRadius: "32px",
          opacity: isPanelVisible ? 1 : 0,
          transition: "opacity 500ms cubic-bezier(0.22, 1, 0.36, 1), transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
          pointerEvents: isPanelVisible ? "auto" : "none",
          overflowY: "auto",
          overflowX: "hidden",
          zIndex: 1000,
          color: "#fff",
          border: "1px solid rgba(203, 213, 225, 0.44)",
        }}
      >
        {selectedCountry ? (
          <div
            style={{
              padding: "0",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            {/* Close button */}
            <button
              onClick={handleClosePanel}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                border: "1px solid rgba(148, 163, 184, 0.42)",
                background: "rgba(15, 23, 42, 0.92)",
                color: "#fff",
                fontSize: "1.5rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 200ms ease",
                zIndex: 10,
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
            <div
              key={`hero-${selectedCountry.name}-${heroMotionSeed}`}
              style={{
                borderRadius: "32px 32px 0 0",
                overflow: "hidden",
                minHeight: "220px",
                backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0.15) 40%, rgba(15,23,42,0.65) 100%), url(${validatedHeroImage || selectedCountryHeroImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center 30%",
                display: "flex",
                alignItems: "flex-end",
                padding: `1.4rem ${STORY_CARD_SIDE_PADDING}`,
                position: "relative",
                ...getRevealStyle(0),
              }}
            >
              <div style={{ position: "relative", zIndex: 2 }}>
                <img
                  src={`https://flagcdn.com/w40/${selectedCountry.countryCode || "xx"}.png`}
                  alt=""
                  style={{
                    width: "26px",
                    height: "17px",
                    borderRadius: "4px",
                    objectFit: "cover",
                    border: "1px solid rgba(255,255,255,0.4)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                    opacity: 0.92,
                  }}
                />
                <h2
                  style={{
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
                  }}
                >
                  {selectedCountry.name}
                </h2>
              </div>
              {selectedCountryMetadata?.memberSince ? (
                <div
                  style={{
                    position: "absolute",
                    right: "15%",
                    top: "42%",
                    width: "160px",
                    transform: "translateY(-50%) rotate(-8deg)",
                    zIndex: 4,
                    opacity: isContentVisible ? 1 : 0,
                    transition: `opacity 520ms ${springEase}, transform 520ms ${springEase}`,
                    transitionDelay: isContentVisible ? "180ms" : "0ms",
                  }}
                >
                  {renderCommonwealthStamp(String(selectedCountryMetadata.memberSince))}
                </div>
              ) : null}
              {selectedCountry.imageSource && selectedCountry.imageSource !== "none" && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "linear-gradient(transparent, rgba(0,0,0,0.4))",
                    padding: `1.5rem ${STORY_CARD_SIDE_PADDING} 0.5rem`,
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "flex-end",
                    opacity: isContentVisible ? 1 : 0,
                    transition: `opacity 400ms ${springEase}`,
                    transitionDelay: isContentVisible ? "200ms" : "0ms",
                    pointerEvents: "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: "rgba(255, 255, 255, 0.75)",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      fontWeight: 500,
                    }}
                  >
                    Image by {selectedCountry.imageSource === "wikipedia" ? "Wikipedia" : 
                             selectedCountry.imageSource === "wikimedia-commons" ? "Wikimedia" :
                             selectedCountry.imageSource === "unsplash" ? "Unsplash" :
                             selectedCountry.imageSource === "pexels" ? "Pexels" :
                             selectedCountry.imageSource === "pixabay" ? "Pixabay" :
                             selectedCountry.imageSource}
                  </span>
                </div>
              )}
            </div>

            {/* FamilySearch Collections and Research Helps */}
            <div style={{ padding: `1.5rem ${STORY_CARD_SIDE_PADDING} 1.4rem` }}>
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
                  {displayedFamilySearchPreferredCollections.length ? (
                    <>
                      <div style={{ color: SUBTLE_DARK_CARD_TEXT_COLOR, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginTop: "0.12rem" }}>
                        {isGenealogyCollectionsView ? "FamilySearch Genealogies" : "FamilySearch Records"}
                      </div>
                      {displayedFamilySearchPreferredCollections.map((collection, index) => (
                        <a
                          key={`${isGenealogyCollectionsView ? "FamilySearch Genealogies" : "FamilySearch Records"}-${collection.title}-${collection.link}`}
                          href={collection.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={familySearchRecordLinkStyle}
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
                        </a>
                      ))}
                    </>
                  ) : null}

                  {!hasFamilySearchRecordCollections && !hasFamilySearchGenealogyCollections ? (
                    <div style={{ color: SUBTLE_DARK_CARD_TEXT_COLOR, fontSize: "0.95rem", textAlign: "left" }}>No FamilySearch collections available.</div>
                  ) : null}
                </div>
                {familySearchLocationUrl ? (
                  <a
                    href={familySearchLocationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginTop: "0.72rem",
                      ...seeMoreLikeLinkStyle,
                    }}
                    onMouseEnter={handleSeeMoreLikeLinkMouseEnter}
                    onMouseLeave={handleSeeMoreLikeLinkMouseLeave}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                      {renderLinkArrowIcon()}
                      <span>See more</span>
                    </span>
                  </a>
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
                      <a
                        key={`${entry.key}-${entry.value.url}`}
                        href={entry.value.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={researchHelpLinkStyle}
                        onMouseEnter={handleResearchHelpMouseEnter}
                        onMouseLeave={handleResearchHelpMouseLeave}
                        title={entry.value.title || entry.label}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", minWidth: 0, maxWidth: "100%" }}>
                          {renderLinkArrowIcon()}
                          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{entry.label}</span>
                        </span>
                      </a>
                    ))
                  ) : (
                    <div style={{ color: SUBTLE_DARK_CARD_TEXT_COLOR, fontSize: "0.95rem", textAlign: "left" }}>No research help links available.</div>
                  )}
                </div>
              </div>
            </div>
            </div>

            {/* Gallery before reading content */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
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
                      borderRadius: "14px",
                      overflow: "hidden",
                      cursor: "pointer",
                      position: "relative",
                      flex: "0 0 76%",
                      minWidth: "0",
                      height: "182px",
                      transform: "translateY(0)",
                      transition: "transform 240ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease, filter 240ms ease",
                      boxShadow: index === galleryActiveIndex
                        ? "0 18px 38px rgba(15,23,42,0.38), inset 0 0 0 1px rgba(255,255,255,0.22)"
                        : "0 8px 18px rgba(15,23,42,0.2), inset 0 0 0 1px rgba(255,255,255,0.1)",
                      scrollSnapAlign: "center",
                      opacity: index === galleryActiveIndex ? 1 : 0.72,
                      filter: index === galleryActiveIndex ? "saturate(1.08)" : "saturate(0.88)",
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.transform = "translateY(-2px)";
                      event.currentTarget.style.boxShadow = "0 20px 38px rgba(15,23,42,0.42), inset 0 0 0 1px rgba(255,255,255,0.26)";
                      event.currentTarget.style.opacity = "1";
                      event.currentTarget.style.filter = "saturate(1.12)";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.transform = "translateY(0)";
                      event.currentTarget.style.boxShadow = index === galleryActiveIndex
                        ? "0 18px 38px rgba(15,23,42,0.38), inset 0 0 0 1px rgba(255,255,255,0.22)"
                        : "0 8px 18px rgba(15,23,42,0.2), inset 0 0 0 1px rgba(255,255,255,0.1)";
                      event.currentTarget.style.opacity = index === galleryActiveIndex ? "1" : "0.72";
                      event.currentTarget.style.filter = index === galleryActiveIndex ? "saturate(1.08)" : "saturate(0.88)";
                    }}
                  >
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", background: "#1a1a1a", display: "block" }}
                    />
                    {item.type === "video" ? (
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.4) 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#c4302b">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    ) : null}
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
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ACHIEVEMENT UNLOCK OVERLAY */}
      {achievementUnlocked ? (
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            animation: "achievementUnlock 400ms ease-out",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.5rem",
              animation: "badgeScale 600ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {/* Badge with glow animation */}
            <div style={{ animation: "badgeScale 620ms cubic-bezier(0.34, 1.56, 0.64, 1), badgeGlow 2s ease-in-out, celebrationPulse 1.2s ease-in-out 620ms 1" }}>
              {achievementUnlocked.badge}
            </div>
            
            {/* Title with fade-in */}
            <div
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 700,
                color: "#fff",
                textAlign: "center",
                textShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
                animation: "titleFadeIn 500ms ease-out 200ms both",
                letterSpacing: "0.02em",
              }}
            >
              {achievementUnlocked.title}
            </div>

            {/* Count indicator */}
            <div
              style={{
                fontSize: "1rem",
                color: "rgba(255, 255, 255, 0.8)",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                fontWeight: 600,
                animation: "titleFadeIn 500ms ease-out 400ms both",
              }}
            >
              {achievementUnlocked.count} of 56 Countries
            </div>
          </div>
        </div>
      ) : null}

      {lightboxItem ? (
        <div
          onClick={() => setLightboxItem(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.82)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.25rem",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(1000px, 96vw)",
              maxHeight: "92vh",
              background: "#111",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 18px 45px rgba(0,0,0,0.4)",
              position: "relative",
            }}
          >
            {hasGalleryNavigation ? (
              <>
                <button
                  onClick={showPreviousLightboxItem}
                  style={{ position: "absolute", left: "0.55rem", top: "50%", transform: "translateY(-50%)", width: "38px", height: "38px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: "1.3rem", cursor: "pointer", zIndex: 2 }}
                  aria-label="Previous media"
                >
                  ‹
                </button>
                <button
                  onClick={showNextLightboxItem}
                  style={{ position: "absolute", right: "0.55rem", top: "50%", transform: "translateY(-50%)", width: "38px", height: "38px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: "1.3rem", cursor: "pointer", zIndex: 2 }}
                  aria-label="Next media"
                >
                  ›
                </button>
              </>
            ) : null}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0.9rem", color: "#e8ece8", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{lightboxItem.title}</div>
              <button
                onClick={() => setLightboxItem(null)}
                style={{ border: "none", background: "transparent", color: "#e8ece8", fontSize: "1.25rem", cursor: "pointer", lineHeight: 1 }}
                aria-label="Close media"
              >
                ×
              </button>
            </div>
            <div style={{ background: "#000" }}>
              {lightboxItem.type === "video" ? (
                <iframe
                  src={`https://www.youtube.com/embed/${lightboxItem.videoId}?autoplay=1&rel=0`}
                  title={lightboxItem.title}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  style={{ width: "100%", aspectRatio: "16 / 9", border: "none", display: "block" }}
                />
              ) : (
                <img
                  src={lightboxItem.sourceUrl}
                  alt={lightboxItem.title}
                  style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" }}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}