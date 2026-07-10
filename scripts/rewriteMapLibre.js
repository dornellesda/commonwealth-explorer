import fs from 'fs/promises';

async function main() {
  const code = `import React, { useRef, useCallback, useState, useEffect } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import countryData from '../data/country_data.json';

const ATTRACT_MODE_VIEW = {
  center: [25, 22],
  zoom: 2.6
};

const GEOJSON_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson";

// Ported from App.jsx
function normalizeName(str) {
  return String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function MapLibreMap({
  selectedCountry,
  activatedCountryName,
  isPanelOpen,
  isAttractMode,
  hoveredCountry,
  onCountrySelect,
  onCountryHover,
}) {
  const mapRef = useRef(null);
  const [internalHoveredName, setInternalHoveredName] = useState(null);
  const [geojson, setGeojson] = useState(null);

  useEffect(() => {
    async function fetchGeojson() {
      try {
        const response = await fetch(GEOJSON_URL);
        const data = await response.json();
        
        const commonwealthNames = new Set(countryData.countries.map(c => normalizeName(c.name)));
        const nameMap = new Map(countryData.countries.map(c => [normalizeName(c.name), c.name]));
        
        // Add exact 'cwName' to features for easy matching in Mapbox GL expressions
        data.features.forEach(feature => {
          const props = feature.properties;
          const possibleNames = [props.name, props.NAME_EN, props.NAME, props.ADMIN, props.SOVEREIGN, props.ADMIN_EN];
          
          let cwName = null;
          for (const n of possibleNames) {
            const norm = normalizeName(n);
            if (commonwealthNames.has(norm)) {
              cwName = nameMap.get(norm);
              break;
            }
          }
          feature.properties.cwName = cwName || '';
        });
        
        setGeojson(data);
      } catch (err) {
        console.error("Failed to fetch geojson", err);
      }
    }
    fetchGeojson();
  }, []);

  const effectiveHoveredCountry = hoveredCountry || internalHoveredName || '';

  const onHover = useCallback(event => {
    const { features } = event;
    const hoveredFeature = features && features[0];
    
    if (hoveredFeature) {
      const cwName = hoveredFeature.properties.cwName;
      if (cwName) {
        setInternalHoveredName(cwName);
        if (onCountryHover) onCountryHover(cwName);
        return;
      }
    }
    
    setInternalHoveredName(null);
    if (onCountryHover) onCountryHover(null);
  }, [onCountryHover]);

  const onClick = useCallback(event => {
    const { features } = event;
    const clickedFeature = features && features[0];
    if (clickedFeature && clickedFeature.properties.cwName && onCountrySelect) {
      onCountrySelect(clickedFeature.properties.cwName);
    }
  }, [onCountrySelect]);

  const gridFeatures = [];
  for (let lat = -60; lat <= 80; lat += 20) {
    gridFeatures.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[-180, lat], [180, lat]] }});
  }
  for (let lng = -180; lng <= 180; lng += 20) {
    gridFeatures.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[lng, -90], [lng, 90]] }});
  }
  const gridGeojson = { type: 'FeatureCollection', features: gridFeatures };

  // Helper variables for expressions
  const selCountry = selectedCountry?.name || '';
  const actCountry = activatedCountryName || '';

  const fillStyle = {
    id: 'country-fill',
    type: 'fill',
    paint: {
      'fill-color': [
        'case',
        // isActivatedSelected
        ['all', ['==', ['get', 'cwName'], selCountry], ['==', ['get', 'cwName'], actCountry], ['!=', actCountry, '']],
        isPanelOpen ? '#F16458' : '#333536',
        
        // isSelected
        ['all', ['==', ['get', 'cwName'], selCountry], ['!=', selCountry, '']],
        isPanelOpen ? '#F16458' : '#87B940',
        
        // isHovered (only commonwealth can be hovered)
        ['all', ['==', ['get', 'cwName'], effectiveHoveredCountry], ['!=', effectiveHoveredCountry, '']],
        '#F16458',

        // isCommonwealth
        ['!=', ['get', 'cwName'], ''],
        '#87B940',

        // default non-commonwealth
        '#202738'
      ],
      'fill-opacity': [
        'case',
        ['all', ['==', ['get', 'cwName'], selCountry], ['==', ['get', 'cwName'], actCountry], ['!=', actCountry, '']],
        0.75,
        
        ['all', ['==', ['get', 'cwName'], selCountry], ['!=', selCountry, '']],
        0.75,
        
        ['all', ['==', ['get', 'cwName'], effectiveHoveredCountry], ['!=', effectiveHoveredCountry, '']],
        0.65,

        ['!=', ['get', 'cwName'], ''],
        0.35,

        0.35
      ]
    }
  };

  const lineStyle = {
    id: 'country-line',
    type: 'line',
    paint: {
      'line-color': [
        'case',
        // isActivatedSelected
        ['all', ['==', ['get', 'cwName'], selCountry], ['==', ['get', 'cwName'], actCountry], ['!=', actCountry, '']],
        isPanelOpen ? '#F16458' : '#333536',
        
        // isSelected
        ['all', ['==', ['get', 'cwName'], selCountry], ['!=', selCountry, '']],
        isPanelOpen ? '#F16458' : '#97d749',
        
        // isHovered
        ['all', ['==', ['get', 'cwName'], effectiveHoveredCountry], ['!=', effectiveHoveredCountry, '']],
        '#F16458',

        // isCommonwealth
        ['!=', ['get', 'cwName'], ''],
        '#97d749',

        // default non-commonwealth
        'rgba(255, 255, 255, 0.2)'
      ],
      'line-width': [
        'case',
        ['all', ['==', ['get', 'cwName'], selCountry], ['==', ['get', 'cwName'], actCountry], ['!=', actCountry, '']],
        1.8,
        
        ['all', ['==', ['get', 'cwName'], selCountry], ['!=', selCountry, '']],
        1.8,
        
        ['all', ['==', ['get', 'cwName'], effectiveHoveredCountry], ['!=', effectiveHoveredCountry, '']],
        1.5,

        ['!=', ['get', 'cwName'], ''],
        1.0,

        1.0
      ]
    }
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 0, background: '#202738' }}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: ATTRACT_MODE_VIEW.center[0],
          latitude: ATTRACT_MODE_VIEW.center[1],
          zoom: ATTRACT_MODE_VIEW.zoom
        }}
        interactiveLayerIds={['country-fill']}
        onMouseMove={onHover}
        onClick={onClick}
        renderWorldCopies={false}
      >
        <Source 
          id="map-art-overlay" 
          type="image" 
          url="https://www.davidrumsey.com/rumsey/Size4/D0132/1324006.jpg" 
          coordinates={[
            [-180, 85],
            [180, 85],
            [180, -85],
            [-180, -85]
          ]}
        >
          <Layer 
            id="map-art-layer" 
            type="raster" 
            paint={{ 'raster-opacity': 0.28, 'raster-fade-duration': 0 }} 
            beforeId="country-fill"
          />
        </Source>

        <Marker longitude={-40} latitude={30} anchor="center">
          <div style={{ opacity: 0.1, pointerEvents: 'none', filter: 'sepia(1) hue-rotate(-30deg)' }}>
            <span style={{ fontSize: '2rem' }}>⛵</span>
          </div>
        </Marker>
        <Marker longitude={60} latitude={-20} anchor="center">
          <div style={{ opacity: 0.1, pointerEvents: 'none', filter: 'sepia(1) hue-rotate(-30deg)' }}>
            <span style={{ fontSize: '2rem' }}>🐋</span>
          </div>
        </Marker>

        {geojson && (
          <Source id="countries" type="geojson" data={geojson}>
            <Layer {...fillStyle} />
            <Layer {...lineStyle} />
          </Source>
        )}
      
        {/* Latitude/Longitude Grid */}
        <Source id="grid" type="geojson" data={gridGeojson}>
          <Layer 
            id="grid-line" 
            type="line" 
            paint={{ 'line-color': '#333536', 'line-width': 0.5, 'line-opacity': 0.1 }} 
            beforeId="country-fill"
          />
        </Source>

        {/* Vintage Map Decorations */}
        <Marker longitude={170} latitude={-70} anchor="center">
          <div style={{ opacity: 0.15, pointerEvents: 'none' }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="55" fill="none" stroke="#333536" strokeWidth="1"/>
              <circle cx="60" cy="60" r="45" fill="none" stroke="#333536" strokeWidth="0.5"/>
              <path d="M60 10 L63 55 L60 60 L57 55 Z" fill="#333536"/>
              <path d="M60 110 L63 65 L60 60 L57 65 Z" fill="#333536" fillOpacity="0.5"/>
              <path d="M10 60 L55 57 L60 60 L55 63 Z" fill="#333536" fillOpacity="0.5"/>
              <path d="M110 60 L65 57 L60 60 L65 63 Z" fill="#333536" fillOpacity="0.5"/>
              <text x="60" y="8" textAnchor="middle" fontSize="8" fill="#333536" fontFamily="serif">N</text>
              <text x="60" y="116" textAnchor="middle" fontSize="8" fill="#333536" fontFamily="serif">S</text>
              <text x="6" y="63" textAnchor="middle" fontSize="8" fill="#333536" fontFamily="serif">W</text>
              <text x="114" y="63" textAnchor="middle" fontSize="8" fill="#333536" fontFamily="serif">E</text>
            </svg>
          </div>
        </Marker>
      </Map>
    </div>
  );
}
`;

  await fs.writeFile('src/components/MapLibreMap.jsx', code);
  console.log('Rewrote MapLibreMap.jsx');
}

main();
