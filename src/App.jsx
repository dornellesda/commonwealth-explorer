import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, useMap } from "react-leaflet";
import countries from "./data/countries.json";
import countryResearchLinks from "./data/countryResearchLinks.json";
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
const REST_COUNTRIES_URL = "https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-population.json";
const REST_COUNTRIES_CAPITAL_URL = "https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-capital-city.json";
const FAMILYSEARCH_LOGO_URL = "https://edge.fscdn.org/assets/static/media/familysearch-tree.dc22204d2135c739e39d0af7d519e182.svg";
const MAP_BACKGROUND_ART_URL = "https://plus.unsplash.com/premium_photo-1779463020508-7cd254b1d37f?auto=format&fit=crop&w=2400&q=80";
const FAMILYSEARCH_COLLECTIONS_BASE_URL = "https://www.familysearch.org/en/search/collection/list";
const FAMILYSEARCH_FETCH_MIRROR_BASE_URL = "https://r.jina.ai/http://www.familysearch.org";
const FAMILYSEARCH_CACHE_STORAGE_KEY = "familySearchCollectionsCache:v2";
const FAMILYSEARCH_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
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
  zoom: 2.2,
};

const countryZoomOverrides = {
  "New Zealand": { center: [-41, 174], zoom: 5 },
  Fiji: { center: [-17.8, 178], zoom: 6 },
  Tonga: { center: [-21.2, -175.2], zoom: 6 },
  Samoa: { center: [-13.8, -172.1], zoom: 6 },
  Vanuatu: { center: [-15.4, 166.9], zoom: 6 },
  Kiribati: { center: [1.3, 173], zoom: 5.2 },
  Tuvalu: { center: [-8.5, 179.2], zoom: 7 },
  Nauru: { center: [-0.5, 166.9], zoom: 7 },
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

function parseFamilySearchCollectionsFromLocationPage(pageText = "") {
  const seenLinks = new Set();
  const collections = [];

  pageText.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith("|")) {
      return;
    }

    const match = trimmedLine.match(/^\|\s*\[([^\]]+)\]\((https?:\/\/[^)]+\/en\/search\/collection\/\d+[^)]*)\)\s*\|/i);
    if (!match) {
      return;
    }

    const title = match[1].trim();
    const link = match[2].trim();

    if (!title || seenLinks.has(link)) {
      return;
    }

    seenLinks.add(link);
    collections.push({
      title,
      link,
      updated: "",
      updatedAt: new Date(0),
    });
  });

  return collections.slice(0, 3);
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
  const collections = [];

  pageText.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith("|")) {
      return;
    }

    const match = trimmedLine.match(/^\|\s*More\s*\|\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)\s*\|\s*(.*?)\s*\|/i);
    if (!match) {
      return;
    }

    const title = match[1].trim();
    const link = match[2].trim();
    const details = match[3].trim();
    const dateMatch = details.match(/(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i);

    if (!dateMatch) {
      return;
    }

    const updatedAt = parseFamilySearchDate(dateMatch[1]);
    if (!updatedAt) {
      return;
    }

    collections.push({
      title,
      link,
      updated: dateMatch[1],
      updatedAt,
    });
  });

  return collections
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);
}

