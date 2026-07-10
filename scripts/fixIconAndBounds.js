import fs from 'fs/promises';

async function main() {
  // 1. Fix AppNew.jsx Recentre Icon
  let appNew = await fs.readFile('src/AppNew.jsx', 'utf-8');
  
  const oldSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>`;
                
  const newSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="2" y1="12" x2="6" y2="12"></line>
                  <line x1="18" y1="12" x2="22" y2="12"></line>
                  <line x1="12" y1="2" x2="12" y2="6"></line>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <circle cx="12" cy="12" r="6"></circle>
                </svg>`;
                
  appNew = appNew.replace(oldSvg, newSvg);
  await fs.writeFile('src/AppNew.jsx', appNew, 'utf-8');

  // 2. Fix MapLibreMap.jsx Bounds
  let mapLibre = await fs.readFile('src/components/MapLibreMap.jsx', 'utf-8');
  
  mapLibre = mapLibre.replace(
    /renderWorldCopies=\{false\}/,
    `renderWorldCopies={false}\n        maxBounds={[[-250, -65], [250, 85]]}`
  );
  
  await fs.writeFile('src/components/MapLibreMap.jsx', mapLibre, 'utf-8');
  console.log("Done");
}

main();
