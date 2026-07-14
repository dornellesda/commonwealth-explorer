import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchFamilySearchForCountry } from "./extractRealFamilySearchData.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.resolve(__dirname, "../src/data/country_data.json");
const concurrency = 3;
const data = JSON.parse(await readFile(dataPath, "utf8"));
const countryNames = Object.keys(data);
const startIndex = Number.parseInt(process.argv[2] || "0", 10);
const countryLimit = Number.parseInt(process.argv[3] || String(countryNames.length), 10);
const countriesToRefresh = countryNames.slice(startIndex, startIndex + countryLimit);
const results = [];

for (let index = 0; index < countriesToRefresh.length; index += concurrency) {
  const batch = countriesToRefresh.slice(index, index + concurrency);
  results.push(...await Promise.all(batch.map(async (countryName) => ({
    countryName,
    collections: await fetchFamilySearchForCountry(countryName),
  }))));
}

const updatedCountries = [];
const unavailableCountries = [];
for (const { countryName, collections } of results) {
  if (!collections?.length) {
    unavailableCountries.push(countryName);
    continue;
  }
  data[countryName].familySearch = collections;
  updatedCountries.push(countryName);
}

const serializedData = JSON.stringify(data, null, 2).replace(/[\u007f-\uffff]/g, (character) =>
  `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`
);
await writeFile(dataPath, serializedData);
console.log(`Updated ${updatedCountries.length} countries from FamilySearch location pages.`);
if (unavailableCountries.length) {
  console.warn(`Kept existing data for unavailable countries: ${unavailableCountries.join(", ")}`);
}
