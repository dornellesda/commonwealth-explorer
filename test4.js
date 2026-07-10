import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(async () => {
     window.__test_trigger();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  const textAfter = await page.evaluate(() => document.body.innerText);
  console.log('BODY TEXT AFTER TRIGGER:', textAfter.substring(0, 500));
  
  // also check if ErrorBoundary text is present
  const hasError = await page.evaluate(() => document.body.innerText.includes('React Crashed'));
  console.log('HAS ERROR BOUNDARY TRIGGERED?', hasError);
  
  await browser.close();
})();
