import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/components/MapLibreMap.jsx', 'utf-8');

  // Replace Map import with MapGL to avoid shadowing ES6 Map
  content = content.replace(
    "import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';",
    "import MapGL, { Source, Layer, Marker } from 'react-map-gl/maplibre';"
  );

  // Replace component tag usage
  content = content.replace("<Map", "<MapGL");
  content = content.replace("</Map>", "</MapGL>");

  await fs.writeFile('src/components/MapLibreMap.jsx', content);
  console.log('Fixed Map shadowing JS Map class');
}
main();
