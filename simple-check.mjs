import { chromium } from 'playwright';

async function simpleCheck() {
  console.log('🔍 Starting browser...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('📝 Opening db-api.html...');
  await page.goto('http://127.0.0.1:5176/db-api.html', { waitUntil: 'networkidle' });
  await page.waitForLoadState('domcontentloaded');

  console.log('⏳ Waiting for DB load...');
  await page.waitForTimeout(5000);

  console.log('🔍 Debugging: Current URL:', page.url());
  console.log('🔍 Page title:', await page.title());

  const pageContent = await page.content();
  console.log('🔍 Page HTML length:', pageContent.length);
  console.log('🔍 Page has <pre>:', pageContent.includes('<pre'));
  console.log('🔍 Page has result:', pageContent.includes('result'));

  // スクリーンショットを保存
  await page.screenshot({ path: 'debug-screenshot.png' });
  console.log('🔍 Screenshot saved to debug-screenshot.png');

  console.log('📊 Extracting JSON via JavaScript...');
  const jsonText = await page.evaluate(() => {
    const pre = document.querySelector('pre#result');
    return pre ? pre.textContent : 'NOT_FOUND';
  });

  console.log('✅ RESULT:');
  console.log(jsonText);

  console.log('\n✅ RESULT:');
  console.log(jsonText);

  await browser.close();
  return JSON.parse(jsonText);
}

simpleCheck().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
