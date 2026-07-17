import React from "react";

export const ReferenceSharedDefs = () => (
  <defs>
    {/* Soft Drop Shadow for the main badges */}
    <filter id="ref-drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.4" />
    </filter>

    {/* Subtle Inner Bevel / Glow Effect */}
    <filter id="ref-inner-bevel" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
      <feOffset dx="-1" dy="-1" result="offset" />
      <feComposite in="SourceAlpha" in2="offset" operator="arithmetic" k2="-1" k3="1" result="diff" />
      <feFlood floodColor="white" floodOpacity="0.4" result="flood" />
      <feComposite in="flood" in2="diff" operator="in" result="overlay" />
      <feMerge>
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="overlay" />
      </feMerge>
    </filter>

    {/* Bronze/Brass Gradients for Curious Explorer */}
    <linearGradient id="bronze-star-light" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#C99863" />
      <stop offset="50%" stopColor="#A87543" />
      <stop offset="100%" stopColor="#7E5227" />
    </linearGradient>
    <linearGradient id="bronze-star-dark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#8C5C32" />
      <stop offset="50%" stopColor="#633F1F" />
      <stop offset="100%" stopColor="#4A2D12" />
    </linearGradient>
    <linearGradient id="bronze-ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#A87543" />
      <stop offset="30%" stopColor="#C99863" />
      <stop offset="70%" stopColor="#633F1F" />
      <stop offset="100%" stopColor="#3B200A" />
    </linearGradient>

    {/* Gold Gradients */}
    <linearGradient id="gold-metallic" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FFE082" />
      <stop offset="30%" stopColor="#FFD54F" />
      <stop offset="50%" stopColor="#FFC107" />
      <stop offset="85%" stopColor="#FF8F00" />
      <stop offset="100%" stopColor="#FF6F00" />
    </linearGradient>
    <linearGradient id="gold-metallic-light" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FFF9C4" />
      <stop offset="100%" stopColor="#FFE082" />
    </linearGradient>
    <linearGradient id="gold-metallic-dark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FFB300" />
      <stop offset="100%" stopColor="#8D6E63" />
    </linearGradient>
    <linearGradient id="gold-border" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FFF59D" />
      <stop offset="50%" stopColor="#FFB300" />
      <stop offset="100%" stopColor="#E65100" />
    </linearGradient>

    {/* Silver/Platinum Gradients */}
    <linearGradient id="silver-metallic" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="30%" stopColor="#E0E0E0" />
      <stop offset="55%" stopColor="#9E9E9E" />
      <stop offset="85%" stopColor="#757575" />
      <stop offset="100%" stopColor="#424242" />
    </linearGradient>
    <linearGradient id="silver-border" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="50%" stopColor="#BDBDBD" />
      <stop offset="100%" stopColor="#616161" />
    </linearGradient>
    <linearGradient id="silver-light" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="100%" stopColor="#E0E0E0" />
    </linearGradient>
    <linearGradient id="silver-dark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#BDBDBD" />
      <stop offset="100%" stopColor="#424242" />
    </linearGradient>

    {/* Facet Enamels for Hexagons */}
    {/* Purple Crystal Facets */}
    <linearGradient id="purple-facet-top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#8C6BB1" />
      <stop offset="100%" stopColor="#6A51A3" />
    </linearGradient>
    <linearGradient id="purple-facet-bottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#4A1486" />
      <stop offset="100%" stopColor="#3F007D" />
    </linearGradient>
    <linearGradient id="purple-facet-left" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#7A52B3" />
      <stop offset="100%" stopColor="#54278F" />
    </linearGradient>
    <linearGradient id="purple-facet-right" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0%" stopColor="#6A51A3" />
      <stop offset="100%" stopColor="#4A1486" />
    </linearGradient>
    <linearGradient id="purple-center" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#54278F" />
      <stop offset="100%" stopColor="#3F007D" />
    </linearGradient>

    {/* Blue/Cyan Crystal Facets */}
    <linearGradient id="blue-facet-top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#E0F7FA" />
      <stop offset="100%" stopColor="#80DEEA" />
    </linearGradient>
    <linearGradient id="blue-facet-bottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#00838F" />
      <stop offset="100%" stopColor="#006064" />
    </linearGradient>
    <linearGradient id="blue-facet-left" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#B2EBF2" />
      <stop offset="100%" stopColor="#26C6DA" />
    </linearGradient>
    <linearGradient id="blue-facet-right" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0%" stopColor="#4DD0E1" />
      <stop offset="100%" stopColor="#0097A7" />
    </linearGradient>
    <linearGradient id="blue-center" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#00ACC1" />
      <stop offset="100%" stopColor="#006064" />
    </linearGradient>

    {/* Enamel Red for World Voyager */}
    <radialGradient id="enamel-red" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#D50000" />
      <stop offset="70%" stopColor="#9B0000" />
      <stop offset="100%" stopColor="#4A0000" />
    </radialGradient>

    {/* Enamel Lime/Green for Commonwealth Traveller */}
    <linearGradient id="enamel-green" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#CCFF33" />
      <stop offset="100%" stopColor="#7CB342" />
    </linearGradient>
  </defs>
);

