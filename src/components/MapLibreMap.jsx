import React, { useRef, useCallback, useState, useEffect, memo } from 'react';
import MapGL, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import countries from '../data/countries.json';
import ukBoundaries from '../data/uk_boundaries.json';

const ATTRACT_MODE_VIEW = {
  center: [25, 22],
  zoom: 2.6
};

// Ported from App.jsx
function normalizeName(str) {
  return String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

const smallCountries = [
  "Antigua and Barbuda",
  "Barbados",
  "Dominica",
  "Fiji",
  "Grenada",
  "Kiribati",
  "Maldives",
  "Malta",
  "Mauritius",
  "Nauru",
  "St Kitts and Nevis",
  "Saint Lucia",
  "St Vincent and The Grenadines",
  "Samoa",
  "Seychelles",
  "Singapore",
  "Tonga",
  "Tuvalu",
];

const smallCountryData = countries.filter(c => smallCountries.includes(c.name));

// A fully native, image-free cartographic map style
// Ocean: #27c4f4 (signature cyan blue), Unclickable countries: #9c947a (taupe parchment)
const VINTAGE_MAP_STYLE = {
  version: 8,
  name: "Commonwealth Vintage",
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#27c4f4"
      }
    }
  ]
};

const MapLibreMap = React.forwardRef(({ selectedCountry, activatedCountryName, isPanelOpen, isAttractMode, hoveredCountry, onCountrySelect, onCountryHover, onMapClick, onMapDragStart, onMoveEnd }, ref) => {

  const mapRef = useRef(null);
  const [geojson, setGeojson] = useState(null);
  const [internalHoveredName, setInternalHoveredName] = useState(null);
  const [zoomedIntoUK, setZoomedIntoUK] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const isHoveringMarkerRef = useRef(false);
  
  React.useImperativeHandle(ref, () => ({
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
  }));


  useEffect(() => {
    async function fetchGeojson() {
      try {
        const fallbackUrls = [
          "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_admin_0_countries.geojson",
          "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson",
          "/data/countries.geojson"
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
        if (!data) throw new Error("All geojson fetches failed");

        // Tag the single sovereign United Kingdom polygon instead of removing it
        data.features.forEach(feature => {
          const props = feature.properties;
          const isUK = props.name === "United Kingdom" || props.NAME === "United Kingdom" || props.ADMIN === "United Kingdom" || props.SOVEREIGN === "United Kingdom";
          if (isUK) {
            props.isUK = true;
          }
        });

        // Add individual England, Scotland, and Wales polygons, tagged as constituents
        ukBoundaries.features.forEach(f => {
          f.properties.isUKConstituent = true;
        });
        data.features.push(...ukBoundaries.features);
        
        const commonwealthNames = new Set(countries.map(c => normalizeName(c.name)));
        const nameMap = new Map(countries.map(c => [normalizeName(c.name), c.name]));
        
        data.features.forEach(feature => {
          const props = feature.properties;
          if (props.isUK) {
            props.cwName = 'United Kingdom';
            return;
          }
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
    if (isAttractMode || isHoveringMarkerRef.current) return;
    const { features } = event;
    const hoveredFeature = features && features[0];
    
    if (hoveredFeature) {
      const cwName = hoveredFeature.properties.cwName;
      if (cwName) {
        setInternalHoveredName(cwName);
        const originalEvent = event.originalEvent;
        const pos = originalEvent ? { x: originalEvent.clientX, y: originalEvent.clientY } : null;
        if (onCountryHover) onCountryHover(cwName, pos);
        return;
      }
    }
    
    setInternalHoveredName(null);
    if (onCountryHover) onCountryHover(null, null);
  }, [onCountryHover, isAttractMode]);

  const onClick = useCallback(event => {
    if (isAttractMode) {
      return;
    }

    const { features } = event;
    const clickedFeature = features && features[0];
    const clickedCwName = clickedFeature?.properties?.cwName;
    const isConstituent = clickedFeature?.properties?.isUKConstituent;

    // A selected country owns the map interaction until its card is closed.
    if (selectedCountry) {
      // If we are zoomed into the UK and click another UK constituent, switch to it directly
      if (zoomedIntoUK && clickedCwName && isConstituent) {
        onCountrySelect?.(clickedCwName);
        return;
      }
      
      // If we are zoomed into the UK and click outside (e.g. ocean or another country),
      // clear the selection but do not reset the camera to the world view.
      if (zoomedIntoUK) {
        onMapClick?.({ keepZoom: true });
        return;
      }

      // Default behavior: outside click clears selection and zooms out
      onMapClick?.();
      return;
    }

    if (clickedCwName) {
      if (clickedCwName === 'United Kingdom') {
        setZoomedIntoUK(true);
        mapRef.current?.getMap()?.flyTo({ center: [-3.4, 54.5], zoom: 5.5, duration: 1500 });
      } else if (onCountrySelect) {
        onCountrySelect(clickedCwName);
      }
    } else if (onMapClick) {
      onMapClick();
    }
  }, [selectedCountry, onCountrySelect, onMapClick, zoomedIntoUK, isAttractMode]);

  const onZoom = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      const zoom = map.getZoom();
      if (zoom < 4.0 && zoomedIntoUK) {
        setZoomedIntoUK(false);
      }
    }
  }, [zoomedIntoUK]);

  // Latitude/Longitude grid lines
  const gridFeatures = [];
  for (let lat = -80; lat <= 80; lat += 20) {
    gridFeatures.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[-180, lat], [180, lat]] }});
  }
  for (let lng = -180; lng <= 180; lng += 20) {
    gridFeatures.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[lng, -90], [lng, 90]] }});
  }
  const gridGeojson = { type: 'FeatureCollection', features: gridFeatures };

  // Helper variables for expressions
  const selCountry = selectedCountry?.name || '';
  const actCountry = activatedCountryName || '';

  // Non-commonwealth land layer — unclickable countries in #9c947a (elegant taupe parchment)
  const landFillStyle = {
    id: 'land-fill',
    type: 'fill',
    filter: ['==', ['get', 'cwName'], ''],
    paint: {
      'fill-color': '#9c947a',
      'fill-opacity': 0.88,
    }
  };

  // Fine border between non-commonwealth countries
  const landLineStyle = {
    id: 'land-line',
    type: 'line',
    filter: ['==', ['get', 'cwName'], ''],
    paint: {
      'line-color': '#7d755e',
      'line-width': 1.0,
      'line-opacity': 0.75,
    }
  };

  // Refined cartographic coastline/continent definition
  const coastOutlineStyle = {
    id: 'coast-outline',
    type: 'line',
    paint: {
      'line-color': '#5a523d',
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        1, 0.85,
        3, 1.05,
        5, 1.3,
      ],
      'line-opacity': 0.6,
    }
  };

  const fillStyle = {
    id: 'country-fill',
    type: 'fill',
    filter: [
      'all',
      ['!=', ['get', 'cwName'], ''],
      zoomedIntoUK ? ['!=', ['get', 'isUK'], true] : ['!=', ['get', 'isUKConstituent'], true]
    ],
    paint: {
      'fill-color': [
        'case',
        // isActivatedSelected
        ['all', ['==', ['get', 'cwName'], selCountry], ['==', ['get', 'cwName'], actCountry], ['!=', actCountry, '']],
        isPanelOpen ? '#F16458' : '#333536',
        
        // isSelected
        ['all', ['==', ['get', 'cwName'], selCountry], ['!=', selCountry, '']],
        isPanelOpen ? '#F16458' : '#87B940',
        
        // isHovered
        ['all', ['==', ['get', 'cwName'], effectiveHoveredCountry], ['!=', effectiveHoveredCountry, '']],
        '#F16458',

        // isCommonwealth
        '#87B940',
      ],
      'fill-opacity': [
        'case',
        ['all', ['==', ['get', 'cwName'], selCountry], ['==', ['get', 'cwName'], actCountry], ['!=', actCountry, '']],
        0.90,
        
        ['all', ['==', ['get', 'cwName'], selCountry], ['!=', selCountry, '']],
        0.90,
        
        ['all', ['==', ['get', 'cwName'], effectiveHoveredCountry], ['!=', effectiveHoveredCountry, '']],
        0.85,

        0.78,
      ]
    }
  };

  const lineStyle = {
    id: 'country-line',
    type: 'line',
    filter: [
      'all',
      ['!=', ['get', 'cwName'], ''],
      zoomedIntoUK ? ['!=', ['get', 'isUK'], true] : ['!=', ['get', 'isUKConstituent'], true]
    ],
    paint: {
      'line-color': [
        'case',
        ['all', ['==', ['get', 'cwName'], selCountry], ['==', ['get', 'cwName'], actCountry], ['!=', actCountry, '']],
        isPanelOpen ? '#F16458' : '#333536',
        
        ['all', ['==', ['get', 'cwName'], selCountry], ['!=', selCountry, '']],
        isPanelOpen ? '#F16458' : '#a6ed47',
        
        ['all', ['==', ['get', 'cwName'], effectiveHoveredCountry], ['!=', effectiveHoveredCountry, '']],
        '#F16458',

        '#a6ed47',
      ],
      'line-width': [
        'case',
        ['all', ['==', ['get', 'cwName'], selCountry], ['==', ['get', 'cwName'], actCountry], ['!=', actCountry, '']],
        2.0,
        
        ['all', ['==', ['get', 'cwName'], selCountry], ['!=', selCountry, '']],
        2.0,
        
        ['all', ['==', ['get', 'cwName'], effectiveHoveredCountry], ['!=', effectiveHoveredCountry, '']],
        1.8,

        1.4,
      ],
      'line-opacity': [
        'case',
        ['all', ['==', ['get', 'cwName'], selCountry], ['!=', selCountry, '']],
        1,
        ['all', ['==', ['get', 'cwName'], effectiveHoveredCountry], ['!=', effectiveHoveredCountry, '']],
        1,
        0.95,
      ]
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
        background: 'radial-gradient(circle at 35% 25%, #4ed2f7 0%, #27c4f4 54%, #18aedc 100%)',
        overflow: 'hidden',
        opacity: (geojson && mapLoaded) ? 1 : 0,
        transform: (geojson && mapLoaded) ? 'scale(1)' : 'scale(1.025)',
        transition: 'opacity 1200ms cubic-bezier(0.16, 1, 0.3, 1), transform 1400ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <MapGL
        ref={mapRef}
        onLoad={() => setMapLoaded(true)}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
        mapStyle={VINTAGE_MAP_STYLE}
        initialViewState={{
          longitude: ATTRACT_MODE_VIEW.center[0],
          latitude: ATTRACT_MODE_VIEW.center[1],
          zoom: ATTRACT_MODE_VIEW.zoom
        }}
        interactiveLayerIds={isAttractMode ? [] : ['country-fill', 'land-fill']}
        onMouseMove={onHover}
        onClick={onClick}
        onZoomEnd={onZoom}
        onMoveStart={(e) => {
          if (e.originalEvent && onMapDragStart) {
            onMapDragStart();
          }
        }}
        onMoveEnd={(e) => {
          if (e.originalEvent && onMoveEnd) {
            onMoveEnd(e.viewState);
          }
        }}
        renderWorldCopies={false}
      >
        {/* Latitude/Longitude Grid — subtle white cartographic lines on cyan ocean */}
        <Source id="grid" type="geojson" data={gridGeojson}>
          <Layer
            id="grid-line"
            type="line"
            paint={{ 'line-color': '#ffffff', 'line-width': 0.7, 'line-opacity': 0.22 }}
          />
        </Source>

        {/* All countries GeoJSON */}
        <Source id="countries" type="geojson" data={geojson}>
          {/* Non-Commonwealth land mass */}
          <Layer {...landFillStyle} />
          <Layer {...coastOutlineStyle} />
          <Layer {...landLineStyle} />
          {/* Commonwealth countries */}
          <Layer {...fillStyle} />
          <Layer {...lineStyle} />
        </Source>

        {/* Small country markers (island nations too small to appear in 50m GeoJSON) */}
        {smallCountryData.map(c => {
          const cwName = c.name;
          const isSelected = Boolean(cwName === selCountry && selCountry !== '');
          const isActivatedSelected = Boolean(isSelected && actCountry === selCountry && actCountry !== '');
          const isHovered = Boolean(cwName === effectiveHoveredCountry && effectiveHoveredCountry !== '' && !isSelected);
          
          let fillColor = "#87B940";
          let borderColor = "#97d749";
          let opacity = 0.95;
          let fillOpacity = 0.38;
          let weight = 1.0;
          let radius = 8;
          
          if (isActivatedSelected) {
            fillColor = isPanelOpen ? "#F16458" : "#333536";
            borderColor = isPanelOpen ? "#F16458" : "#97d749";
            weight = 1.5;
            fillOpacity = 0.75;
            radius = 11;
          } else if (isSelected) {
            fillColor = isPanelOpen ? "#F16458" : "#87B940";
            borderColor = isPanelOpen ? "#F16458" : "#97d749";
            weight = 1.5;
            fillOpacity = 0.75;
            radius = 11;
          } else if (isHovered) {
            fillColor = "#F16458";
            borderColor = "#F16458";
            weight = 1.5;
            fillOpacity = 0.65;
            radius = 11;
          }

          return (
            <Marker 
              key={c.name} 
              longitude={c.lng} 
              latitude={c.lat} 
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation();
                if (selectedCountry) {
                  onMapClick?.();
                  return;
                }
                if (onCountrySelect) onCountrySelect(c.name);
              }}
            >
              <div 
                onMouseEnter={(e) => {
                  isHoveringMarkerRef.current = true;
                  if (onCountryHover) onCountryHover(c.name, { x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  if (onCountryHover) onCountryHover(c.name, { x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => {
                  isHoveringMarkerRef.current = false;
                  if (onCountryHover) onCountryHover(null, null);
                }}
                style={{
                  width: `${radius}px`, 
                  height: `${radius}px`, 
                  borderRadius: '50%', 
                  backgroundColor: fillColor, 
                  border: `${weight}px solid ${borderColor}`, 
                  opacity: opacity, 
                  boxShadow: `0 0 0 ${fillOpacity * 5}px ${fillColor}44`,
                  cursor: 'pointer',
                  transition: 'all 300ms ease'
                }} 
              />
            </Marker>
          );
        })}

        {/* Vintage compass rose — sepia ink on parchment */}
        <Marker longitude={160} latitude={-55} anchor="center">
          <div style={{ opacity: 0.35, pointerEvents: 'none' }}>
            <svg width="110" height="110" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="55" fill="none" stroke="#5c4e38" strokeWidth="1"/>
              <circle cx="60" cy="60" r="42" fill="none" stroke="#5c4e38" strokeWidth="0.5"/>
              <circle cx="60" cy="60" r="28" fill="none" stroke="#5c4e38" strokeWidth="0.5"/>
              <path d="M60 5 L64 55 L60 60 L56 55 Z" fill="#3d3020"/>
              <path d="M60 115 L64 65 L60 60 L56 65 Z" fill="#7a6e56" fillOpacity="0.8"/>
              <path d="M5 60 L55 56 L60 60 L55 64 Z" fill="#7a6e56" fillOpacity="0.8"/>
              <path d="M115 60 L65 56 L60 60 L65 64 Z" fill="#7a6e56" fillOpacity="0.8"/>
              <path d="M18 18 L55 55 L60 60 L55 55 Z" fill="#7a6e56" fillOpacity="0.4"/>
              <path d="M102 18 L65 55 L60 60 L65 55 Z" fill="#7a6e56" fillOpacity="0.4"/>
              <path d="M18 102 L55 65 L60 60 L55 65 Z" fill="#7a6e56" fillOpacity="0.4"/>
              <path d="M102 102 L65 65 L60 60 L65 65 Z" fill="#7a6e56" fillOpacity="0.4"/>
              <text x="60" y="5" textAnchor="middle" fontSize="9" fill="#3d3020" fontFamily="Georgia, serif" fontWeight="bold">N</text>
              <text x="60" y="119" textAnchor="middle" fontSize="9" fill="#7a6e56" fontFamily="Georgia, serif">S</text>
              <text x="4" y="63" textAnchor="middle" fontSize="9" fill="#7a6e56" fontFamily="Georgia, serif">W</text>
              <text x="116" y="63" textAnchor="middle" fontSize="9" fill="#7a6e56" fontFamily="Georgia, serif">E</text>
            </svg>
          </div>
        </Marker>

        {/* Ocean wave hatching — Atlantic */}
        <Marker longitude={-38} latitude={18} anchor="center">
          <div style={{ opacity: 0.12, pointerEvents: 'none' }}>
            <svg width="340" height="300" viewBox="0 0 340 300">
              {Array.from({ length: 14 }, (_, i) => (
                <path
                  key={i}
                  d={`M0 ${22 * i + 5} Q85 ${22 * i - 5} 170 ${22 * i + 5} Q255 ${22 * i + 15} 340 ${22 * i + 5}`}
                  fill="none"
                  stroke="#5c4e38"
                  strokeWidth="1.2"
                />
              ))}
            </svg>
          </div>
        </Marker>

        {/* Ocean wave hatching — Pacific */}
        <Marker longitude={-160} latitude={10} anchor="center">
          <div style={{ opacity: 0.12, pointerEvents: 'none' }}>
            <svg width="340" height="300" viewBox="0 0 340 300">
              {Array.from({ length: 14 }, (_, i) => (
                <path
                  key={i}
                  d={`M0 ${22 * i + 5} Q85 ${22 * i - 5} 170 ${22 * i + 5} Q255 ${22 * i + 15} 340 ${22 * i + 5}`}
                  fill="none"
                  stroke="#5c4e38"
                  strokeWidth="1.2"
                />
              ))}
            </svg>
          </div>
        </Marker>

        {/* Ocean wave hatching — Indian Ocean */}
        <Marker longitude={75} latitude={-25} anchor="center">
          <div style={{ opacity: 0.10, pointerEvents: 'none' }}>
            <svg width="280" height="240" viewBox="0 0 280 240">
              {Array.from({ length: 11 }, (_, i) => (
                <path
                  key={i}
                  d={`M0 ${22 * i + 5} Q70 ${22 * i - 5} 140 ${22 * i + 5} Q210 ${22 * i + 15} 280 ${22 * i + 5}`}
                  fill="none"
                  stroke="#5c4e38"
                  strokeWidth="1.2"
                />
              ))}
            </svg>
          </div>
        </Marker>

      </MapGL>

      {/* Parchment tonal wash */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 16% 14%, rgba(238,224,185,0.42) 0%, rgba(238,224,185,0) 34%), radial-gradient(circle at 84% 82%, rgba(58,46,31,0.22) 0%, rgba(58,46,31,0) 44%), linear-gradient(165deg, rgba(203,179,133,0.14) 0%, rgba(131,104,73,0.2) 54%, rgba(82,64,44,0.22) 100%)',
          mixBlendMode: 'soft-light',
        }}
      />

      {/* Fine paper grain + fiber texture */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          pointerEvents: 'none',
          opacity: 0.28,
          backgroundImage: 'repeating-radial-gradient(circle at 20% 20%, rgba(255,255,255,0.14) 0 0.9px, rgba(0,0,0,0.06) 1.4px 2.2px), repeating-linear-gradient(12deg, rgba(255,255,255,0.08) 0 1px, rgba(0,0,0,0.05) 1px 2px)',
          backgroundSize: '140px 140px, 4px 4px',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Subtle engraved contour effect */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 4,
          pointerEvents: 'none',
          opacity: 0.14,
          backgroundImage: 'repeating-linear-gradient(-18deg, rgba(255,245,220,0.28) 0 1px, rgba(48,39,27,0.12) 1px 3px)',
          mixBlendMode: 'soft-light',
        }}
      />

      {/* Vintage vignette for edge falloff */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 5,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at center, rgba(0,0,0,0) 46%, rgba(35,27,17,0.2) 74%, rgba(24,18,11,0.34) 100%)',
        }}
      />
    </div>
  );
});

// memo() prevents map re-renders when AppNew re-renders for unrelated state
// (scroll events, gallery index changes, etc.) — only re-renders when own props change
export default memo(MapLibreMap);
