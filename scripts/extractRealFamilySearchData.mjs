/**
 * Script to extract real FamilySearch collection data from country location pages
 * using the Jina AI mirror, replacing the fake template data in addFamilySearchData.mjs.
 */

const FAMILYSEARCH_FETCH_MIRROR_BASE_URL = "https://r.jina.ai/http://www.familysearch.org";

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

function normalizeName(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getLocationUrl(countryName) {
  const key = normalizeName(countryName);
  return FAMILYSEARCH_LOCATION_URL_BY_COUNTRY[key] || null;
}

function toFamilySearchFetchUrl(url) {
  if (!url) return null;
  const match = url.match(/^https?:\/\/www\.familysearch\.org(\/.*)$/i);
  if (!match) return null;
  return `${FAMILYSEARCH_FETCH_MIRROR_BASE_URL}${match[1]}`;
}

/**
 * Parse the markdown output from Jina AI to extract "Indexed Historical Records" 
 * and "Genealogies" sections.
 */
function parseFamilySearchCollectionsFromLocationPage(pageText = "") {
  const seenRecordLinks = new Set();
  const seenGenealogyLinks = new Set();
  const records = [];
  const genealogies = [];
  let activeSection = "";

  pageText.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    if (/^##\s+Indexed Historical Records$/i.test(trimmedLine) || /^##\s+Image-Only Historical Records$/i.test(trimmedLine)) {
      activeSection = "records";
      return;
    }
    if (/^##\s+Genealogies$/i.test(trimmedLine)) {
      activeSection = "genealogies";
      return;
    }
    if (!trimmedLine.startsWith("|")) return;

    // Parse table rows - format: | [title](link) | ... |
    const match = trimmedLine.match(/^\|\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)\s*\|/i);
    if (!match) return;

    const title = match[1].trim();
    const link = match[2].trim().replace(/^http:/i, "https:");
    if (!title || !link) return;

    if (activeSection === "records" && /\/en\/search\/collection\/\d+/i.test(link)) {
      if (seenRecordLinks.has(link)) return;
      seenRecordLinks.add(link);
      records.push({
        title,
        link,
        updated: "",
        updatedAt: new Date(0).toISOString(),
        category: "record",
      });
      return;
    }
    if (activeSection === "genealogies" && /\/en\/search\/genealogies\/submission\//i.test(link)) {
      if (seenGenealogyLinks.has(link)) return;
      seenGenealogyLinks.add(link);
      genealogies.push({
        title,
        link,
        updated: "",
        updatedAt: new Date(0).toISOString(),
        category: "genealogy",
      });
    }
  });

  return {
    records: records.slice(0, 8),
    genealogies: genealogies.slice(0, 8),
  };
}

async function fetchFamilySearchForCountry(countryName) {
  const locationUrl = getLocationUrl(countryName);
  if (!locationUrl) {
    console.log(`  No location URL for: ${countryName}`);
    return null;
  }

  const fetchUrl = toFamilySearchFetchUrl(locationUrl);
  if (!fetchUrl) {
    console.log(`  Cannot build fetch URL for: ${countryName}`);
    return null;
  }

  try {
    console.log(`  Fetching: ${fetchUrl}`);
    const response = await fetch(fetchUrl, {
      headers: {
        "Accept": "text/plain, text/markdown",
        "X-Return-Format": "markdown",
      },
    });

    if (!response.ok) {
      console.log(`  HTTP ${response.status} for ${countryName}`);
      return null;
    }

    const text = await response.text();
    if (!text || text.length < 50) {
      console.log(`  Empty or too short response for ${countryName}`);
      return null;
    }

    const parsed = parseFamilySearchCollectionsFromLocationPage(text);
    const allCollections = [...parsed.records, ...parsed.genealogies];

    if (allCollections.length === 0) {
      console.log(`  No collections found for ${countryName}`);
      return null;
    }

    console.log(`  Found ${parsed.records.length} records + ${parsed.genealogies.length} genealogies for ${countryName}`);
    return allCollections;
  } catch (err) {
    console.log(`  Error fetching ${countryName}: ${err.message}`);
    return null;
  }
}

export { fetchFamilySearchForCountry, FAMILYSEARCH_LOCATION_URL_BY_COUNTRY };