// 1. Curious Explorer (Bronze Star Compass)
export const CuriousExplorerSVG = (props) => {
  // Generate points for 16-point star
  // 8 primary long points, 8 secondary short points
  const points = [];
  const cx = 50, cy = 50;
  for (let i = 0; i < 32; i++) {
    const angle = (i * Math.PI) / 16 - Math.PI / 2;
    let r = 26; // base inner radius
    if (i % 4 === 0) r = 46; // Main cardinal points (Top, Right, Bottom, Left)
    else if (i % 2 === 0) r = 38; // Intermediate points
    else r = 26; // Inner joints
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }

  return (
    <svg viewBox="-15 -15 130 130" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <ReferenceSharedDefs />
      <g filter="url(#ref-drop-shadow)">
        {/* Outer 16-Point Star Bevel Facets */}
        {/* 16 segments of the star, alternating light/dark bronze gradients */}
        <g>
          {Array.from({ length: 16 }).map((_, idx) => {
            const a1 = ((idx * 2) * Math.PI) / 16 - Math.PI / 2;
            const aMid = ((idx * 2 + 1) * Math.PI) / 16 - Math.PI / 2;
            const a2 = (((idx + 1) * 2) * Math.PI) / 16 - Math.PI / 2;

            // Radius for point
            let rPeak = (idx % 2 === 0) ? 46 : 38;
            let rValley1 = 26;
            let rValley2 = 26;

            const p1 = `${cx + rValley1 * Math.cos(a1)},${cy + rValley1 * Math.sin(a1)}`;
            const pMid = `${cx + rPeak * Math.cos(aMid)},${cy + rPeak * Math.sin(aMid)}`;
            const p2 = `${cx + rValley2 * Math.cos(a2)},${cy + rValley2 * Math.sin(a2)}`;

            return (
              <g key={idx}>
                {/* Left facet (light) */}
                <polygon points={`50,50 ${p1} ${pMid}`} fill="url(#bronze-star-light)" />
                {/* Right facet (dark) */}
                <polygon points={`50,50 ${pMid} ${p2}`} fill="url(#bronze-star-dark)" />
              </g>
            );
          })}
        </g>

        {/* Central Circular Bronze Ring */}
        <circle cx="50" cy="50" r="25" fill="url(#bronze-ring)" stroke="#3B200A" strokeWidth="1" />
        <circle cx="50" cy="50" r="23" fill="#2E1908" stroke="url(#bronze-star-light)" strokeWidth="1" />

        {/* Inner Compass Rose */}
        {/* Cardinal North/East/South/West Point Facets */}
        {[0, 90, 180, 270].map((angle) => (
          <g key={angle} transform={`rotate(${angle} 50 50)`}>
            {/* North pointing needle */}
            <polygon points="50,50 46,50 50,28" fill="url(#bronze-star-light)" />
            <polygon points="50,50 54,50 50,28" fill="url(#bronze-star-dark)" />
          </g>
        ))}
        {/* Intermediate Point Facets */}
        {[45, 135, 225, 315].map((angle) => (
          <g key={angle} transform={`rotate(${angle} 50 50)`}>
            {/* Smaller offset needle */}
            <polygon points="50,50 47,50 50,34" fill="url(#bronze-star-light)" />
            <polygon points="50,50 53,50 50,34" fill="url(#bronze-star-dark)" />
          </g>
        ))}

        {/* Center Stud */}
        <circle cx="50" cy="50" r="4.5" fill="url(#bronze-star-light)" filter="url(#ref-inner-bevel)" />
        <circle cx="50" cy="50" r="1.5" fill="#3B200A" />
      </g>
    </svg>
  );
};

