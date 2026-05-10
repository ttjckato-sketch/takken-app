/**
 * Runtime DB Audit - Node.js + Playwright
 * 実行: node audit-db.js
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const APP_URL = 'http://127.0.0.1:5176/';
const AUDIT_URL = 'http://127.0.0.1:5176/db-audit.html';
const TEST_URL = 'http://127.0.0.1:5176/activerecall-test.html';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAudit() {
  console.log('🔍 Runtime DB Audit Start...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Consoleログを収集
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
  });

  // IndexedDBを削除してfresh DB状態で確認
  console.log('📝 Step 1: Clearing IndexedDB...');
  await page.goto(APP_URL);
  await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      await new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(db.name);
        req.onsuccess = resolve;
        req.onerror = reject;
      });
    }
  });
  console.log('✓ IndexedDB cleared\n');

  // ページをリロードして初回ロード
  console.log('📝 Step 2: Loading app with fresh DB...');
  await page.reload();
  await sleep(8000); // データロード完了待機

  // DB監査ページに移動して結果を取得
  console.log('📝 Step 3: Running DB audit...');
  await page.goto(AUDIT_URL);

  // ページが完全に読み込まれるまで待機
  await page.waitForLoadState('networkidle');
  await sleep(5000);

  const dbStats = await page.evaluate(() => {
    // auditResultsが設定されるまで待機
    return new Promise((resolve) => {
      const check = () => {
        if (window.auditResults) {
          resolve(window.auditResults);
        } else {
          setTimeout(check, 500);
        }
      };
      check();
    });
  });

  if (!dbStats) {
    console.error('❌ Failed to get audit results');
    await browser.close();
    return;
  }

  console.log('\n📊 DB Audit Results:');
  console.log('='.repeat(50));
  console.log(`knowledge_cards: ${dbStats.knowledge_cards}`);
  console.log(`understanding_cards: ${dbStats.understanding_cards}`);
  console.log(`understanding_chintai: ${dbStats.understanding_chintai}`);
  console.log(`source_questions: ${dbStats.source_questions}`);
  console.log(`source_questions_chintai: ${dbStats.source_questions_chintai}`);
  console.log(`source_choices: ${dbStats.source_choices}`);
  console.log(`source_choices_chintai: ${dbStats.source_choices_chintai}`);
  console.log(`study_events: ${dbStats.study_events}`);
  console.log(`empty_choice_text_count: ${dbStats.empty_choice_text_count}`);
  console.log(`null_is_statement_true_count: ${dbStats.null_is_statement_true_count}`);
  console.log(`unknown_question_type_count: ${dbStats.unknown_question_type_count}`);
  console.log(`metadata_import_status: ${dbStats.metadata_import_status}`);
  console.log(`metadata_import_version: ${dbStats.metadata_import_version}`);
  console.log('='.repeat(50));

  // サンプルカードを取得
  console.log('\n📝 Step 4: Checking sample ActiveRecall card...');
  const sampleCard = await page.evaluate(async () => {
    const db = window.db;
    const cards = await db.understanding_cards
      .where('exam_type')
      .equals('chintai')
      .limit(1)
      .toArray();

    if (cards.length === 0) return null;

    const card = cards[0];
    return {
      card_id: card.card_id,
      exam_type: card.exam_type,
      category: card.category,
      is_statement_true: card.is_statement_true,
      sample_answer: card.sample_answer
    };
  });

  console.log('\n📝 Sample ActiveRecall Card:');
  console.table(sampleCard);

  // ActiveRecallテストページでstudy_events確認
  console.log('\n📝 Step 5: Checking study_events...');
  await page.goto(TEST_URL);
  await sleep(2000);

  const beforeCount = await page.evaluate(async () => {
    const db = new Dexie('TakkenOS_DB');
    db.version(12).stores({
      study_events: 'event_id, card_id, exam_type, category, mode, answered_correct, created_at'
    });
    return await db.study_events.count();
  });

  console.log(`\n📊 回答前 study_events: ${beforeCount}`);

  // 結果を保存
  const auditResult = {
    timestamp: new Date().toISOString(),
    db_stats: dbStats,
    sample_card: sampleCard,
    study_events_before: beforeCount,
    console_logs: consoleLogs.slice(-100)
  };

  const outputPath = 'C:\\Project vibe\\main\\VCG_INTEGRATED\\宅建ツール\\takken-app\\db-audit-result.json';
  writeFileSync(outputPath, JSON.stringify(auditResult, null, 2));
  console.log(`\n✅ Audit result saved to: ${outputPath}`);

  await browser.close();

  // 判定
  console.log('\n🔍 Final Assessment:');
  console.log('='.repeat(50));

  const isOK =
    dbStats.knowledge_cards >= 4000 &&
    dbStats.understanding_cards >= 4000 &&
    dbStats.understanding_chintai >= 500 &&
    dbStats.source_questions_chintai === 500 &&
    dbStats.source_choices_chintai === 2000 &&
    dbStats.empty_choice_text_count === 0 &&
    dbStats.metadata_import_status === 'success';

  if (isOK) {
    console.log('✅ 判定: A. データ活用OK');
    console.log('   - DB件数が期待値を満たす');
    console.log('   - 変換品質が良好');
    console.log('   - metadataが正常');
  } else if (dbStats.knowledge_cards >= 4000 && dbStats.understanding_cards >= 4000) {
    console.log('⚠️  判定: B. 一部OK・要修正');
    console.log('   - 基本DB件数はOK');
    console.log('   - ただし変換品質または件数に問題');
    console.log(`   - source_questions_chintai: ${dbStats.source_questions_chintai}/500`);
    console.log(`   - source_choices_chintai: ${dbStats.source_choices_chintai}/2000`);
  } else {
    console.log('❌ 判定: C. 未完成');
    console.log('   - DB件数不足またはデータ投入失敗');
    console.log(`   - knowledge_cards: ${dbStats.knowledge_cards}/4000`);
    console.log(`   - understanding_cards: ${dbStats.understanding_cards}/4000`);
  }

  return auditResult;
}

// 実行
runAudit().catch(err => {
  console.error('❌ Audit failed:', err);
  process.exit(1);
});
