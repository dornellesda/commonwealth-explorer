import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/components/MapLibreMap.jsx', 'utf-8');

  // Replace import
  content = content.replace(
    "import countryData from '../data/country_data.json';",
    "import countries from '../data/countries.json';"
  );

  // Replace references
  content = content.replaceAll("countryData.countries", "countries");

  await fs.writeFile('src/components/MapLibreMap.jsx', content);
  console.log('Fixed MapLibreMap imports');
}
main();
