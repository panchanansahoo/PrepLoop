import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  page.on('requestfailed', request => {
    const failure = request.failure();
    console.log('REQUEST FAILED:', request.url(), failure ? failure.errorText : 'Unknown Error');
  });

  console.log('Navigating to https://preploop.me...');
  await page.goto('https://preploop.me', { waitUntil: 'networkidle2' });
  
  const html = await page.evaluate(() => {
    return document.body.innerHTML;
  });
  console.log('Body HTML preview:', html.substring(0, 500));
  
  await browser.close();
})();
