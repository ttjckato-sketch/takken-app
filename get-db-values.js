/**
 * Node.js script to get DB values via puppeteer
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🔍 Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  console.log('📝 Navigating to app...');
  await page.goto('http://127.0.0.1:5176/', { waitUntil: 'networkidle0' });

  // Wait for DB to be available
  await page.waitForTimeout(3000);

  console.log('📊 Extracting DB values...');
  const dbInfo = await page.evaluate(() => {
    const db = window.db;
    if (!db) {
      return { error: 'DB not found' };
    }

    return {
      db_version: db.verno,
      tables: db.tables.map(t => t.name)
    };
  });

  console.log('DB Info:', JSON.stringify(dbInfo, null, 2));

  if (dbInfo.db_version) {
    const resultPath = path.join(__dirname, 'db-values-result.json');
    fs.writeFileSync(resultPath, JSON.stringify(dbInfo, null, 2));
    console.log(`✅ Results saved to: ${resultPath}`);
  }

  await browser.close();
})();
