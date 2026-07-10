import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/AppNew.jsx', 'utf-8');

  const oldBlock = `<MapLibreMap 
          onCountrySelect={handleSelectCountry}
          onCountryHover={handleCountryHover}
          selectedCountry={selectedCountry}
          activatedCountryName={activatedCountryName}
          isPanelOpen={isPanelOpen}
          isAttractMode={isAttractMode}
          hoveredCountry={hoveredCountry}
        />`;

  const newBlock = `<MapLibreMap 
          ref={mapRef}
          onCountrySelect={handleSelectCountry}
          onCountryHover={handleCountryHover}
          selectedCountry={selectedCountry}
          activatedCountryName={activatedCountryName}
          isPanelOpen={isPanelOpen}
          isAttractMode={isAttractMode}
          hoveredCountry={hoveredCountry}
        />`;

  content = content.replace(oldBlock, newBlock);
  await fs.writeFile('src/AppNew.jsx', content);
  console.log('Successfully wired mapRef to MapLibreMap');
}
main();
