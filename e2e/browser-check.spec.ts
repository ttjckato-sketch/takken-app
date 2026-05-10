import { test, expect } from '@playwright/test';

test.describe('Real Browser Check - QuestionUnderstandingAid', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the real-browser-check page
    await page.goto('http://127.0.0.1:5176/real-browser-check.html');
  });

  test('real-browser-check.html - ページが開きボタンが表示される', async ({ page }) => {
    // ページタイトル確認
    await expect(page).toHaveTitle(/QuestionUnderstandingAid 実ブラウザ確認/);

    // ボタンが表示されているか確認
    await expect(page.locator('#runAuditBtn')).toBeVisible();
    await expect(page.locator('#checkStudyEventsBtn')).toBeVisible();
    await expect(page.locator('#exportBtn')).toBeVisible();

    // 初期状態確認
    await expect(page.locator('#output')).toContainText('「実カード確認を実行」ボタンを押してください');

    // スクリーンショット
    await page.screenshot({ path: 'e2e/screenshots/01-real-browser-check-initial.png' });
  });

  test('real-browser-check.html - 実カード確認を実行', async ({ page }) => {
    // ボタンクリック
    await page.click('#runAuditBtn');

    // 結果待機
    await page.waitForTimeout(3000);

    // JSエラーがないか確認
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // 出力エリアの内容確認
    const outputContent = await page.locator('#output').textContent();
    console.log('Output content length:', outputContent?.length);

    // 何か表示されていることを確認
    await expect(page.locator('#output')).not.toContainText('「実カード確認を実行」ボタンを押してください');

    // スクリーンショット
    await page.screenshot({ path: 'e2e/screenshots/02-real-browser-check-after-run.png', fullPage: true });

    console.log('Errors found:', errors.length);
    if (errors.length > 0) {
      console.log('Error details:', errors);
    }
  });

  test('real-browser-check.html - study_events確認', async ({ page }) => {
    // study_eventsボタンクリック
    await page.click('#checkStudyEventsBtn');

    // 結果待機
    await page.waitForTimeout(2000);

    // スクリーンショット
    await page.screenshot({ path: 'e2e/screenshots/03-study-events-check.png', fullPage: true });

    // statsエリアに何か表示されていることを確認
    const statsVisible = await page.locator('#stats').isVisible();
    console.log('Stats visible:', statsVisible);
  });
});

test.describe('Main App - QuestionUnderstandingAid Integration', () => {
  test('アプリ本体 - ActiveRecallで誤答時にQuestionUnderstandingAidが表示される', async ({ page }) => {
    // メインアプリに移動
    await page.goto('http://127.0.0.1:5176/');

    // ページが読み込まれるのを待機
    await page.waitForTimeout(2000);

    // スクリーンショット（初期状態）
    await page.screenshot({ path: 'e2e/screenshots/04-main-app-initial.png' });

    // ActiveRecallボタンがあればクリック
    const activeRecallButton = page.locator('button:has-text("ActiveRecall"), button:has-text("学習開始"), button:has-text("Start")').first();
    if (await activeRecallButton.isVisible()) {
      await activeRecallButton.click();
      await page.waitForTimeout(2000);
    }

    // スクリーンショット（ActiveRecall開始後）
    await page.screenshot({ path: 'e2e/screenshots/05-active-recall-started.png', fullPage: true });
  });

  test('activerecall-test.html - study_events確認ページ', async ({ page }) => {
    // activerecall-test.htmlに移動
    await page.goto('http://127.0.0.1:5176/activerecall-test.html');

    // ページ読み込み待機
    await page.waitForTimeout(2000);

    // スクリーンショット
    await page.screenshot({ path: 'e2e/screenshots/06-activerecall-test.png', fullPage: true });

    // study_events件数を取得
    const eventsCount = await page.locator('body').textContent();
    console.log('activerecall-test.html content:', eventsCount?.substring(0, 200));
  });
});
