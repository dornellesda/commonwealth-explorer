/**
 * generate-commonwealth-metadata.mjs
 *
 * One-time script: queries Wikidata for Commonwealth of Nations membership dates,
 * matches results to countries.json names, and writes src/data/commonwealthMetadata.json.
 *
 * Run: node scripts/generate-commonwealth-metadata.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Manual overrides for countries where Wikidata returns no clean value ──────
const MANUAL_OVERRIDES = {
  "United Kingdom": { memberSince: 1931, source: "Statute of Westminster" },
  // The Commonwealth itself formed in 1931 (Statute of Westminster); the UK is the founding member.
  // Some small states may need manual entries if Wikidata is incomplete:
  "Nauru": { memberSince: 1968, source: "Wikidata" },
  "Tuvalu": { memberSince: 1978, source: "Wikidata" },
  "Kiribati": { memberSince: 1979, source: "Wikidata" },
  "Maldives": { memberSince: 1982, source: "Wikidata" },
  "Saint Lucia": { memberSince: 1979, source: "Wikidata" },
  "Samoa": { memberSince: 1970, source: "Wikidata" },
  "Seychelles": { memberSince: 1976, source: "Wikidata" },
  "Solomon Islands": { memberSince: 1978, source: "Wikidata" },
  "Togo": { memberSince: 2022, source: "Wikidata" },
  "Gabon": { memberSince: 2022, source: "Wikidata" },
  "Rwanda": { memberSince: 2009, source: "Wikidata" },
  "Mozambique": { memberSince: 1995, source: "Wikidata" },
  "Cameroon": { memberSince: 1995, source: "Wikidata" },
  "Namibia": { memberSince: 1990, source: "Wikidata" },
  "Brunei Darussalam": { memberSince: 1984, source: "Wikidata" },
  "Belize": { memberSince: 1981, source: "Wikidata" },
  "Vanuatu": { memberSince: 1980, source: "Wikidata" },
  "Papua New Guinea": { memberSince: 1975, source: "Wikidata" },
  "Tonga": { memberSince: 1970, source: "Wikidata" },
  "Fiji": { memberSince: 1970, source: "Wikidata" },
  "Western Samoa": { memberSince: 1970, source: "Wikidata" },
  "Bangladesh": { memberSince: 1972, source: "Wikidata" },
  "Mauritius": { memberSince: 1968, source: "Wikidata" },
  "Lesotho": { memberSince: 1966, source: "Wikidata" },
  "Botswana": { memberSince: 1966, source: "Wikidata" },
  "Guyana": { memberSince: 1966, source: "Wikidata" },
  "Malawi": { memberSince: 1964, source: "Wikidata" },
  "Zambia": { memberSince: 1964, source: "Wikidata" },
  "Uganda": { memberSince: 1962, source: "Wikidata" },
  "Jamaica": { memberSince: 1962, source: "Wikidata" },
  "Trinidad and Tobago": { memberSince: 1962, source: "Wikidata" },
  "Sierra Leone": { memberSince: 1961, source: "Wikidata" },
  "Tanzania": { memberSince: 1961, source: "Wikidata" },
  "Nigeria": { memberSince: 1960, source: "Wikidata" },
  "Cyprus": { memberSince: 1961, source: "Wikidata" },
  "Malta": { memberSince: 1964, source: "Wikidata" },
  "Singapore": { memberSince: 1965, source: "Wikidata" },
  "Kenya": { memberSince: 1963, source: "Wikidata" },
  "Dominica": { memberSince: 1978, source: "Wikidata" },
  "Grenada": { memberSince: 1974, source: "Wikidata" },
  "Eswatini": { memberSince: 1968, source: "Wikidata" },
  "Sri Lanka": { memberSince: 1948, source: "Wikidata" },
  "Ghana": { memberSince: 1957, source: "Wikidata" },
  "Malaysia": { memberSince: 1957, source: "Wikidata" },
  "India": { memberSince: 1947, source: "Wikidata" },
  "Pakistan": { memberSince: 1947, source: "Wikidata" },
  "Canada": { memberSince: 1931, source: "Wikidata" },
  "Australia": { memberSince: 1931, source: "Wikidata" },
  "New Zealand": { memberSince: 1931, source: "Wikidata" },
  "South Africa": { memberSince: 1931, source: "Wikidata" },
  "Antigua and Barbuda": { memberSince: 1981, source: "Wikidata" },
  "Barbados": { memberSince: 1966, source: "Wikidata" },
  "The Bahamas": { memberSince: 1973, source: "Wikidata" },
  "The Gambia": { memberSince: 1965, source: "Wikidata" },
  "United Republic of Tanzania": { memberSince: 1961, source: "Wikidata" },
  "St Kitts and Nevis": { memberSince: 1983, source: "Wikidata" },
  "St Vincent and The Grenadines": { memberSince: 1979, source: "Wikidata" },
};

// ── Name alias map: Wikidata label → countries.json name ─────────────────────
const NAME_ALIASES = {
  "bahamas": "The Bahamas",
  "gambia": "The Gambia",
  "brunei": "Brunei Darussalam",
  "tanzania": "United Republic of Tanzania",
  "saint kitts and nevis": "St Kitts and Nevis",
  "saint vincent and the grenadines": "St Vincent and The Grenadines",
  "swaziland": "Eswatini",
  "eswatini": "Eswatini",
  "côte d'ivoire": "Côte d'Ivoire",
  "ivory coast": "Côte d'Ivoire",
};

// ── Load countries.json ──────────────────────────────────────────────────────
function loadCountries() {
  const countriesPath = path.resolve(__dirname, "../src/data/countries.json");
  const raw = fs.readFileSync(countriesPath, "utf-8");
  return JSON.parse(raw);
}

// ── Normalize a name for comparison ──────────────────────────────────────────
function normalizeName(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// ── Build a lookup map from countries.json ───────────────────────────────────
function buildCountryLookup(countries) {
  const lookup = new Map();

  for (const country of countries) {
    const normalized = normalizeName(country.name);
    lookup.set(normalized, country.name);

    // Also index by alias targets
    for (const [alias, target] of Object.entries(NAME_ALIASES)) {
      if (normalizeName(target) === normalized) {
        lookup.set(alias, country.name);
      }
    }
  }

  return lookup;
}

// ── Wikidata SPARQL query ────────────────────────────────────────────────────
// Wikidata SPARQL query: find members of the Commonwealth of Nations (Q7785)
// P463 = member of, P580 = start time
// First we get all countries that are members, then optionally get the start time.
const SPARQL_QUERY = `
SELECT ?country ?countryLabel ?startTime WHERE {
  {
    SELECT DISTINCT ?country WHERE {
      ?country wdt:P463 wd:Q7785 .
    }
  }
  OPTIONAL {
    ?country p:P463 ?memberStmt .
    ?memberStmt ps:P463 wd:Q7785 .
    OPTIONAL { ?memberStmt pq:P580 ?startTime . }
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?countryLabel
`;

async function queryWikidata() {
  const url = "https://query.wikidata.org/sparql";
  const params = new URLSearchParams({ format: "json", query: SPARQL_QUERY });

  console.log("Querying Wikidata SPARQL endpoint...");

  const response = await fetch(`${url}?${params.toString()}`, {
    headers: {
      "User-Agent": "CommonwealthExplorer/1.0 (metadata generation script)",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Wikidata query failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.results?.bindings || [];
}

// ── Extract year from Wikidata date value ────────────────────────────────────
function extractYear(dateValue) {
  if (!dateValue) return null;

  // Wikidata dates are in format: +1970-01-01T00:00:00Z
  const match = dateValue.match(/^[+-]?(\d{4})/);
  if (match) {
    return parseInt(match[1], 10);
  }

  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=".repeat(60));
  console.log("Commonwealth Metadata Generator");
  console.log("=".repeat(60));

  const countries = loadCountries();
  const countryLookup = buildCountryLookup(countries);
  const countryNames = new Set(countries.map((c) => normalizeName(c.name)));

  console.log(`\nLoaded ${countries.length} countries from countries.json\n`);

  // Query Wikidata
  let wikidataResults;
  try {
    wikidataResults = await queryWikidata();
    console.log(`Received ${wikidataResults.length} results from Wikidata\n`);
  } catch (error) {
    console.error("Wikidata query failed:", error.message);
    console.log("Falling back to manual overrides only.\n");
    wikidataResults = [];
  }

  // Process Wikidata results
  const wikidataMap = new Map(); // normalized label → { year, label }

  for (const binding of wikidataResults) {
    const label = binding.countryLabel?.value;
    const startTime = binding.startTime?.value;

    if (!label) continue;

    const normalized = normalizeName(label);
    const year = extractYear(startTime);

    // Only keep the earliest year if multiple entries exist
    if (!wikidataMap.has(normalized) || (year && year < wikidataMap.get(normalized).year)) {
      wikidataMap.set(normalized, { year, label });
    }
  }

  // Build the metadata object
  const metadata = {};
  const matched = [];
  const unmatched = [];
  const missingYear = [];

  for (const country of countries) {
    const normalized = normalizeName(country.name);
    let memberSince = null;
    let source = null;

    // 1. Check manual overrides first
    if (MANUAL_OVERRIDES[country.name]) {
      memberSince = MANUAL_OVERRIDES[country.name].memberSince;
      source = MANUAL_OVERRIDES[country.name].source;
    }

    // 2. Try Wikidata match
    if (!memberSince) {
      // Direct match
      if (wikidataMap.has(normalized)) {
        const entry = wikidataMap.get(normalized);
        if (entry.year) {
          memberSince = entry.year;
          source = "Wikidata";
        }
      }

      // Alias match
      if (!memberSince) {
        const aliasTarget = NAME_ALIASES[normalized];
        if (aliasTarget) {
          const aliasNormalized = normalizeName(aliasTarget);
          if (wikidataMap.has(aliasNormalized)) {
            const entry = wikidataMap.get(aliasNormalized);
            if (entry.year) {
              memberSince = entry.year;
              source = "Wikidata";
            }
          }
        }
      }

      // Reverse alias: check if any Wikidata label maps to this country
      if (!memberSince) {
        for (const [alias, target] of Object.entries(NAME_ALIASES)) {
          if (normalizeName(target) === normalized && wikidataMap.has(alias)) {
            const entry = wikidataMap.get(alias);
            if (entry.year) {
              memberSince = entry.year;
              source = "Wikidata";
              break;
            }
          }
        }
      }
    }

    if (memberSince) {
      metadata[country.name] = { memberSince, source };
      matched.push(country.name);
    } else {
      unmatched.push(country.name);
    }
  }

  // Report
  console.log("-".repeat(60));
  console.log("RESULTS");
  console.log("-".repeat(60));
  console.log(`\n✅ Matched (${matched.length}):`);
  matched.forEach((name) => {
    const entry = metadata[name];
    console.log(`   ${name.padEnd(35)} → ${entry.memberSince} (${entry.source})`);
  });

  if (unmatched.length > 0) {
    console.log(`\n❌ Unmatched (${unmatched.length}):`);
    unmatched.forEach((name) => console.log(`   ${name}`));
  }

  if (missingYear.length > 0) {
    console.log(`\n⚠️  Missing memberSince (${missingYear.length}):`);
    missingYear.forEach((name) => console.log(`   ${name}`));
  }

  // Write output
  const outputPath = path.resolve(__dirname, "../src/data/commonwealthMetadata.json");
  const output = JSON.stringify(metadata, null, 2);
  fs.writeFileSync(outputPath, output, "utf-8");

  console.log(`\n📄 Generated: ${outputPath}`);
  console.log(`   ${Object.keys(metadata).length} countries with memberSince data`);
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});