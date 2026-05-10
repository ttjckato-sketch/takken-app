/**
 * v28現行DB実測監査 - Playwright版
 * db-audit.htmlとactiverecall-test.htmlから実測値を取得
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const AUDIT_URL = 'http://127.0.0.1:5176/db-audit.html';
const TEST_URL = 'http://127.0.0.1:5176/activerecall-test.html';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBrowserAudit() {
  console.log('🔍 ブラウザ実測監査 Start...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // ========== Step 1: db-audit.htmlで実測値取得 ==========
  console.log('📝 Step 1: db-audit.htmlから実測値取得...');
  await page.goto(AUDIT_URL);
  await page.waitForLoadState('networkidle');
  await sleep(5000);

  const dbStats = await page.evaluate(async () => {
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

    // repair_possible実測（placeholder + ruleを持つカード）
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
    const rcHumanReview = rc.filter(c => c.review_status === 'human_review_required').length;

    // metadataからrecovery_pending countを取得
    const recoveryPendingMeta = await database.metadata.get('takken_source_recovery_pending_count');
    const recoveryPendingCount = recoveryPendingMeta ? recoveryPendingMeta.value : 0;

    // study_events実測
    const studyEventsCount = await database.study_events.count();
    const latestEvent = await database.study_events.orderBy('created_at').reverse().first();

    // memory_cards実測
    const memoryCards = await database.memory_cards.toArray();
    const displayableMC = memoryCards.filter(c => c.confidence !== 'low').length;

    return {
      // source実測
      source_questions_total: allSourceQ.length,
      source_choices_total: allSourceC.length,
      source_questions_chintai: chintaiQ.length,
      source_choices_chintai: chintaiC.length,
      source_questions_takken: takkenQ.length,
      source_choices_takken: takkenC.length,

      // understanding_cards実測
      understanding_cards_total: allCards.length,
      understanding_cards_chintai: chintaiCards.length,
      understanding_cards_takken: takkenCards.length,

      // ActiveRecall除外実測
      active_recall_excluded_null_statement_count: nullStatementCount,
      repair_possible_count: repairPossibleCount,
      recovery_pending_count: recoveryPendingCount,

      // restoration_candidates実測
      restoration_candidates_total: rc.length,
      restoration_candidates_auto_ok: rcAutoOk,
      restoration_candidates_candidate: rcCandidate,
      restoration_candidates_human_review: rcHumanReview,

      // memory_cards実測
      memory_cards_total: memoryCards.length,
      displayable_memory_cards: displayableMC,

      // study_events実測
      study_events_count: studyEventsCount,
      latest_event_sample: latestEvent ? JSON.stringify(latestEvent, null, 2) : null,

      // DB version
      db_version: 28
    };
  });

  console.log('\n📊 DB実測値:');
  console.log('='.repeat(70));

  console.log('\n[source実測]');
  console.log(`  source_questions_total: ${dbStats.source_questions_total}`);
  console.log(`  source_choices_total: ${dbStats.source_choices_total}`);
  console.log(`  source_questions_chintai: ${dbStats.source_questions_chintai}`);
  console.log(`  source_choices_chintai: ${dbStats.source_choices_chintai}`);
  console.log(`  source_questions_takken: ${dbStats.source_questions_takken}`);
  console.log(`  source_choices_takken: ${dbStats.source_choices_takken}`);

  console.log('\n[understanding_cards実測]');
  console.log(`  understanding_cards_total: ${dbStats.understanding_cards_total}`);
  console.log(`  understanding_cards_chintai: ${dbStats.understanding_cards_chintai}`);
  console.log(`  understanding_cards_takken: ${dbStats.understanding_cards_takken}`);

  console.log('\n[ActiveRecall除外実測]');
  console.log(`  active_recall_excluded_null_statement_count: ${dbStats.active_recall_excluded_null_statement_count}`);
  console.log(`  repair_possible_count: ${dbStats.repair_possible_count}`);
  console.log(`  recovery_pending_count: ${dbStats.recovery_pending_count}`);

  console.log('\n[restoration_candidates実測]');
  console.log(`  restoration_candidates_total: ${dbStats.restoration_candidates_total}`);
  console.log(`  restoration_candidates_auto_ok: ${dbStats.restoration_candidates_auto_ok}`);
  console.log(`  restoration_candidates_candidate: ${dbStats.restoration_candidates_candidate}`);
  console.log(`  restoration_candidates_human_review: ${dbStats.restoration_candidates_human_review}`);

  console.log('\n[memory_cards実測]');
  console.log(`  memory_cards_total: ${dbStats.memory_cards_total}`);
  console.log(`  displayable_memory_cards: ${dbStats.displayable_memory_cards}`);

  console.log('\n[study_events実測]');
  console.log(`  study_events_count: ${dbStats.study_events_count}`);
  console.log(`  latest_event_sample: ${dbStats.latest_event_sample ? 'EXISTS' : 'NULL'}`);

  console.log('\n' + '='.repeat(70));

  // ========== Step 2: activerecall-test.htmlでstudy_events+1確認 ==========
  console.log('\n📝 Step 2: activerecall-test.htmlでstudy_events+1確認...');

  await page.goto(TEST_URL);
  await page.waitForLoadState('networkidle');
  await sleep(2000);

  // 回答前のstudy_events件数を取得
  const beforeCount = await page.evaluate(async () => {
    const db = new Dexie('TakkenOS_DB');
    db.version(28).stores({
      study_events: 'event_id, card_id, exam_type, category, mode, answered_correct, created_at'
    });
    return await db.study_events.count();
  });

  console.log(`\n回答前 study_events: ${beforeCount}`);

  console.log('\n⚠️  手動操作が必要です:');
  console.log('1. ブラウザで http://127.0.0.1:5176/ を開いてください');
  console.log('2. ActiveRecallを1問回答してください');
  console.log('3. 回答後、Enterキーを押してください');

  // ユーザー入力待ち
  await page.waitForTimeout(30000);

  // 回答後のstudy_events件数を取得
  const afterCount = await page.evaluate(async () => {
    const db = new Dexie('TakkenOS_DB');
    db.version(28).stores({
      study_events: 'event_id, card_id, exam_type, category, mode, answered_correct, created_at'
    });
    const count = await db.study_events.count();
    const latest = await db.study_events.orderBy('created_at').reverse().first();
    return { count, latest };
  });

  console.log(`回答後 study_events: ${afterCount.count}`);
  console.log(`増加判定: ${beforeCount + 1 === afterCount.count ? 'OK' : 'NG'}`);

  if (afterCount.latest) {
    console.log('\n最新event JSON:');
    console.log(JSON.stringify(afterCount.latest, null, 2));
  }

  // 結果を保存
  const result = {
    timestamp: new Date().toISOString(),
    db_stats: dbStats,
    study_events_before: beforeCount,
    study_events_after: afterCount.count,
    study_events_increased: beforeCount + 1 === afterCount.count,
    latest_event: afterCount.latest
  };

  const outputPath = 'C:\\Project vibe\\main\\VCG_INTEGRATED\\宅建ツール\\takken-app\\browser-audit-result.json';
  writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n✅ 結果保存: ${outputPath}`);

  await browser.close();

  // ========== 判定 ==========
  console.log('\n🔍 判定:');
  console.log('='.repeat(70));

  const issues = [];
  const warnings = [];

  // chintai整合性チェック
  if (dbStats.source_questions_chintai !== 500) {
    issues.push(`source_questions_chintaiが500ではない: ${dbStats.source_questions_chintai}`);
  }
  if (dbStats.source_choices_chintai !== 2000) {
    warnings.push(`source_choices_chintaiが2000ではない: ${dbStats.source_choices_chintai}`);
  }

  // ActiveRecall除外チェック
  if (dbStats.active_recall_excluded_null_statement_count > 0) {
    warnings.push(`null_statementの除外あり: ${dbStats.active_recall_excluded_null_statement_count}件`);
  }

  // repair_possibleチェック
  if (dbStats.repair_possible_count > 0 && dbStats.restoration_candidates_auto_ok > 0) {
    warnings.push(`repair_possible(${dbStats.repair_possible_count})とrestoration_candidates.auto_ok(${dbStats.restoration_candidates_auto_ok})が両方存在`);
  }

  // study_eventsチェック
  if (!dbStats.latest_event_sample) {
    issues.push(`latest_event_sampleがnull`);
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

  return result;
}

// 実行
runBrowserAudit().catch(err => {
  console.error('❌ Audit failed:', err);
  process.exit(1);
});
