import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5173');
  
  // Wait for the map to load
  await new Promise(r => setTimeout(r, 2000));
  
  // Read body text to see if the error boundary triggered?
  const text = await page.evaluate(() => document.body.innerText);
  console.log('BODY TEXT BEFORE CLICKING:', text.substring(0, 100));

  // The map triggers handleSelectCountry. To simulate it, we can just click on the map paths
  // Wait for leaflet paths
  await page.waitForSelector('path.leaflet-interactive', { timeout: 5000 }).catch(e => console.log("No paths found"));
  
  // Click 5 different countries to trigger the first badge
  const paths = await page.$$('path.leaflet-interactive');
  console.log(`Found ${paths.length} interactive paths`);
  
  for (let i = 0; i < 5 && i < paths.length; i++) {
    await paths[i].click();
    await new Promise(r => setTimeout(r, 1000));
    console.log(`Clicked country ${i+1}`);
  }
  
  await new Promise(r => setTimeout(r, 1000));

  const textAfter = await page.evaluate(() => document.body.innerText);
  console.log('BODY TEXT AFTER CLIcks:', textAfter.substring(0, 300));
  
  await browser.close();
})();