// 2. Golden Commonwealth Explorer (Purple Hexagon & Gold Star)
export const GoldenExplorerSVG = (props) => (
  <svg viewBox="-15 -15 130 130" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <ReferenceSharedDefs />
    <g filter="url(#ref-drop-shadow)">
      {/* Gold Border Hexagon */}
      <polygon 
        points="50,4 90,27 90,73 50,96 10,73 10,27" 
        fill="url(#gold-border)" 
        filter="url(#ref-inner-bevel)" 
      />
      
      {/* Purple Faceted Gem Interior */}
      {/* 6 trapezoidal border facets + center flat hexagon */}
      <g>
        {/* Top-Left facet */}
        <polygon points="50,8 77.7,24 90,27 50,4" fill="url(#purple-facet-top)" opacity="0.9" />
        {/* Top-Right facet */}
        <polygon points="77.7,24 77.7,56 90,73 90,27" fill="url(#purple-facet-right)" />
        {/* Bottom facet */}
        <polygon points="77.7,56 50,72 50,96 90,73" fill="url(#purple-facet-bottom)" />
        {/* Bottom-Left facet */}
        <polygon points="50,72 22.3,56 10,73 50,96" fill="url(#purple-facet-bottom)" opacity="0.95" />
        {/* Left facet */}
        <polygon points="22.3,56 22.3,24 10,27 10,73" fill="url(#purple-facet-left)" />
        {/* Top-Left/Top facet */}
        <polygon points="22.3,24 50,8 50,4 10,27" fill="url(#purple-facet-top)" />

        {/* Hexagonal Center Core */}
        <polygon points="50,8 77.7,24 77.7,56 50,72 22.3,56 22.3,24" fill="url(#purple-center)" />
      </g>

      {/* Gold Laurel Wreath & Circle */}
      <g>
        <circle cx="50" cy="48" r="23" fill="none" stroke="url(#gold-metallic)" strokeWidth="2.5" />
        
        {/* Left Laurel Branch */}
        <path d="M 33,54 Q 30,44 37,32 Q 44,25 45,26" fill="none" stroke="url(#gold-metallic)" strokeWidth="1.5" />
        {/* Laurel Leaves (Left) */}
        <path d="M 32,50 C 29,48 30,44 33,46 Z" fill="url(#gold-metallic)" />
        <path d="M 30,42 C 27,40 29,36 32,38 Z" fill="url(#gold-metallic)" />
        <path d="M 32,34 C 30,31 33,28 35,31 Z" fill="url(#gold-metallic)" />
        <path d="M 36,28 C 35,24 39,23 40,26 Z" fill="url(#gold-metallic)" />

        {/* Right Laurel Branch */}
        <path d="M 67,54 Q 70,44 63,32 Q 56,25 55,26" fill="none" stroke="url(#gold-metallic)" strokeWidth="1.5" />
        {/* Laurel Leaves (Right) */}
        <path d="M 68,50 C 71,48 70,44 67,46 Z" fill="url(#gold-metallic)" />
        <path d="M 70,42 C 73,40 71,36 68,38 Z" fill="url(#gold-metallic)" />
        <path d="M 68,34 C 70,31 67,28 65,31 Z" fill="url(#gold-metallic)" />
        <path d="M 64,28 C 65,24 61,23 60,26 Z" fill="url(#gold-metallic)" />
      </g>

      {/* Raised 8-Point Gold Star */}
      <g>
        {/* Vertical/Horizontal Points */}
        <g>
          {/* North */}
          <polygon points="50,48 48,48 50,30" fill="url(#gold-metallic-light)" />
          <polygon points="50,48 52,48 50,30" fill="url(#gold-metallic-dark)" />
          {/* East */}
          <polygon points="50,48 50,46 68,48" fill="url(#gold-metallic-light)" />
          <polygon points="50,48 50,50 68,48" fill="url(#gold-metallic-dark)" />
          {/* South */}
          <polygon points="50,48 52,48 50,66" fill="url(#gold-metallic-light)" />
          <polygon points="50,48 48,48 50,66" fill="url(#gold-metallic-dark)" />
          {/* West */}
          <polygon points="50,48 50,50 32,48" fill="url(#gold-metallic-light)" />
          <polygon points="50,48 50,46 32,48" fill="url(#gold-metallic-dark)" />
        </g>
        {/* Diagonal Points */}
        <g transform="rotate(45 50 48)">
          <polygon points="50,48 48,48 50,34" fill="url(#gold-metallic-light)" />
          <polygon points="50,48 52,48 50,34" fill="url(#gold-metallic-dark)" />
          <polygon points="50,48 50,46 64,48" fill="url(#gold-metallic-light)" />
          <polygon points="50,48 50,50 64,48" fill="url(#gold-metallic-dark)" />
          <polygon points="50,48 52,48 50,62" fill="url(#gold-metallic-light)" />
          <polygon points="50,48 48,48 50,62" fill="url(#gold-metallic-dark)" />
          <polygon points="50,48 50,50 36,48" fill="url(#gold-metallic-light)" />
          <polygon points="50,48 50,46 36,48" fill="url(#gold-metallic-dark)" />
        </g>
        <circle cx="50" cy="48" r="1.5" fill="#FFE082" />
      </g>
    </g>
  </svg>
);

