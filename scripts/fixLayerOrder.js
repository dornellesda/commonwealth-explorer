import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/components/MapLibreMap.jsx', 'utf-8');

  // We want to move the "countries" source block above the "map-art-overlay" source block.
  
  const artOverlayBlock = `        <Source 
          id="map-art-overlay" 
          type="image" 
          url="https://plus.unsplash.com/premium_photo-1779463020508-7cd254b1d37f?auto=format&fit=crop&w=2400&q=80" 
          coordinates={[
            [-180, 85],
            [180, 85],
            [180, -85],
            [-180, -85]
          ]}
        >
          <Layer 
            id="map-art-layer" 
            type="raster" 
            paint={{ 'raster-opacity': 0.28, 'raster-fade-duration': 0 }} 
            beforeId="country-fill"
          />
        </Source>`;

  const countriesBlock = `        {geojson && (
          <Source id="countries" type="geojson" data={geojson}>
            <Layer {...fillStyle} />
            <Layer {...lineStyle} />
          </Source>
        )}`;

  // Let's remove countriesBlock and place it before artOverlayBlock
  content = content.replace(countriesBlock, '');
  content = content.replace(artOverlayBlock, countriesBlock + '\n\n' + artOverlayBlock);

  await fs.writeFile('src/components/MapLibreMap.jsx', content);
  console.log('Fixed layer order inside MapLibreMap.jsx');
}
main();
