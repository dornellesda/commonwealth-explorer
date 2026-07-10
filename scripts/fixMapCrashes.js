import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/components/MapLibreMap.jsx', 'utf-8');

  // Fix GeoJSON fetch logic to use fallback urls just like App.jsx
  const oldFetch = `const response = await fetch(GEOJSON_URL);
        const data = await response.json();`;

  const newFetch = `const fallbackUrls = [
          "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_admin_0_countries.geojson",
          "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"
        ];
        let data = null;
        for (const url of fallbackUrls) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              data = await res.json();
              break;
            }
          } catch (e) {}
        }
        if (!data) throw new Error("All geojson fetches failed");`;

  content = content.replace(oldFetch, newFetch);

  // Fix the image URL which was causing CORS crash
  const oldImageUrl = 'https://www.davidrumsey.com/rumsey/Size4/D0132/1324006.jpg';
  const newImageUrl = 'https://plus.unsplash.com/premium_photo-1779463020508-7cd254b1d37f?auto=format&fit=crop&w=2400&q=80';
  content = content.replace(oldImageUrl, newImageUrl);

  await fs.writeFile('src/components/MapLibreMap.jsx', content);
  console.log('Fixed MapLibreMap crashes');
}

main();