// 3. Global Navigator (Blue Hexagon & Globe)
export const GlobalNavigatorSVG = (props) => (
  <svg viewBox="-15 -15 130 130" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <ReferenceSharedDefs />
    <g filter="url(#ref-drop-shadow)">
      {/* Silver Border Hexagon */}
      <polygon 
        points="50,4 90,27 90,73 50,96 10,73 10,27" 
        fill="url(#silver-border)" 
        filter="url(#ref-inner-bevel)" 
      />

      {/* Ice Blue Faceted Gem Interior */}
      <g>
        <polygon points="50,8 77.7,24 90,27 50,4" fill="url(#blue-facet-top)" opacity="0.9" />
        <polygon points="77.7,24 77.7,56 90,73 90,27" fill="url(#blue-facet-right)" />
        <polygon points="77.7,56 50,72 50,96 90,73" fill="url(#blue-facet-bottom)" />
        <polygon points="50,72 22.3,56 10,73 50,96" fill="url(#blue-facet-bottom)" opacity="0.95" />
        <polygon points="22.3,56 22.3,24 10,27 10,73" fill="url(#blue-facet-left)" />
        <polygon points="22.3,24 50,8 50,4 10,27" fill="url(#blue-facet-top)" />

        {/* Center Hexagonal Core */}
        <polygon points="50,8 77.7,24 77.7,56 50,72 22.3,56 22.3,24" fill="url(#blue-center)" />
      </g>

      {/* Center Globe Medallion */}
      <g>
        {/* Dark Circular Base with Silver Beveled Border */}
        <circle cx="50" cy="50" r="26" fill="#0C202F" stroke="url(#silver-metallic)" strokeWidth="3" />
        
        {/* Silver Globe Grid lines */}
        <circle cx="50" cy="50" r="20" fill="none" stroke="#ECEFF1" strokeWidth="1.5" />
        <ellipse cx="50" cy="50" rx="9" ry="20" fill="none" stroke="#ECEFF1" strokeWidth="1.5" />
        <ellipse cx="50" cy="50" rx="20" ry="9" fill="none" stroke="#ECEFF1" strokeWidth="1.5" />
        <line x1="30" y1="50" x2="70" y2="50" stroke="#ECEFF1" strokeWidth="1.5" />
        <line x1="50" y1="30" x2="50" y2="70" stroke="#ECEFF1" strokeWidth="1.5" />
      </g>
    </g>
  </svg>
);

