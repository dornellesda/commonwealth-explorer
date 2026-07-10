import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/components/MapLibreMap.jsx', 'utf-8');

  // Add smallCountries array inside MapLibreMap or outside
  const smallCountriesStr = `
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
`;

  content = content.replace(
    /const MapLibreMap = React.forwardRef\(\(/,
    smallCountriesStr + '\nconst MapLibreMap = React.forwardRef(('
  );

  const markerRenderCode = `
        {smallCountryData.map(c => {
          const cwName = normalizeName(c.name);
          const isSelected = Boolean(cwName === selCountry && selCountry !== '');
          const isActivatedSelected = Boolean(isSelected && actCountry === selCountry && actCountry !== '');
          const isHovered = Boolean(cwName === effectiveHoveredCountry && effectiveHoveredCountry !== '' && !isSelected);
          
          let fillColor = "#87B940";
          let borderColor = "#97d749";
          let opacity = 0.95;
          let fillOpacity = 0.35;
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
                if (onCountrySelect) onCountrySelect(c.name);
              }}
            >
              <div 
                onMouseEnter={() => { if (onCountryHover) onCountryHover(c.name); }}
                onMouseLeave={() => { if (onCountryHover) onCountryHover(null); }}
                style={{
                  width: \`\${radius}px\`, 
                  height: \`\${radius}px\`, 
                  borderRadius: '50%', 
                  backgroundColor: fillColor, 
                  border: \`\${weight}px solid \${borderColor}\`, 
                  opacity: opacity, 
                  boxShadow: \`0 0 0 \${fillOpacity * 5}px \${fillColor}44\`,
                  cursor: 'pointer',
                  transition: 'all 300ms ease'
                }} 
              />
            </Marker>
          );
        })}
        
        <Source 
          id="map-art-overlay"`;

  content = content.replace(
    /<Source\s+id="map-art-overlay"/,
    markerRenderCode
  );

  await fs.writeFile('src/components/MapLibreMap.jsx', content, 'utf-8');
  console.log("Added Markers");
}
main();
