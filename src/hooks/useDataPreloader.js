import { useEffect, useRef } from 'react';

export function useDataPreloader(countries, isIdleAttractMode, loadDataForCountry) {
  const hasPreloaded = useRef(false);
  const queueIndex = useRef(0);

  useEffect(() => {
    // Only start if we are in idle attract mode, have countries, and haven't finished preloading yet.
    if (!isIdleAttractMode || countries.length === 0 || hasPreloaded.current) return;

    let isActive = true;

    const processQueue = async () => {
      if (queueIndex.current >= countries.length) {
        hasPreloaded.current = true;
        console.log("Background data preloading complete for all countries.");
        return;
      }

      const country = countries[queueIndex.current];
      
      // Perform the silent fetch
      await loadDataForCountry(country.name);
      
      queueIndex.current += 1;

      // Small delay between fetches to prevent API rate limiting or blocking the main thread
      if (isActive) {
        setTimeout(processQueue, 1200); 
      }
    };

    console.log("Starting silent background data preloading...");
    processQueue();

    return () => {
      isActive = false;
    };
  }, [isIdleAttractMode, countries, loadDataForCountry]);
}
