import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/AppNew.jsx', 'utf-8');

  const oldContextValue = `  const contextValue = {
    selectedCountry,
    handleClosePanel,
    wikipediaLoading,
    wikipediaOverview,
    familySearchLoading,
    familySearchCollections,
    setLightboxItem,
    lightboxItem,
    // Add any other state variables you need to pass down
  };`;

  const newContextValue = `  const contextValue = {
    selectedCountry,
    handleClosePanel,
    setLightboxItem,
    lightboxItem,
  };`;

  content = content.replace(oldContextValue, newContextValue);

  await fs.writeFile('src/AppNew.jsx', content);
  console.log('Fixed contextValue');
}
main();
