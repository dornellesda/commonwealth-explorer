import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/components/MapLibreMap.jsx', 'utf-8');

  // Add grid GeoJSON calculation
  const gridCalculation = `
  const gridFeatures = [];
  for (let lat = -60; lat <= 80; lat += 20) {
    gridFeatures.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[-180, lat], [180, lat]] }});
  }
  for (let lng = -180; lng <= 180; lng += 20) {
    gridFeatures.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[lng, -90], [lng, 90]] }});
  }
  const gridGeojson = { type: 'FeatureCollection', features: gridFeatures };
`;

  if (!content.includes('gridFeatures')) {
    content = content.replace('const fillStyle = {', gridCalculation + '\n  const fillStyle = {');
  }

  const gridSourceLayer = `
        {/* Latitude/Longitude Grid */}
        <Source id="grid" type="geojson" data={gridGeojson}>
          <Layer 
            id="grid-line" 
            type="line" 
            paint={{ 'line-color': '#333536', 'line-width': 0.5, 'line-opacity': 0.1 }} 
            beforeId="country-fill"
          />
        </Source>
`;
  
  if (!content.includes('id="grid"')) {
    content = content.replace('</Map>', gridSourceLayer + '\n      </Map>');
  }

  // Add compass rose properly
  const compassJSX = `
        {/* Vintage Map Decorations */}
        <Marker longitude={170} latitude={-70} anchor="center">
          <div style={{ opacity: 0.15, pointerEvents: 'none' }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="55" fill="none" stroke="#333536" strokeWidth="1"/>
              <circle cx="60" cy="60" r="45" fill="none" stroke="#333536" strokeWidth="0.5"/>
              <path d="M60 10 L63 55 L60 60 L57 55 Z" fill="#333536"/>
              <path d="M60 110 L63 65 L60 60 L57 65 Z" fill="#333536" fillOpacity="0.5"/>
              <path d="M10 60 L55 57 L60 60 L55 63 Z" fill="#333536" fillOpacity="0.5"/>
              <path d="M110 60 L65 57 L60 60 L65 63 Z" fill="#333536" fillOpacity="0.5"/>
              <text x="60" y="8" textAnchor="middle" fontSize="8" fill="#333536" fontFamily="serif">N</text>
              <text x="60" y="116" textAnchor="middle" fontSize="8" fill="#333536" fontFamily="serif">S</text>
              <text x="6" y="63" textAnchor="middle" fontSize="8" fill="#333536" fontFamily="serif">W</text>
              <text x="114" y="63" textAnchor="middle" fontSize="8" fill="#333536" fontFamily="serif">E</text>
            </svg>
          </div>
        </Marker>
`;

  // Remove the old placeholder markers
  content = content.replace(/\{\/\* Vintage Map Decorations \*\/\}(.|\n)*?<\/Marker>\n/g, '');
  
  if (!content.includes('Vintage Map Decorations')) {
    content = content.replace('</Map>', compassJSX + '\n      </Map>');
  }

  await fs.writeFile('src/components/MapLibreMap.jsx', content);
  console.log('Grid and compass updated!');
}
main();
