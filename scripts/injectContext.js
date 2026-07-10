import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/AppNew.jsx', 'utf-8');

  // Add the import
  const importStr = "import AppContext from './context/AppContext';\n";
  if (!content.includes('AppContext')) {
      content = content.replace("import UniversalDock", importStr + "import UniversalDock");
  }

  // Find the start of the return block of the App function
  // We need to wrap the outermost div with AppContext.Provider
  const returnStr = 'return (\n    <div';
  const returnIndex = content.indexOf(returnStr);
  
  if (returnIndex === -1) {
    console.log('Could not find return statement');
    process.exit(1);
  }

  // We are going to construct a giant value object containing the state we need for CountryCard
  const contextValue = `
  const contextValue = {
    selectedCountry,
    handleClosePanel,
    wikipediaLoading,
    wikipediaOverview,
    familySearchLoading,
    familySearchCollections,
    setLightboxItem,
    lightboxItem,
    // Add any other state variables you need to pass down
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div`;

  content = content.replace(returnStr, contextValue);

  // Now find the final closing div of the return block
  // It's the very last </div> before export default App;
  const endDivStr = '    </div>\n  );\n}';
  const newEndDivStr = '      </div>\n    </AppContext.Provider>\n  );\n}';
  
  if (content.includes(endDivStr)) {
      content = content.replace(endDivStr, newEndDivStr);
  }

  await fs.writeFile('src/AppNew.jsx', content);
  console.log('Injected AppContext.Provider into AppNew.jsx!');
}
main();
