import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/components/MapLibreMap.jsx', 'utf-8');

  // Find the return statement of MapLibreMap
  const returnStr = "return (\n    <div style={{ width: '100%', height: '100vh'";
  const returnIndex = content.indexOf(returnStr);

  if (returnIndex === -1) {
    console.log("Could not find return statement");
    process.exit(1);
  }

  // Prepend the geojson loading check
  const checkStr = `  if (!geojson) {
    return (
      <div style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 0, background: '#202738', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>
        Loading map...
      </div>
    );
  }\n\n  `;

  content = content.substring(0, returnIndex) + checkStr + content.substring(returnIndex);

  await fs.writeFile('src/components/MapLibreMap.jsx', content);
  console.log('Added geojson check back to MapLibreMap.jsx');
}
main();
