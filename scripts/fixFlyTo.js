import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/AppNew.jsx', 'utf-8');

  // Replace mapRef.current.flyTo(center, zoom, { duration: X }) with MapLibre style
  content = content.replace(/mapRef\.current\.flyTo\(ATTRACT_MODE_VIEW\.center,\s*ATTRACT_MODE_VIEW\.zoom,\s*\{[\s\S]*?duration:\s*(\d+(\.\d+)?),[\s\S]*?\}\);/g, 
    "mapRef.current?.getMap()?.flyTo({ center: [ATTRACT_MODE_VIEW.center[1], ATTRACT_MODE_VIEW.center[0]], zoom: ATTRACT_MODE_VIEW.zoom, duration: $1 * 1000 });");

  content = content.replace(/mapRef\.current\.flyTo\(COMMONWEALTH_VIEW\.center,\s*COMMONWEALTH_VIEW\.zoom,\s*\{[\s\S]*?duration:\s*(\d+(\.\d+)?),[\s\S]*?\}\);/g, 
    "mapRef.current?.getMap()?.flyTo({ center: [COMMONWEALTH_VIEW.center[1], COMMONWEALTH_VIEW.center[0]], zoom: COMMONWEALTH_VIEW.zoom, duration: $1 * 1000 });");

  // Inside flyToCountry
  content = content.replace(/map\.flyTo\(getPanelAwareCenter\((.*?),\s*(.*?)\),\s*(.*?),\s*\{[\s\S]*?duration:\s*(\d+(\.\d+)?),[\s\S]*?\}\);/g,
    "map?.getMap()?.flyTo({ center: [$1[1], $1[0]], zoom: $3, duration: $4 * 1000 });");

  content = content.replace(/map\.flyToBounds\((.*?),\s*\{[\s\S]*?paddingBottomRight:\s*\[(.*?),\s*(.*?)\][\s\S]*?duration:\s*(\d+(\.\d+)?),[\s\S]*?\}\);/g,
    "map?.getMap()?.fitBounds($1, { padding: { bottom: $3, right: $2 }, duration: $4 * 1000 });");

  content = content.replace(/map\.setView\(/g, "map?.getMap()?.flyTo({ center: [COMMONWEALTH_VIEW.center[1], COMMONWEALTH_VIEW.center[0]], zoom: COMMONWEALTH_VIEW.zoom, duration: 1500 }); //");

  await fs.writeFile('src/AppNew.jsx', content);
  console.log('Fixed flyTo in AppNew.jsx!');
}
main();
