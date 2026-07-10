import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/App.jsx', 'utf-8');

  const functionStartStr = '  const loadFamilySearchCollectionsForCountry = async (countryName) => {';
  const startIndex = content.indexOf(functionStartStr);

  const nextFunctionStr = '  useEffect(() => {';
  const endIndex = content.indexOf(nextFunctionStr, startIndex);

  if (startIndex === -1 || endIndex === -1) {
    console.log('Failed to find bounds');
    process.exit(1);
  }

  const replacement = `  const loadFamilySearchCollectionsForCountry = async (countryName) => {
    const cacheKey = normalizeName(countryName);

    // Return instantly from static bundle
    const bundledData = countryDataBundle[countryName]?.familySearch;
    if (bundledData && Array.isArray(bundledData) && bundledData.length > 0) {
      familySearchCollectionsCacheRef.current[cacheKey] = bundledData;
      return bundledData;
    }
    
    // Fallback cache logic if bundled data isn't there for some reason
    if (Object.prototype.hasOwnProperty.call(familySearchCollectionsCacheRef.current, cacheKey)) {
      return familySearchCollectionsCacheRef.current[cacheKey];
    }
    
    familySearchCollectionsCacheRef.current[cacheKey] = [];
    return [];
  };

`;

  const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  await fs.writeFile('src/App.jsx', newContent);
  console.log('Patched App.jsx!');
}
main();
