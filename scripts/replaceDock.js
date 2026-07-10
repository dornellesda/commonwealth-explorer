import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/AppNew.jsx', 'utf-8');

  // Find the start of the dock
  const startIndex = content.indexOf('{isMenuOpen && (\n        <div\n          onMouseLeave={() => {\n            markDockInteraction();');
  
  if (startIndex === -1) {
    console.log('Could not find dock start');
    process.exit(1);
  }

  // Find the end of the dock block
  const endStr = '      <div\n        ref={mapAtmosphereRef}';
  let endIndex = content.indexOf(endStr, startIndex);

  if (endIndex === -1) {
    console.log('Could not find dock end');
    process.exit(1);
  }
  
  // Actually, there is an `)}` before it. Let's trace back from endIndex to include it or exclude it.
  endIndex = content.lastIndexOf(')}', endIndex) + 2;

  const replacement = `
      <UniversalDock
        isMenuOpen={isMenuOpen}
        isDockTransitioning={isDockTransitioning}
        markDockInteraction={markDockInteraction}
        isDockSearchExpanded={isDockSearchExpanded}
        setIsDockSearchExpanded={setIsDockSearchExpanded}
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        handleSearchFocus={handleSearchFocus}
        searchResults={searchResults}
        selectedCountryIndex={selectedCountryIndex}
        handleKeyDown={handleKeyDown}
        isDockExpanding={isDockExpanding}
        handleSelectCountry={handleSelectCountry}
        handleCountryHover={handleCountryHover}
        handleReset={handleReset}
        clearDockSearchTimer={clearDockSearchTimer}
      />
`;

  let newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  
  const importStr = "import UniversalDock from './components/Dock/UniversalDock';\n";
  if (!newContent.includes('UniversalDock')) {
      newContent = newContent.replace("import React,", importStr + "import React,");
  } else if (!newContent.includes('components/Dock/UniversalDock')) {
      newContent = importStr + newContent;
  }

  await fs.writeFile('src/AppNew.jsx', newContent);
  console.log('Replaced inline dock with UniversalDock!');
}
main();
