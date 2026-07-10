import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/AppNew.jsx', 'utf-8');

  const startStr = '{selectedCountry ? (';
  const startIndex = content.indexOf(startStr);
  
  if (startIndex === -1) {
    console.log('Could not find card start');
    process.exit(1);
  }

  const endStr = '{/* TOP BAR - Always visible */}';
  let endIndex = content.indexOf(endStr, startIndex);

  if (endIndex === -1) {
    console.log('Could not find card end');
    process.exit(1);
  }

  // The card block actually ends with `})()}` or `) : null}`
  // Let's find the closing of `{selectedCountry ? ( ... ) : null}`
  endIndex = content.lastIndexOf(': null}', endIndex) + 7;

  const cardJSX = content.substring(startIndex, endIndex);

  const componentTemplate = `import React from 'react';

export default function CountryCard({
  selectedCountry,
  handleClosePanel,
  wikipediaLoading,
  wikipediaOverview,
  familySearchLoading,
  familySearchCollections,
  setLightboxItem,
  lightboxItem
}) {
  return (
    <>
      ` + cardJSX + `
    </>
  );
}
`;

  await fs.writeFile('src/components/Cards/CountryCard.jsx', componentTemplate);
  
  const replacement = `
        <CountryCard 
          selectedCountry={selectedCountry}
          handleClosePanel={handleClosePanel}
          wikipediaLoading={wikipediaLoading}
          wikipediaOverview={wikipediaOverview}
          familySearchLoading={familySearchLoading}
          familySearchCollections={familySearchCollections}
          setLightboxItem={setLightboxItem}
          lightboxItem={lightboxItem}
        />
        `;

  let newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  
  const importStr = "import CountryCard from './components/Cards/CountryCard';\n";
  if (!newContent.includes('CountryCard')) {
      newContent = newContent.replace("import UniversalDock", importStr + "import UniversalDock");
  }

  await fs.writeFile('src/AppNew.jsx', newContent);
  console.log('Extracted CountryCard!');
}
main();
