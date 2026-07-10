import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5173');
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Try to trigger the badge by executing the exact logic in the browser context!
  // Wait, I can't easily do that if the state is local.
  // Instead, I'll modify the DOM by clicking the same path 5 times! Wait, handleSelectCountry checks nextVisitedCountries. If it's already visited, it won't increment!
  
  // Let me just click 5 different paths with evaluate:
  await page.evaluate(async () => {
     const paths = document.querySelectorAll('path.leaflet-interactive');
     // click first 5
     for(let i=0; i<5; i++) {
        // dispatch event
        const event = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        paths[i].dispatchEvent(event);
        await new Promise(r => setTimeout(r, 500));
     }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const textAfter = await page.evaluate(() => document.body.innerText);
  console.log('BODY TEXT AFTER CLIcks:', textAfter.substring(0, 300));
  
  await browser.close();
})();
