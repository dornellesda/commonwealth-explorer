import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/AppNew.jsx', 'utf-8');

  // Replace signature and add lookup
  content = content.replace(
    /const handleSelectCountry = \(country, options = \{\}\) => \{/,
    `const handleSelectCountry = (countryOrName, options = {}) => {
    const countryObj = typeof countryOrName === "string"
      ? countries.find((c) => c.name === countryOrName)
      : countryOrName;

    if (!countryObj) {
      console.error("Country not found: ", countryOrName);
      return;
    }
    const country = countryObj;
`
  );

  await fs.writeFile('src/AppNew.jsx', content, 'utf-8');
  console.log("Fixed handleSelectCountry");
}
main();
