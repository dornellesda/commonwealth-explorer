import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/components/MapLibreMap.jsx', 'utf-8');

  // We change the early return so it renders
  content = content.replace('if (!geojson) return null;', '');

  // We change data={geojson} to data={"https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"}
  content = content.replace(
    '<Source id="countries" type="geojson" data={geojson}>',
    '<Source id="countries" type="geojson" data="https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson">'
  );

  await fs.writeFile('src/components/MapLibreMap.jsx', content);
  console.log('Fixed MapLibreMap');
}
main();
