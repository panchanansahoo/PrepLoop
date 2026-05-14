const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('BROWSER PAGE ERROR:', err.toString());
  });

  page.on('requestfailed', request => {
    console.log('BROWSER NETWORK ERROR:', request.url(), request.failure().errorText);
  });

  console.log('Visiting http://localhost:5173 ...');
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log('Homepage loaded.');
  } catch (e) {
    console.log('Error loading homepage:', e.message);
  }

  // Also check dashboard
  console.log('Visiting http://localhost:5173/dashboard ...');
  try {
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log('Dashboard loaded.');
  } catch (e) {
    console.log('Error loading dashboard:', e.message);
  }

  await browser.close();
})();
