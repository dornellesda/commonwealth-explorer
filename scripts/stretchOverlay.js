import fs from 'fs/promises';

async function main() {
  let mapLibre = await fs.readFile('src/components/MapLibreMap.jsx', 'utf-8');
  
  mapLibre = mapLibre.replace(
    /coordinates=\{\[\s*\[-180, 85\],\s*\[180, 85\],\s*\[180, -85\],\s*\[-180, -85\]\s*\]\}/g,
    `coordinates={[
            [-180, 90],
            [180, 90],
            [180, -90],
            [-180, -90]
          ]}`
  );
  
  await fs.writeFile('src/components/MapLibreMap.jsx', mapLibre, 'utf-8');
  console.log("Stretched overlay");
}

main();
