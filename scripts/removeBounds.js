import fs from 'fs/promises';

async function main() {
  let mapLibre = await fs.readFile('src/components/MapLibreMap.jsx', 'utf-8');
  
  mapLibre = mapLibre.replace(
    /renderWorldCopies=\{false\}\n\s*maxBounds=\{\[\[-250, -65\], \[250, 85\]\]\}/,
    `renderWorldCopies={false}`
  );
  
  await fs.writeFile('src/components/MapLibreMap.jsx', mapLibre, 'utf-8');
  console.log("Removed maxBounds");
}

main();
