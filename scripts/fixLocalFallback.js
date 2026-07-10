import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/components/MapLibreMap.jsx', 'utf-8');

  // Add the local fallback URL to the list
  const oldUrls = `        const fallbackUrls = [
          "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_admin_0_countries.geojson",
          "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"
        ];`;

  const newUrls = `        const fallbackUrls = [
          "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_admin_0_countries.geojson",
          "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson",
          "/data/countries.geojson"
        ];`;

  content = content.replace(oldUrls, newUrls);

  await fs.writeFile('src/components/MapLibreMap.jsx', content);
  console.log('Added local fallback URL');
}
main();
