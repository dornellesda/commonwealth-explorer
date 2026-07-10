import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/components/MapLibreMap.jsx', 'utf-8');
  
  const mapOverlaySource = `
        <Source 
          id="map-art-overlay" 
          type="image" 
          url="https://www.davidrumsey.com/rumsey/Size4/D0132/1324006.jpg" 
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
        </Source>
`;
  
  content = content.replace('<Source id="countries"', mapOverlaySource + '\n        <Source id="countries"');
  
  await fs.writeFile('src/components/MapLibreMap.jsx', content);
  console.log('Added MapArtOverlay to MapLibreMap!');
}
main();
