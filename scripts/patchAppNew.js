import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/AppNew.jsx', 'utf-8');

  // Add import
  const importStr = "import { GeoJSON, MapContainer, useMap } from \"react-leaflet\";";
  content = content.replace(importStr, `${importStr}\nimport MapLibreMap from './components/MapLibreMap';`);

  // Replace MapContainer
  const startStr = '<MapContainer';
  const endStr = '</MapContainer>';
  const startIndex = content.indexOf(startStr);
  const endIndex = content.indexOf(endStr, startIndex) + endStr.length;

  if (startIndex === -1 || endIndex === -1) {
    console.log('Failed to find MapContainer');
    process.exit(1);
  }

  const replacement = `<MapLibreMap 
          geojson={geojson} 
          onCountrySelect={handleSelectCountry}
          onCountryHover={handleCountryHover}
          isIdleAttractMode={isIdleAttractMode}
        />`;

  const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  await fs.writeFile('src/AppNew.jsx', newContent);
  console.log('Patched AppNew.jsx!');
}
main();
