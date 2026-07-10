import fs from 'fs/promises';

async function main() {
  let content = await fs.readFile('src/AppNew.jsx', 'utf-8');

  const oldDock = `<UniversalDock
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
      />`;

  const newDock = `<UniversalDock
        isMenuOpen={isMenuOpen}
        isDockTransitioning={isDockTransitioning}
        markDockInteraction={markDockInteraction}
        isDockSearchExpanded={isDockSearchExpanded}
        setIsDockSearchExpanded={setIsDockSearchExpanded}
        searchTerm={searchTerm}
        handleSearchChange={(e) => { setSearchTerm(e.target.value); markDockInteraction(); }}
        handleSearchFocus={markDockInteraction}
        searchResults={searchResults}
        selectedCountryIndex={selectedCountryIndex}
        handleKeyDown={markDockInteraction}
        isDockExpanding={isDockExpanding}
        handleSelectCountry={handleSelectCountry}
        handleCountryHover={handleCountryHover}
        handleReset={handleReset}
        clearDockSearchTimer={() => {}} 
      />`;

  if (content.includes('handleSearchChange={handleSearchChange}')) {
      content = content.replace(oldDock, newDock);
      await fs.writeFile('src/AppNew.jsx', content);
      console.log('Fixed UniversalDock props');
  } else {
      console.log('Could not find UniversalDock with old props');
  }
}
main();