function MapBounds() {
  const map = useMap();

  useEffect(() => {
    map.setMinZoom(2.2);
    map.options.worldCopyJump = true;
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

function AmbientMapMotion() {
  const map = useMap();

  useEffect(() => {
    // Apply subtle breathing to rendered map art/map pane (not tile layers).
    const mapContainer = map.getContainer();
    const motionTarget =
      map.getPane("background-art-pane") ||
      mapContainer.querySelector(".leaflet-map-pane") ||
      mapContainer;

    if (!motionTarget) {
      return;
    }

    const previousFilter = motionTarget.style.filter;

    let animationFrame;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      // Very slow breathing: 20 second cycle
      const breathe = Math.sin(elapsed / 10000 * Math.PI) * 0.015 + 1;

      motionTarget.style.filter = `brightness(${breathe})`;
      animationFrame = requestAnimationFrame(animate);
    };

    // Start the animation
    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }

      motionTarget.style.filter = previousFilter;
    };
  }, [map]);

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

function SmallCountryMarkers({
  geojson,
  onSelectCountry,
  selectedCountry,
  hoveredCountry,
  activatedCountryName,
  isPanelOpen,
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
            "fill 250ms cubic-bezier(0.22, 1, 0.36, 1), stroke 250ms cubic-bezier(0.22, 1, 0.36, 1), r 250ms cubic-bezier(0.22, 1, 0.36, 1), filter 250ms cubic-bezier(0.22, 1, 0.36, 1)";
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
        element.style.filter = style.glow
          ? "drop-shadow(0 0 8px rgba(241, 100, 88, 0.35))"
          : "none";
      }
    });
  }, [hoveredCountry, selectedCountry, activatedCountryName, isPanelOpen]);

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
  hoveredCountry,
  onCountryHover,
  countryLayerRefs,
  onGeojsonLoad,
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
            element.style.transition = "fill 300ms cubic-bezier(0.22, 1, 0.36, 1), fill-opacity 300ms cubic-bezier(0.22, 1, 0.36, 1), stroke 300ms cubic-bezier(0.22, 1, 0.36, 1), stroke-width 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms cubic-bezier(0.22, 1, 0.36, 1), filter 300ms cubic-bezier(0.22, 1, 0.36, 1)";
            
            if (isActivated) {
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
  }, [selectedCountry, activatedCountryName, hoveredCountry, isPanelOpen]);

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

    console.log("GeoJSON URL:", GEOJSON_URL);

    fetch(GEOJSON_URL)
      .then((response) => {
        console.log("Fetch status:", response.status, response.statusText);
        console.log("Response size:", response.headers.get("content-length"));
        return response.json();
      })
      .then((data) => {
        if (isActive) {
          console.log("GeoJSON Loaded:", data.features?.length, "features");
          console.log("GeoJSON type:", data.type);
          console.log("First feature:", data.features?.[0]?.properties?.name || data.features?.[0]?.properties?.NAME);
          
          setGeojson(data);
          onGeojsonLoad(data);
          
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
          console.error("Error details:", error);
          setGeojson(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, [setGeojson]);

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

          const duration = phase === "in" ? 300 : 300;

          element.style.transition =
            `fill ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), fill-opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), stroke ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), stroke-width ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
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
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [attractAutoCountryName, setAttractAutoCountryName] = useState("");
  const [activatedCountryName, setActivatedCountryName] = useState(null);
  const [heroMotionSeed, setHeroMotionSeed] = useState(0);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [countryDataCache, setCountryDataCache] = useState({});
  const [familySearchCollections, setFamilySearchCollections] = useState([]);
  const [lightboxItem, setLightboxItem] = useState(null);
  const [showGalleryNavigation, setShowGalleryNavigation] = useState(false);
  const [isFamilySearchCacheReady, setIsFamilySearchCacheReady] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [hasOverviewOverflow, setHasOverviewOverflow] = useState(false);
  const [recordCollectionsDisplayLimit, setRecordCollectionsDisplayLimit] = useState(3);
  const [validatedHeroImage, setValidatedHeroImage] = useState(null);
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
  const galleryTrackRef = useRef(null);
  const overviewTextRef = useRef(null);
  const recordTitleRefs = useRef([]);

  const commonwealthCountries = [...countries].sort((a, b) => a.name.localeCompare(b.name));
  const filteredCountries = commonwealthCountries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearSelectionTimeline = () => {
    selectionTimelineTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    selectionTimelineTimeoutsRef.current = [];
  };

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

  const handleReset = () => {
    clearSelectionTimeline();

    if (panelOpenTimeoutRef.current) {
      clearTimeout(panelOpenTimeoutRef.current);
      panelOpenTimeoutRef.current = null;
    }

    setSelectedCountry(null);
    setIsMenuOpen(false);
    setIsPanelOpen(false);
    setIsPanelVisible(false);
    setIsOverlayVisible(false);
    setIsContentVisible(false);
    setActivatedCountryName(null);
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
    clearSelectionTimeline();

    if (panelOpenTimeoutRef.current) {
      clearTimeout(panelOpenTimeoutRef.current);
      panelOpenTimeoutRef.current = null;
    }

    setSelectedCountry(country);
    setHeroMotionSeed((value) => value + 1);
    const selectedKey = normalizeName(country.name);
    selectedCountryKeyRef.current = selectedKey;
    setIsMenuOpen(false);
    setIsPanelOpen(true);
    setIsPanelVisible(false);
    setIsOverlayVisible(false);
    setIsContentVisible(false);
    setActivatedCountryName(null);

    const hasCachedCollections = Object.prototype.hasOwnProperty.call(
      familySearchCollectionsCacheRef.current,
      selectedKey
    );

    if (!hasCachedCollections) {
      loadFamilySearchCollectionsForCountry(country.name).then((collections) => {
        if (selectedCountryKeyRef.current === selectedKey) {
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

  const handleGeojsonLoad = (data) => {
    setGeojson(data);
  };

  const handleCountryHover = (countryName = null) => {
    setHoveredCountry(countryName);
  };

  // Fetch country data from public JSON datasets on app start
  useEffect(() => {
    const fetchCountryData = async () => {
      try {
        console.log("REST Countries URL:", REST_COUNTRIES_URL);
        const [populationResponse, capitalResponse] = await Promise.all([
          fetch(REST_COUNTRIES_URL, { headers: { Accept: "application/json" } }),
          fetch(REST_COUNTRIES_CAPITAL_URL, { headers: { Accept: "application/json" } }),
        ]);

        console.log("REST Countries response:", populationResponse.status);
        console.log("REST Countries capital response:", capitalResponse.status);

        if (!populationResponse.ok || !capitalResponse.ok) {
          throw new Error("Country data request failed");
        }

        const populationData = await populationResponse.json();
        const capitalData = await capitalResponse.json();

        console.log("Countries returned:", populationData.length);
        console.log("Capital entries returned:", capitalData.length);
        console.log("Sample country:", populationData[0]);

        const capitalByCountry = new Map(
          capitalData.map((entry) => [normalizeName(entry.country), entry.city])
        );

        const cache = {};
        populationData.forEach((country) => {
          const name = country.country;
          if (name) {
            const normalizedName = normalizeName(name);
            const entry = {
              capital: capitalByCountry.get(normalizedName) || null,
              population: country.population || null,
            };

            getCountryLookupKeys(name).forEach((lookupKey) => {
              cache[lookupKey] = entry;
            });

            if (normalizedName === "the bahamas") {
              cache.bahamas = entry;
            }
          }
        });

        setCountryDataCache(cache);
        console.log("Cached countries:", Object.keys(cache).length);
        console.log("Country data cache ready:", Object.keys(cache).length);
      } catch (error) {
        console.error("Failed to fetch country data:", error);
      }
    };

    fetchCountryData();
  }, []);

  // Get country data with API cache fallback to countries.json
  const getCountryData = (country) => {
    console.log("Lookup country:", country.name);
    const lookupKeys = getCountryLookupKeys(country.name);
    console.log("Lookup keys:", lookupKeys);
    const cached = lookupKeys.reduce((match, lookupKey) => match || countryDataCache[lookupKey], null);
    console.log("Found cached result:", cached);

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

  useEffect(() => {
    if (selectedCountry) {
      console.log("Selected country for detail lookup:", selectedCountry.name);
      getCountryData(selectedCountry);
    }
  }, [selectedCountry, countryDataCache]);

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

    const fallbackUrl = buildFamilySearchCollectionUrl(countryName, { requirePlaceId: true });
    const locationUrl = getFamilySearchLocationUrl(countryName);

    const requestPromise = (async () => {
      try {
      let url = familySearchCollectionUrlCacheRef.current[cacheKey] || null;
      const candidateUrls = [];

      let locationPageText = "";

      if (!url && locationUrl) {
        const locationFetchUrl = toFamilySearchFetchUrl(locationUrl);

        if (locationFetchUrl) {
          const locationResponse = await fetch(locationFetchUrl, {
            headers: { Accept: "text/plain, text/html, */*" },
          });
          locationPageText = await locationResponse.text();
          const canonicalAbsoluteUrl = parseCanonicalCollectionsUrlFromLocationPage(locationPageText);

          if (canonicalAbsoluteUrl) {
            url = canonicalAbsoluteUrl;
          }
        }
      }

      if (url) {
        candidateUrls.push(url);
      }

      if (!url) {
        url = fallbackUrl;
      }

      if (fallbackUrl && !candidateUrls.includes(fallbackUrl)) {
        candidateUrls.push(fallbackUrl);
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
        const collections = parseFamilySearchCollections(pageText);

        console.log("Collections found:", collections.length);

        if (collections.length > 0) {
          familySearchCollectionUrlCacheRef.current[cacheKey] = candidateUrl;
          familySearchCollectionsCacheRef.current[cacheKey] = collections;
          persistFamilySearchCache();
          return collections;
        }
      }

      if (locationPageText) {
        const fallbackCollections = parseFamilySearchCollectionsFromLocationPage(locationPageText);
        if (fallbackCollections.length > 0) {
          familySearchCollectionsCacheRef.current[cacheKey] = fallbackCollections;
          persistFamilySearchCache();
          return fallbackCollections;
        }
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
      return;
    }

    const track = galleryTrackRef.current;
    const updateNavigationVisibility = () => {
      setShowGalleryNavigation(track.scrollWidth - track.clientWidth > 4);
    };

    updateNavigationVisibility();

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateNavigationVisibility);
      resizeObserver.observe(track);
    }

    window.addEventListener("resize", updateNavigationVisibility);

    return () => {
      window.removeEventListener("resize", updateNavigationVisibility);
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
    };
  }, []);

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

  const detailItems = selectedCountry
    ? (() => {
        const data = selectedCountry ? getCountryData(selectedCountry) : null;
        return data
          ? [
              { label: "Capital", value: data.capital },
              { label: "Population", value: data.population ? formatPopulation(data.population) : "Not available" },
            ]
          : [];
      })()
    : [];
  const familySearchLocationUrl = selectedCountry
    ? getFamilySearchLocationUrl(selectedCountry.name)
    : null;
  const visibleFamilySearchCollections = familySearchCollections.filter(
    (collection) => !/no collections found/i.test(collection.title)
  );
  const displayedFamilySearchCollections = visibleFamilySearchCollections.slice(
    0,
    recordCollectionsDisplayLimit
  );
  const selectedCountryResearchLinks = selectedCountry
    ? countryResearchLinks[selectedCountry.name] || null
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

  const selectedCountryHeroImage = selectedCountry
    ? (isLandscapeOrCityscapeHeroUrl(selectedCountry.image) &&
      isCountrySpecificHeroUrl(selectedCountry.image, selectedCountry.name)
        ? selectedCountry.image
        : buildUnsplashHeroFallbackUrl(selectedCountry.name))
    : DEFAULT_HERO_IMAGE_URL;

  useEffect(() => {
    if (!selectedCountry) {
      setValidatedHeroImage(null);
      return;
    }

    let isActive = true;
    const candidateUrl = isLandscapeOrCityscapeHeroUrl(selectedCountry.image) &&
      isCountrySpecificHeroUrl(selectedCountry.image, selectedCountry.name)
      ? selectedCountry.image
      : null;
    const fallbackUrl = buildUnsplashHeroFallbackUrl(selectedCountry.name);

    // Show candidate immediately while validating
    setValidatedHeroImage(candidateUrl || fallbackUrl);

    const validate = async () => {
      if (candidateUrl) {
        const candidateValid = await testImageUrl(candidateUrl);
        if (!isActive) return;

        if (candidateValid) {
          return;
        }
      }

      const wikimediaUrl = await fetchCountrySpecificWikimediaHero(selectedCountry.name);
      if (!isActive) return;

      if (wikimediaUrl) {
        setValidatedHeroImage(wikimediaUrl);
        return;
      }

      setValidatedHeroImage(fallbackUrl);
      const fallbackValid = await testImageUrl(fallbackUrl);
      if (!isActive) return;

      if (fallbackValid) {
        return;
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

  // Check if we're in attract mode (no country selected and menu closed)
  const isAttractMode = !selectedCountry && !isMenuOpen;

  const clearAttractCycleTimer = () => {
    if (attractCycleTimeoutRef.current) {
      clearTimeout(attractCycleTimeoutRef.current);
      attractCycleTimeoutRef.current = null;
    }
  };

  const getAttractCountryDistance = (countryA, countryB) => {
    if (!countryA || !countryB) {
      return 0;
    }

    return Math.hypot((countryA.lat || 0) - (countryB.lat || 0), (countryA.lng || 0) - (countryB.lng || 0));
  };

  const pickRandomAttractCountry = (previousCountryName = "") => {
    const mapCountries = commonwealthCountries.filter(
      (country) => Number.isFinite(country.lat) && Number.isFinite(country.lng)
    );

    if (!mapCountries.length) {
      return null;
    }

    const previous = mapCountries.find((country) => country.name === previousCountryName) || null;
    const distantCandidates = previous
      ? mapCountries.filter(
          (country) => country.name !== previous.name && getAttractCountryDistance(country, previous) >= 25
        )
      : mapCountries;
    const pool = distantCandidates.length
      ? distantCandidates
      : mapCountries.filter((country) => country.name !== previousCountryName);

    if (!pool.length) {
      return null;
    }

    return pool[Math.floor(Math.random() * pool.length)];
  };

  useEffect(() => {
    clearAttractCycleTimer();

    if (!isAttractMode) {
      setAttractAutoCountryName("");
      return;
    }

    let isActive = true;
    let previousCountryName = "";

    const scheduleNext = (delayMs) => {
      clearAttractCycleTimer();
      attractCycleTimeoutRef.current = window.setTimeout(() => {
        if (!isActive) {
          return;
        }

        const nextCountry = pickRandomAttractCountry(previousCountryName);
        if (!nextCountry) {
          scheduleNext(1600);
          return;
        }

        previousCountryName = nextCountry.name;
        setHoveredCountry(nextCountry.name);
        setAttractAutoCountryName(nextCountry.name.toUpperCase());

        const holdMs = 2200 + Math.round(Math.random() * 900);
        const pauseMs = 1100 + Math.round(Math.random() * 900);

        attractCycleTimeoutRef.current = window.setTimeout(() => {
          if (!isActive) {
            return;
          }

          setHoveredCountry((current) => (current === nextCountry.name ? null : current));
          setAttractAutoCountryName("");
          scheduleNext(pauseMs);
        }, holdMs);
      }, delayMs);
    };

    scheduleNext(850);

    return () => {
      isActive = false;
      clearAttractCycleTimer();
      setAttractAutoCountryName("");
      setHoveredCountry((current) => (current && !selectedCountry ? null : current));
    };
  }, [isAttractMode]);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#1a1f2e",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* ATTRACT MODE OVERLAY - Shows when idle */}
      <div
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
        {/* Subtle atmospheric overlays to preserve map as hero */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(126% 92% at 50% 44%, rgba(8, 13, 24, 0.1) 0%, rgba(8, 13, 24, 0.34) 70%, rgba(8, 13, 24, 0.52) 100%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 22%, rgba(8,12,20,0.2) 100%)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(58% 42% at 50% 43%, rgba(4, 9, 18, 0.02) 0%, rgba(4, 9, 18, 0.22) 54%, rgba(4, 9, 18, 0) 100%)",
            pointerEvents: "none",
          }}
        />
        
        {/* Headline and invitation */}
        <div
          style={{
            position: "relative",
            textAlign: "center",
            color: "#fff",
            maxWidth: "980px",
            padding: "0 2.25rem",
            display: "grid",
            gap: "1rem",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "-26px -36px -32px",
              background: "radial-gradient(65% 55% at 50% 42%, rgba(0,0,0,0.46) 0%, rgba(0,0,0,0.24) 38%, rgba(0,0,0,0) 100%)",
              filter: "blur(8px)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              fontSize: "0.74rem",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              fontWeight: 560,
              color: "rgba(255,255,255,0.72)",
              opacity: isAttractMode ? 1 : 0,
              transform: isAttractMode ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 650ms ease 120ms, transform 650ms cubic-bezier(0.22, 1, 0.36, 1) 120ms",
            }}
          >
            Commonwealth Explorer
          </div>
          <h1
            style={{
              position: "relative",
              zIndex: 1,
              fontSize: "clamp(3rem, 7vw, 6.25rem)",
              fontWeight: 680,
              letterSpacing: "-0.04em",
              lineHeight: 0.98,
              margin: 0,
              color: "#f8fbff",
              textShadow: "0 12px 28px rgba(5, 8, 16, 0.7), 0 4px 14px rgba(5, 8, 16, 0.58), 0 0 26px rgba(155, 209, 255, 0.24)",
              opacity: isAttractMode ? 1 : 0,
              transform: isAttractMode ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 700ms ease 220ms, transform 700ms cubic-bezier(0.22, 1, 0.36, 1) 220ms",
            }}
          >
            56 Nations.
            <br />
            Millions of Stories.
          </h1>
          <p
            style={{
              position: "relative",
              zIndex: 1,
              fontSize: "clamp(1.05rem, 2.05vw, 1.5rem)",
              fontWeight: 400,
              color: "rgba(244, 249, 255, 0.95)",
              margin: "0 auto",
              maxWidth: "720px",
              letterSpacing: "-0.012em",
              lineHeight: 1.34,
              textShadow: "0 2px 12px rgba(5, 8, 16, 0.55)",
              opacity: isAttractMode ? 1 : 0,
              transform: isAttractMode ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 700ms ease 400ms, transform 700ms cubic-bezier(0.22, 1, 0.36, 1) 400ms",
            }}
          >
            Discover your family story across the Commonwealth.
          </p>
          <button
            onClick={() => setIsMenuOpen(true)}
            style={{
              position: "relative",
              zIndex: 1,
              margin: "1rem auto 0",
              padding: "1.05rem 2rem",
              fontSize: "clamp(0.95rem, 1.35vw, 1.12rem)",
              fontWeight: 560,
              color: "rgba(245, 251, 255, 0.96)",
              background: "linear-gradient(180deg, rgba(165, 230, 132, 0.24) 0%, rgba(93, 140, 53, 0.26) 100%)",
              border: "none",
              borderRadius: "100px",
              cursor: "pointer",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              backdropFilter: "blur(16px) saturate(140%)",
              WebkitBackdropFilter: "blur(16px) saturate(140%)",
              borderColor: "rgba(214, 255, 188, 0.42)",
              borderWidth: "1px",
              borderStyle: "solid",
              boxShadow: "0 14px 38px rgba(7, 11, 20, 0.5), 0 0 0 1px rgba(220,255,205,0.16), 0 0 30px rgba(142, 217, 102, 0.22)",
              opacity: isAttractMode ? 1 : 0,
              transform: isAttractMode ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
              transition: "opacity 650ms ease 560ms, transform 650ms cubic-bezier(0.22, 1, 0.36, 1) 560ms, background 220ms ease, box-shadow 220ms ease",
              animation: isAttractMode ? "attractPulse 3.2s ease-in-out infinite" : "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(180deg, rgba(182, 240, 147, 0.35) 0%, rgba(111, 164, 67, 0.36) 100%)";
              e.currentTarget.style.boxShadow = "0 18px 44px rgba(7, 11, 20, 0.56), 0 0 0 1px rgba(224,255,212,0.24), 0 0 36px rgba(152, 232, 112, 0.34)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(180deg, rgba(165, 230, 132, 0.24) 0%, rgba(93, 140, 53, 0.26) 100%)";
              e.currentTarget.style.boxShadow = "0 14px 38px rgba(7, 11, 20, 0.5), 0 0 0 1px rgba(220,255,205,0.16), 0 0 30px rgba(142, 217, 102, 0.22)";
            }}
          >
            Touch to Begin
          </button>
          <div
            style={{
              position: "relative",
              zIndex: 1,
              fontSize: "0.82rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(239, 248, 255, 0.68)",
              marginTop: "0.2rem",
              textShadow: "0 1px 8px rgba(5, 8, 16, 0.35)",
              opacity: isAttractMode ? 1 : 0,
              transform: isAttractMode ? "translateY(0)" : "translateY(14px)",
              transition: "opacity 600ms ease 680ms, transform 600ms cubic-bezier(0.22, 1, 0.36, 1) 680ms",
            }}
          >
            Touch anywhere to begin exploration
          </div>
          <div
            style={{
              position: "relative",
              zIndex: 1,
              alignSelf: "center",
              marginTop: "0.15rem",
              minHeight: "1.1rem",
              fontSize: "0.9rem",
              fontWeight: 560,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(232, 243, 255, 0.92)",
              textShadow: "0 2px 10px rgba(5, 8, 16, 0.6)",
              opacity: attractAutoCountryName ? 1 : 0,
              transform: attractAutoCountryName ? "translateY(0)" : "translateY(6px)",
              transition: `opacity 360ms ${springEase}, transform 360ms ${springEase}`,
              pointerEvents: "none",
            }}
          >
            {attractAutoCountryName}
          </div>
        </div>

        {/* FamilySearch logo at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: "3rem",
            opacity: isAttractMode ? 0.72 : 0,
            transition: "opacity 600ms ease 800ms",
          }}
        >
          <img
            src={FAMILYSEARCH_LOGO_URL}
            alt="FamilySearch"
            style={{
              width: "140px",
              height: "auto",
              filter: "brightness(0) invert(1)",
            }}
          />
        </div>
      </div>

      {/* TOP BAR - Minimal, appears when not in attract mode */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.5rem 2rem",
          pointerEvents: isAttractMode ? "none" : "auto",
          opacity: isAttractMode ? 0 : 1,
          transition: "opacity 400ms ease",
        }}
      >
        {/* Explore button - opens country dock */}
        <button
          onClick={() => setIsMenuOpen(true)}
          style={{
            padding: "0.875rem 1.5rem",
            borderRadius: "100px",
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.15)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#fff",
            fontSize: "1rem",
            fontWeight: 500,
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            cursor: "pointer",
            transition: "all 200ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
            e.currentTarget.style.transform = "scale(1)";
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
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
          <span>Explore</span>
        </button>

        {/* FamilySearch logo */}
        <img
          src={FAMILYSEARCH_LOGO_URL}
          alt="FamilySearch"
          style={{
            width: "120px",
            height: "auto",
            filter: "brightness(0) invert(1)",
            opacity: 0.7,
          }}
        />
      </div>

      {/* COUNTRY DOCK - Bottom navigation rail */}
      {(isMenuOpen || isMenuClosing) && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 900,
            padding: "1.5rem 2rem 2rem",
            background: "linear-gradient(to top, rgba(26, 31, 46, 0.95) 0%, rgba(26, 31, 46, 0.8) 70%, transparent 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            opacity: isMenuClosing ? 0 : 1,
            transform: isMenuClosing ? "translateY(20px)" : "translateY(0)",
            transition: "opacity 300ms cubic-bezier(0.22, 1, 0.36, 1), transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {/* Search bar */}
          <div style={{ maxWidth: "600px", margin: "0 auto 1.5rem", position: "relative" }}>
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
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search countries..."
              style={{
                width: "100%",
                border: "none",
                borderRadius: "100px",
                padding: "1rem 1.25rem 1rem 3.5rem",
                fontSize: "1.1rem",
                color: "#fff",
                background: "rgba(255, 255, 255, 0.1)",
                outline: "none",
                boxSizing: "border-box",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
                fontWeight: 400,
                letterSpacing: "-0.01em",
                transition: "background 200ms ease",
              }}
              onFocus={(e) => { e.target.style.background = "rgba(255, 255, 255, 0.15)"; }}
              onBlur={(e) => { e.target.style.background = "rgba(255, 255, 255, 0.1)"; }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
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
            )}
          </div>

          {/* Country cards horizontal scroll */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              overflowX: "auto",
              padding: "0.5rem 0",
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
                    handleSelectCountry(country);
                    setIsMenuOpen(false);
                  }}
                  style={{
                    flex: "0 0 auto",
                    width: "132px",
                    padding: "0.85rem 0.75rem 0.7rem",
                    borderRadius: "16px",
                    background: isActive ? "rgba(135, 185, 64, 0.3)" : "rgba(255, 255, 255, 0.08)",
                    border: isActive ? "2px solid rgba(135, 185, 64, 0.6)" : "1px solid rgba(255, 255, 255, 0.1)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.45rem",
                    scrollSnapAlign: "start",
                    transition: "all 200ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                  onMouseEnter={(e) => {
                    handleCountryHover(country.name);
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    handleCountryHover(null);
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  <img
                    src={`https://flagcdn.com/w80/${country.countryCode || "xx"}.png`}
                    alt=""
                    style={{
                      width: "46px",
                      height: "30px",
                      borderRadius: "5px",
                      objectFit: "cover",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.79rem",
                      fontWeight: 500,
                      color: "#fff",
                      textAlign: "center",
                      lineHeight: 1.14,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {country.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              setIsMenuClosing(true);
              setTimeout(() => {
                setIsMenuOpen(false);
                setIsMenuClosing(false);
              }, 300);
            }}
            style={{
              position: "absolute",
              top: "1.5rem",
              right: "2rem",
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: "1.5rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            }}
            aria-label="Close"
          >
            ×
          </button>
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
            minZoom={2.2}
            maxZoom={12}
            zoomControl={false}
            style={{ height: "100%", width: "100%", position: "relative", zIndex: 2, background: "rgba(156, 148, 122, 0)" }}
          >
        <MapArtOverlay imageUrl={MAP_BACKGROUND_ART_URL} opacity={0.28} />
        <MapBounds />
        <AmbientMapMotion />
        <VintageMapDecorations />
        <WorldGeoLayer
          onSelectCountry={handleSelectCountry}
          onBackgroundClick={handleReset}
          mapRef={mapRef}
          selectedCountry={selectedCountry}
          activatedCountryName={activatedCountryName}
          isPanelOpen={isPanelOpen}
          hoveredCountry={hoveredCountry}
          onCountryHover={handleCountryHover}
          countryLayerRefs={countryLayerRefs}
          onGeojsonLoad={handleGeojsonLoad}
        />
        <SmallCountryMarkers
          geojson={geojson}
          onSelectCountry={handleSelectCountry}
          selectedCountry={selectedCountry}
          hoveredCountry={hoveredCountry}
          activatedCountryName={activatedCountryName}
          isPanelOpen={isPanelOpen}
          onCountryHover={handleCountryHover}
        />
        </MapContainer>

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
        onClick={(event) => event.stopPropagation()}
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "50%",
          transform: isPanelVisible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(100px)",
          width: "min(900px, 92vw)",
          maxHeight: "75vh",
          background: "rgba(26, 31, 46, 0.92)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          boxShadow: "0 32px 80px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.3)",
          borderRadius: "32px",
          opacity: isPanelVisible ? 1 : 0,
          transition: "opacity 500ms cubic-bezier(0.22, 1, 0.36, 1), transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
          pointerEvents: isPanelVisible ? "auto" : "none",
          overflowY: "auto",
          overflowX: "hidden",
          zIndex: 1000,
          color: "#fff",
          border: "1px solid rgba(255, 255, 255, 0.1)",
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
                border: "none",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(10px)",
                color: "#fff",
                fontSize: "1.5rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 200ms ease",
                zIndex: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.15)";
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

            {/* Content sections with padding */}
            <div style={{ padding: `1.5rem ${STORY_CARD_SIDE_PADDING} 2rem` }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr)",
                  gap: "1.5rem",
                  alignItems: "start",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, ...getRevealStyle(2) }}>
                  <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                    Overview
                  </h3>
                  <p
                    ref={overviewTextRef}
                    style={{
                      margin: 0,
                      lineHeight: 1.7,
                      fontSize: "1rem",
                      color: "rgba(255,255,255,0.85)",
                      overflow: "hidden",
                      display: isOverviewExpanded ? "block" : "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: isOverviewExpanded ? "unset" : 6,
                    }}
                  >
                    {selectedCountry.overview}
                  </p>
                  {hasOverviewOverflow ? (
                    <button
                      onClick={() => setIsOverviewExpanded((value) => !value)}
                      style={{
                        marginTop: "0.75rem",
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
                <div style={{ display: "grid", gap: "0.75rem", gridTemplateRows: "repeat(2, minmax(0, 1fr))", minWidth: 0, ...getRevealStyle(1) }}>
                  {detailItems.map((item) => (
                    <div
                      key={item.label}
                      style={{
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: "1rem 1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      <div style={{ marginBottom: "0.4rem", display: "flex", alignItems: "center" }}>{renderStatIcon(item.label)}</div>
                      <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", marginBottom: "0.3rem", fontWeight: 600 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff" }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FamilySearch Records and Research Helps */}
            <div style={{ padding: `0 ${STORY_CARD_SIDE_PADDING} 1.5rem` }}>
              <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.1)", margin: "0 0 1.5rem" }} />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr)",
                  gap: "1.5rem",
                  alignItems: "start",
                }}
              >
                <div style={{ minWidth: 0, ...getRevealStyle(3) }}>
                <h3 style={{ margin: "0 0 0.45rem", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.14em", color: SUBTLE_DARK_CARD_TEXT_COLOR, fontWeight: 700 }}>
                  FamilySearch Records
                </h3>
                <div style={{ display: "grid", gap: "0.38rem" }}>
                  {displayedFamilySearchCollections.length ? (
                    displayedFamilySearchCollections.map((collection, index) => (
                      <a
                        key={`${collection.title}-${collection.link}`}
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
                          style={{ minWidth: 0, whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere", display: "block" }}
                        >
                          {collection.title}
                        </span>
                      </a>
                    ))
                  ) : (
                    <div style={{ color: SUBTLE_DARK_CARD_TEXT_COLOR, fontSize: "0.95rem", textAlign: "left" }}>No FamilySearch record collections available.</div>
                  )}
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

              <div style={{ minWidth: 0, ...getRevealStyle(4) }}>
                <h3 style={{ margin: "0 0 0.45rem", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.14em", color: SUBTLE_DARK_CARD_TEXT_COLOR, fontWeight: 700 }}>
                  Research Helps
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

     <div
  style={{
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    overflow: "visible",
    padding: `0 ${STORY_CARD_SIDE_PADDING} 1.8rem`,
    ...getRevealStyle(5),
  }}
>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b", fontWeight: 500 }}>
                  Discover
                </h3>
                {showGalleryNavigation ? (
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button
                      onClick={() => scrollGallery("left")}
                      style={{ 
                        border: "none", 
                        background: "transparent", 
                        color: "#94a3b8", 
                        borderRadius: "6px", 
                        width: "24px", 
                        height: "24px", 
                        cursor: "pointer", 
                        lineHeight: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "color 180ms ease",
                        opacity: 0.6,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#475569";
                        e.currentTarget.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#94a3b8";
                        e.currentTarget.style.opacity = "0.6";
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
                        border: "none", 
                        background: "transparent", 
                        color: "#94a3b8", 
                        borderRadius: "6px", 
                        width: "24px", 
                        height: "24px", 
                        cursor: "pointer", 
                        lineHeight: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "color 180ms ease",
                        opacity: 0.6,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#475569";
                        e.currentTarget.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#94a3b8";
                        e.currentTarget.style.opacity = "0.6";
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
             <div
  ref={galleryTrackRef}
  style={{
    display: "flex",
    gap: "0.6rem",
    overflowX: "auto",
    overflowY: "hidden",
    paddingTop: "2px",
    paddingBottom: "8px",
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
                      flex: "0 0 80%",
                      minWidth: "0",
                      height: "155px",
                      transform: "translateY(0)",
                      transition: "transform 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease",
                      boxShadow: "0 4px 16px rgba(15,23,42,0.1), 0 1px 4px rgba(15,23,42,0.06)",
                      scrollSnapAlign: "center",
                      opacity: index === 0 ? 1 : 0.75,
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.transform = "translateY(-2px)";
                      event.currentTarget.style.boxShadow = "0 8px 24px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.08)";
                      event.currentTarget.style.opacity = "1";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.transform = "translateY(0)";
                      event.currentTarget.style.boxShadow = "0 4px 16px rgba(15,23,42,0.1), 0 1px 4px rgba(15,23,42,0.06)";
                      event.currentTarget.style.opacity = index === 0 ? "1" : "0.75";
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
          </div>
        ) : null}
      </div>

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