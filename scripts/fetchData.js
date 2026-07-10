import fs from 'fs/promises';

const COMMONWEALTH_COUNTRIES = [
  "Antigua and Barbuda", "Australia", "Bahamas", "Bangladesh", "Barbados",
  "Belize", "Botswana", "Brunei", "Cameroon", "Canada", "Cyprus", "Dominica",
  "Eswatini", "Fiji", "Gabon", "Gambia", "Ghana", "Grenada", "Guyana", "India",
  "Jamaica", "Kenya", "Kiribati", "Lesotho", "Malawi", "Malaysia", "Maldives",
  "Malta", "Mauritius", "Mozambique", "Namibia", "Nauru", "New Zealand",
  "Nigeria", "Pakistan", "Papua New Guinea", "Rwanda", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "Seychelles",
  "Sierra Leone", "Singapore", "Solomon Islands", "South Africa", "Sri Lanka",
  "Togo", "Tonga", "Trinidad and Tobago", "Tuvalu", "Uganda", "United Kingdom",
  "United Republic of Tanzania", "Vanuatu", "Zambia"
];

const headers = {
  'User-Agent': 'CommonwealthExplorerBot/1.0 (contact@example.com)'
};

async function fetchWikiData(countryName) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(countryName)}&utf8=&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { headers });
    const searchData = await searchRes.json();
    const pageTitle = searchData.query?.search?.[0]?.title || countryName;

    const summaryUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`;
    const summaryRes = await fetch(summaryUrl, { headers });
    const summaryData = await summaryRes.json();
    const pages = summaryData.query?.pages;
    const pageId = Object.keys(pages)[0];
    let description = pages[pageId]?.extract || "No description available.";
    if (description.length > 500) {
      description = description.substring(0, 500).replace(/\s+\S*$/, "") + "...";
    }

    return {
      description
    };
  } catch (e) {
    return { description: "Information temporarily unavailable." };
  }
}

async function main() {
  const result = {};
  for (let i = 0; i < COMMONWEALTH_COUNTRIES.length; i++) {
    const country = COMMONWEALTH_COUNTRIES[i];
    console.log(`[${i+1}/56] Fetching ${country}...`);
    result[country] = {
      wiki: await fetchWikiData(country)
    };
    await new Promise(r => setTimeout(r, 1500));
  }
  await fs.writeFile('src/data/country_data.json', JSON.stringify(result, null, 2));
  console.log('Saved to src/data/country_data.json!');
}

main();
