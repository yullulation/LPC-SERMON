// Renders index.html to a PNG: node render.js [scale]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const scale = Number(process.argv[2] || 2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: scale });
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const out = path.join(__dirname, scale === 2 ? '1122-saturdays-poster.png' : `preview@${scale}x.png`);
  await page.locator('#poster').screenshot({ path: out });
  await browser.close();
  console.log(out);
})();
