import { chromium } from 'playwright';

async function run() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('--- Phase 1: Reset & Fresh Load ---');
    await page.goto('http://127.0.0.1:5176/'); // まずAppを開いてDB作成
    await page.waitForTimeout(5000);
    
    // DB削除
    await page.evaluate(async () => {
        return new Promise(r => {
            const req = indexedDB.deleteDatabase('TakkenOS_DB');
            req.onsuccess = r;
            req.onblocked = r;
        });
    });
    
    await page.goto('http://127.0.0.1:5176/db-audit.html');
    console.log('Waiting for long load (60s)...');
    await page.waitForTimeout(60000); // 1分待機

    // 画面に「宅建source backfill実行」ボタンがあれば押す
    const backfillBtn = await page.$('button:has-text("宅建source backfill実行")');
    if (backfillBtn) {
        console.log('Clicking manual backfill button...');
        await backfillBtn.click();
        await page.waitForTimeout(10000);
    }

    console.log('Extracting Final Stats...');
    const results = await page.evaluate(() => {
        const stats = {};
        document.querySelectorAll('tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                stats[cells[0].innerText.trim()] = cells[1].innerText.trim();
            }
        });
        return stats;
    });

    console.log('RESULT_JSON_START');
    console.log(JSON.stringify(results, null, 2));
    console.log('RESULT_JSON_END');

    await browser.close();
}

run();