// 4. World Voyager (Shield & Stars)
export const WorldVoyagerSVG = (props) => (
  <svg viewBox="-15 -15 130 130" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <ReferenceSharedDefs />
    <g filter="url(#ref-drop-shadow)">
      {/* Outer Silver Shield Base */}
      <path 
        d="M 12,24 C 12,24 35,24 50,18 C 65,24 88,24 88,24 L 88,60 C 88,80 50,96 50,96 C 50,96 12,80 12,60 Z" 
        fill="url(#silver-border)" 
        filter="url(#ref-inner-bevel)" 
      />

      {/* Inner Enamel Shield Plate (Slightly smaller) */}
      <path 
        d="M 17,28 C 17,28 38,28 50,23 C 62,28 83,28 83,28 L 83,57 C 83,75 50,89 50,89 C 50,89 17,75 17,57 Z" 
        fill="url(#silver-dark)" 
      />
      <path 
        d="M 19,30 C 19,30 38,30 50,25 C 62,30 82,30 82,30 L 82,56 C 82,73 50,87 50,87 C 50,87 19,73 19,56 Z" 
        fill="url(#silver-light)" 
      />

      {/* Crown sitting strictly on the shield top */}
      <g>
        <path 
          d="M 28,21 L 34,7 L 50,16 L 66,7 L 72,21 Z" 
          fill="url(#silver-metallic)" 
          stroke="#424242" 
          strokeWidth="1" 
          strokeLinejoin="round" 
        />
        <rect x="32" y="19" width="36" height="3" fill="url(#silver-dark)" />
      </g>

      {/* Red Circular Disk */}
      <circle cx="50" cy="56" r="23" fill="url(#enamel-red)" stroke="url(#silver-border)" strokeWidth="2" />

      {/* Central 3D Stars */}
      <g>
        {/* Large Center Star Facets */}
        <g>
          {/* Point 1 (Top) */}
          <polygon points="50,56 50,38 54,52" fill="url(#silver-light)" />
          <polygon points="50,56 50,38 46,52" fill="url(#silver-dark)" />
          {/* Point 2 (Right) */}
          <polygon points="50,56 66,51 55,59" fill="url(#silver-light)" />
          <polygon points="50,56 66,51 54,52" fill="url(#silver-dark)" />
          {/* Point 3 (Bottom-Right) */}
          <polygon points="50,56 60,69 50,61" fill="url(#silver-light)" />
          <polygon points="50,56 60,69 55,59" fill="url(#silver-dark)" />
          {/* Point 4 (Bottom-Left) */}
          <polygon points="50,56 40,69 45,59" fill="url(#silver-light)" />
          <polygon points="50,56 40,69 50,61" fill="url(#silver-dark)" />
          {/* Point 5 (Left) */}
          <polygon points="50,56 34,51 46,52" fill="url(#silver-light)" />
          <polygon points="50,56 34,51 45,59" fill="url(#silver-dark)" />
        </g>

        {/* Small Top Star Facets */}
        <g transform="translate(0, -17) scale(0.4) translate(-75, -84)" opacity="0.9">
          <polygon points="50,56 50,38 54,52" fill="url(#silver-light)" />
          <polygon points="50,56 50,38 46,52" fill="url(#silver-dark)" />
          <polygon points="50,56 66,51 55,59" fill="url(#silver-light)" />
          <polygon points="50,56 66,51 54,52" fill="url(#silver-dark)" />
          <polygon points="50,56 60,69 50,61" fill="url(#silver-light)" />
          <polygon points="50,56 60,69 55,59" fill="url(#silver-dark)" />
          <polygon points="50,56 40,69 45,59" fill="url(#silver-light)" />
          <polygon points="50,56 40,69 50,61" fill="url(#silver-dark)" />
          <polygon points="50,56 34,51 46,52" fill="url(#silver-light)" />
          <polygon points="50,56 34,51 45,59" fill="url(#silver-dark)" />
        </g>
      </g>
    </g>
  </svg>
);

// 5. Commonwealth Traveller (Vault Medal)
export const CommonwealthTravellerSVG = (props) => (
  <svg viewBox="-15 -15 130 130" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <ReferenceSharedDefs />
    <g filter="url(#ref-drop-shadow)">
      {/* Outer Polished Ring Assembly */}
      <circle cx="50" cy="50" r="46" fill="url(#silver-metallic)" filter="url(#ref-inner-bevel)" stroke="#424242" strokeWidth="1" />
      <circle cx="50" cy="50" r="41" fill="#111" />
      <circle cx="50" cy="50" r="39" fill="url(#silver-light)" />

      {/* Inner Enamel Green Ring */}
      <circle cx="50" cy="50" r="34" fill="url(#enamel-green)" />

      {/* Central Vault Mechanism Dial */}
      <g>
        {/* Grey Central Faceplate */}
        <circle cx="50" cy="50" r="27" fill="#1F2529" stroke="url(#silver-metallic)" strokeWidth="1.5" />
        
        {/* Helm Spokes / Handles (Cloisonné lines) */}
        <g stroke="url(#silver-metallic)" strokeWidth="3" strokeLinecap="round">
          {/* Vertical/Horizontal */}
          <line x1="50" y1="28" x2="50" y2="72" />
          <line x1="28" y1="50" x2="72" y2="50" />
          {/* Intermediate spokes with studs */}
          <line x1="34.4" y1="34.4" x2="65.6" y2="65.6" strokeWidth="2.5" />
          <line x1="34.4" y1="65.6" x2="65.6" y2="34.4" strokeWidth="2.5" />
        </g>

        {/* Symmetrical Spoke Rings/Studs */}
        <circle cx="50" cy="50" r="16" fill="none" stroke="url(#silver-metallic)" strokeWidth="2.5" />

        {/* 8 Square Stud Blocks on spokes */}
        {[[50,28], [72,50], [50,72], [28,50], [35,35], [65,35], [65,65], [35,65]].map(([x,y], idx) => (
          <rect 
            key={idx} 
            x={x - 2} y={y - 2} 
            width="4" height="4" 
            rx="1" 
            fill="url(#silver-light)" 
            stroke="#212121" 
            strokeWidth="0.5" 
          />
        ))}

        {/* Center Knob */}
        <circle cx="50" cy="50" r="6" fill="url(#silver-light)" filter="url(#ref-inner-bevel)" stroke="#424242" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="2.5" fill="#1F2529" />
      </g>
    </g>
  </svg>
);
