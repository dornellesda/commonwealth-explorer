import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/components/MapLibreMap.jsx', 'utf-8');
  
  if (!content.includes('VintageMapDecorations')) {
    const importStr = "import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';";
    content = content.replace("import Map, { Source, Layer } from 'react-map-gl/maplibre';", importStr);

    const decorationsJSX = `
        {/* Vintage Map Decorations */}
        <Marker longitude={0} latitude={-60} anchor="center">
          <div style={{ opacity: 0.15, pointerEvents: 'none', filter: 'sepia(1) hue-rotate(-30deg) saturate(2)' }}>
            <img src="/compass-rose.svg" alt="" style={{ width: 120, height: 120 }} onError={(e) => e.target.style.display = 'none'} />
          </div>
        </Marker>
        <Marker longitude={-40} latitude={30} anchor="center">
          <div style={{ opacity: 0.1, pointerEvents: 'none', filter: 'sepia(1) hue-rotate(-30deg)' }}>
            <span style={{ fontSize: '2rem' }}>⛵</span>
          </div>
        </Marker>
        <Marker longitude={60} latitude={-20} anchor="center">
          <div style={{ opacity: 0.1, pointerEvents: 'none', filter: 'sepia(1) hue-rotate(-30deg)' }}>
            <span style={{ fontSize: '2rem' }}>🐋</span>
          </div>
        </Marker>
`;
    
    content = content.replace('</Source>', '</Source>\n' + decorationsJSX);
    await fs.writeFile('src/components/MapLibreMap.jsx', content);
    console.log('Added VintageMapDecorations to MapLibreMap!');
  }
}
main();
