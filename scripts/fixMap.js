import fs from 'fs/promises';

async function main() {
  let appNew = await fs.readFile('src/AppNew.jsx', 'utf-8');
  
  // Fix flyToCountry
  appNew = appNew.replace(
    /const flyToCountry = \(country\) => \{[\s\S]*?const fallbackZoom = 2\.6;\n\s*map\?\.getMap\(\)\?\.flyTo\(\{ center: \[country\.lng, country\.lat\], zoom: fallbackZoom, duration: 1\.6 \* 1000 \}\);\n\s*\};/,
    `const flyToCountry = (country) => {
    const map = mapRef?.current;
    if (!map) {
      return;
    }

    const mapWidth = map.getSize().x || window.innerWidth || 1280;
    const panelWidth = Math.min(920, mapWidth * 0.95);
    const rightPadding = Math.round(panelWidth + 72);

    const override = countryZoomOverrides[country.name];
    if (override) {
      map?.getMap()?.flyTo({ center: [override.center[1], override.center[0]], zoom: override.zoom, padding: { right: rightPadding }, duration: 1.6 * 1000 });
      return;
    }

    // Default flyTo using country coordinates with padding for the side panel
    map?.getMap()?.flyTo({
      center: [country.lng, country.lat],
      zoom: 4.8,
      padding: { right: rightPadding },
      duration: 1.6 * 1000
    });
  };`
  );

  // Fix handleReset transition
  appNew = appNew.replace(
    /mapRef\.current\.invalidateSize\(\);\n\s*const currentZoom = mapRef\.current\.getZoom\(\);\n\s*if \(currentZoom <= COMMONWEALTH_VIEW\.zoom \+ 0\.5\) \{[\s\S]*?\} else \{\n\s*mapRef\.current\?\.getMap\(\)\?\.flyTo\(\{ center: \[COMMONWEALTH_VIEW\.center\[1\], COMMONWEALTH_VIEW\.center\[0\]\], zoom: COMMONWEALTH_VIEW\.zoom, duration: 0\.85 \* 1000 \}\);\n\s*\}/,
    `mapRef.current.invalidateSize();
        mapRef.current?.getMap()?.flyTo({
          center: [COMMONWEALTH_VIEW.center[1], COMMONWEALTH_VIEW.center[0]],
          zoom: COMMONWEALTH_VIEW.zoom,
          duration: 1.2 * 1000,
          padding: { right: 0, bottom: 0, left: 0, top: 0 }
        });`
  );

  // Pass onMapClick to MapLibreMap
  appNew = appNew.replace(
    /onCountrySelect=\{handleSelectCountry\}/,
    `onCountrySelect={handleSelectCountry}\n          onMapClick={() => handleReset()}`
  );

  await fs.writeFile('src/AppNew.jsx', appNew, 'utf-8');

  // Modify MapLibreMap.jsx
  let mapLibre = await fs.readFile('src/components/MapLibreMap.jsx', 'utf-8');
  mapLibre = mapLibre.replace(
    /const MapLibreMap = React\.forwardRef\(\(\{\s*selectedCountry,\s*activatedCountryName,\s*isPanelOpen,\s*isAttractMode,\s*hoveredCountry,\s*onCountrySelect,\s*onCountryHover\s*\}, ref\) => \{/,
    `const MapLibreMap = React.forwardRef(({ selectedCountry, activatedCountryName, isPanelOpen, isAttractMode, hoveredCountry, onCountrySelect, onCountryHover, onMapClick }, ref) => {`
  );

  mapLibre = mapLibre.replace(
    /const onClick = useCallback\(event => \{\n\s*const \{ features \} = event;\n\s*const clickedFeature = features && features\[0\];\n\s*if \(clickedFeature && clickedFeature\.properties\.cwName && onCountrySelect\) \{\n\s*onCountrySelect\(clickedFeature\.properties\.cwName\);\n\s*\}\n\s*\}, \[onCountrySelect\]\);/,
    `const onClick = useCallback(event => {
    const { features } = event;
    const clickedFeature = features && features[0];
    if (clickedFeature && clickedFeature.properties.cwName && onCountrySelect) {
      onCountrySelect(clickedFeature.properties.cwName);
    } else if (onMapClick) {
      onMapClick();
    }
  }, [onCountrySelect, onMapClick]);`
  );
  
  await fs.writeFile('src/components/MapLibreMap.jsx', mapLibre, 'utf-8');

  console.log("Fixed map logic");
}

main();
