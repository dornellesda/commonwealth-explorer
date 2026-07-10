import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/components/MapLibreMap.jsx', 'utf-8');

  // Replace {geojson && ( <Source id="countries" ... > </Source> )}
  // with just <Source id="countries" ... > </Source>
  const oldBlock = `        {geojson && (
          <Source id="countries" type="geojson" data={geojson}>
            <Layer {...fillStyle} />
            <Layer {...lineStyle} />
          </Source>
        )}`;

  const newBlock = `        <Source id="countries" type="geojson" data={geojson}>
          <Layer {...fillStyle} />
          <Layer {...lineStyle} />
        </Source>`;

  content = content.replace(oldBlock, newBlock);

  await fs.writeFile('src/components/MapLibreMap.jsx', content);
  console.log('Removed conditional geojson check around Source');
}
main();
