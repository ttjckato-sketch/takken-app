/**
 * Quick DB Audit - 既存DBの実測値を取得（DB削除なし）
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const AUDIT_URL = 'http://127.0.0.1:5176/db-audit.html';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runQuickAudit() {
  console.log('🔍 Quick DB Audit Start...\n');

  const browser = await chromium.launch({
    headless: false,  // ブラウザを表示してデバッグ
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('📝 Step 1: db-audit.htmlにアクセス...');
  await page.goto(AUDIT_URL);
  await page.waitForLoadState('networkidle');
  await sleep(5000);

  console.log('📝 Step 2: 実測値を取得...');

  const dbStats = await page.evaluate(async () => {
    // DBが開かれるまで待機
    const db = window.db;
    if (!db) {
      await new Promise((resolve) => {
        const check = () => {
          if (window.db) { resolve(); } else { setTimeout(check, 500); }
        };
        check();
      });
    }

    const database = window.db;

    // source実測
    const allSourceQ = await database.source_questions.toArray();
    const allSourceC = await database.source_choices.toArray();

    const chintaiQ = allSourceQ.filter(q => q.exam_type === 'chintai');
    const chintaiC = allSourceC.filter(c => c.question_id && c.question_id.startsWith('CHINTAI-SQ-'));

    const takkenQ = allSourceQ.filter(q => q.exam_type === 'takken');
    const takkenC = allSourceC.filter(c => c.id && c.id.startsWith('TAKKEN-SC-'));

    // understanding_cards実測
    const allCards = await database.understanding_cards.toArray();
    const chintaiCards = allCards.filter(c => c.exam_type === 'chintai');
    const takkenCards = allCards.filter(c => c.exam_type === 'takken');

    // ActiveRecall除外実測
    const nullStatementCount = chintaiCards.filter(c => c.is_statement_true === null).length;

    // repair_possible実測
    const repairPossibleCount = takkenCards.filter(c => {
      const sampleQ = (c.sample_question || '').toLowerCase();
      const hasPlaceholder = sampleQ.includes('この問題') || sampleQ.includes('当該問題');
      const hasRule = !!(c.core_knowledge && c.core_knowledge.rule);
      return hasPlaceholder && hasRule;
    }).length;

    // restoration_candidates実測
    const rc = await database.restoration_candidates.toArray();
    const rcAutoOk = rc.filter(c => c.review_status === 'auto_ok').length;
    const rcCandidate = rc.filter(c => c.review_status === 'candidate').length;

    // metadataからrecovery_pending countを取得
    const recoveryPendingMeta = await database.metadata.get('takken_source_recovery_pending_count');
    const recoveryPendingCount = recoveryPendingMeta ? recoveryPendingMeta.value : 0;

    // study_events実測
    const studyEventsCount = await database.study_events.count();
    const latestEvent = await database.study_events.orderBy('created_at').reverse().first();

    return {
      source_questions_total: allSourceQ.length,
      source_choices_total: allSourceC.length,
      source_questions_chintai: chintaiQ.length,
      source_choices_chintai: chintaiC.length,
      source_questions_takken: takkenQ.length,
      source_choices_takken: takkenC.length,
      understanding_cards_total: allCards.length,
      understanding_cards_chintai: chintaiCards.length,
      understanding_cards_takken: takkenCards.length,
      active_recall_excluded_null_statement_count: nullStatementCount,
      repair_possible_count: repairPossibleCount,
      recovery_pending_count: recoveryPendingCount,
      restoration_candidates_total: rc.length,
      restoration_candidates_auto_ok: rcAutoOk,
      restoration_candidates_candidate: rcCandidate,
      study_events_count: studyEventsCount,
      latest_event_sample: latestEvent ? JSON.stringify(latestEvent, null, 2) : null
    };
  });

  console.log('\n📊 DB実測値:');
  console.log('='.repeat(70));

  console.log('\n【source実測】');
  console.log(`source_questions_total: ${dbStats.source_questions_total}`);
  console.log(`source_choices_total: ${dbStats.source_choices_total}`);
  console.log(`source_questions_chintai: ${dbStats.source_questions_chintai}`);
  console.log(`source_choices_chintai: ${dbStats.source_choices_chintai}`);
  console.log(`source_questions_takken: ${dbStats.source_questions_takken}`);
  console.log(`source_choices_takken: ${dbStats.source_choices_takken}`);

  console.log('\n【ActiveRecall除外実測】');
  console.log(`active_recall_excluded_null_statement_count: ${dbStats.active_recall_excluded_null_statement_count}`);
  console.log(`repair_possible_count: ${dbStats.repair_possible_count}`);
  console.log(`recovery_pending_count: ${dbStats.recovery_pending_count}`);

  console.log('\n【restoration_candidates実測】');
  console.log(`restoration_candidates_total: ${dbStats.restoration_candidates_total}`);
  console.log(`restoration_candidates_auto_ok: ${dbStats.restoration_candidates_auto_ok}`);
  console.log(`restoration_candidates_candidate: ${dbStats.restoration_candidates_candidate}`);

  console.log('\n【study_events実測】');
  console.log(`study_events_count: ${dbStats.study_events_count}`);
  console.log(`latest_event_sample: ${dbStats.latest_event_sample ? 'EXISTS' : 'NULL'}`);

  console.log('\n' + '='.repeat(70));

  // 結果を保存
  const outputPath = 'C:\\Project vibe\\main\\VCG_INTEGRATED\\宅建ツール\\takken-app\\quick-audit-result.json';
  writeFileSync(outputPath, JSON.stringify(dbStats, null, 2));
  console.log(`\n✅ 結果保存: ${outputPath}`);

  // 判定
  console.log('\n🔍 判定:');
  console.log('='.repeat(70));

  const issues = [];
  const warnings = [];

  if (dbStats.source_questions_chintai !== 500) {
    issues.push(`source_questions_chintaiが500ではない: ${dbStats.source_questions_chintai}`);
  }
  if (dbStats.source_choices_chintai !== 2000) {
    warnings.push(`source_choices_chintaiが2000ではない: ${dbStats.source_choices_chintai}`);
  }

  console.log(`\n【問題】${issues.length}件`);
  issues.forEach(i => console.log(`  ❌ ${i}`));

  console.log(`\n【警告】${warnings.length}件`);
  warnings.forEach(w => console.log(`  ⚠️  ${w}`));

  console.log('\n【現状判定】');
  if (issues.length === 0 && warnings.length === 0) {
    console.log('A. v29へ進んでよい');
  } else if (issues.length === 0) {
    console.log('B. 追加監査が必要');
  } else {
    console.log('C. 停止・修正優先');
  }

  console.log('\n⏱️  30秒後にブラウザを閉じます...');
  await sleep(30000);

  await browser.close();
  return dbStats;
}

// 実行
runQuickAudit().catch(err => {
  console.error('❌ Audit failed:', err);
  process.exit(1);
});
