import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/components/MapLibreMap.jsx', 'utf-8');

  // Change function declaration to forwardRef
  content = content.replace(
    'export default function MapLibreMap({',
    'const MapLibreMap = React.forwardRef(({',
  );

  // We need to add the closing forwarding ref bracket before export default
  content = content.replace(
    '\n  );\n}',
    '\n  );\n});\n\nexport default MapLibreMap;'
  );

  // Remember to pass the ref argument in forwardRef
  content = content.replace(
    'const MapLibreMap = React.forwardRef(({',
    'const MapLibreMap = React.forwardRef(({ selectedCountry, activatedCountryName, isPanelOpen, isAttractMode, hoveredCountry, onCountrySelect, onCountryHover }, ref) => {'
  );

  // Remove the old destructured arguments list
  content = content.replace(
    `  selectedCountry,
  activatedCountryName,
  isPanelOpen,
  isAttractMode,
  hoveredCountry,
  onCountrySelect,
  onCountryHover,
}) {`,
    ''
  );

  // Inject useImperativeHandle inside the component
  const targetStr = 'const [geojson, setGeojson] = useState(null);';
  const injectStr = `\n  React.useImperativeHandle(ref, () => ({
    getMap: () => mapRef.current?.getMap(),
    stop: () => mapRef.current?.getMap()?.stop(),
    invalidateSize: () => mapRef.current?.getMap()?.resize(),
    getZoom: () => mapRef.current?.getMap()?.getZoom(),
    setView: (center, zoom) => mapRef.current?.getMap()?.jumpTo({ center: [center[1], center[0]], zoom }),
    getSize: () => {
      const rawMap = mapRef.current?.getMap();
      return {
        x: rawMap?.getContainer()?.clientWidth || window.innerWidth,
        y: rawMap?.getContainer()?.clientHeight || window.innerHeight
      };
    }
  }));\n`;

  content = content.replace(targetStr, targetStr + injectStr);

  await fs.writeFile('src/components/MapLibreMap.jsx', content);
  console.log('Successfully forwarded mapRef');
}
main();
