/**
 * v29移行前監査スクリプト
 * 実測値を取得して矛盾を確認する
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const AUDIT_URL = 'http://127.0.0.1:5176/db-audit.html';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runV29PreAudit() {
  console.log('🔍 v29移行前監査 Start...\n');

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

  // DB監査ページに移動
  console.log('📝 Step 1: Loading DB audit page...');
  await page.goto(AUDIT_URL);
  await page.waitForLoadState('networkidle');
  await sleep(5000);

  // DB実測値を取得
  console.log('📝 Step 2: Getting DB stats...');
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

    const sourceQ = await db.source_questions.toArray();
    const sourceC = await db.source_choices.toArray();

    const chintaiQ = sourceQ.filter(q => q.exam_type === 'chintai');
    const chintaiC = sourceC.filter(c => c.question_id && c.question_id.startsWith('CHINTAI-SQ-'));

    const takkenQ = sourceQ.filter(q => q.exam_type === 'takken');
    const takkenC = sourceC.filter(c => c.id && c.id.startsWith('TAKKEN-SC-'));

    const understandingCards = await db.understanding_cards.toArray();

    // ActiveRecall除外カウント
    const nullStatementCount = understandingCards.filter(c =>
      c.exam_type === 'chintai' && c.is_statement_true === null
    ).length;

    const takkenCards = understandingCards.filter(c => c.exam_type === 'takken');
    const repairPossibleCount = takkenCards.filter(c => {
      const sampleQ = (c.sample_question || '').toLowerCase();
      const hasPlaceholder = sampleQ.includes('この問題') || sampleQ.includes('当該問題');
      const hasRule = !!(c.core_knowledge && c.core_knowledge.rule);
      return hasPlaceholder && hasRule;
    }).length;

    const recoveryPendingCount = await db.metadata.get('takken_source_recovery_pending_count');
    const recoveryPendingValue = recoveryPendingCount ? recoveryPendingCount.value : 0;

    // restoration_candidatesの確認
    const rc = await db.restoration_candidates.toArray();
    const rcAutoOk = rc.filter(c => c.review_status === 'auto_ok').length;
    const rcCandidate = rc.filter(c => c.review_status === 'candidate').length;

    // study_events確認
    const studyEventsCount = await db.study_events.count();
    const latestEvent = await db.study_events.orderBy('created_at').reverse().first();

    return {
      source_questions_total: sourceQ.length,
      source_choices_total: sourceC.length,
      source_questions_chintai: chintaiQ.length,
      source_choices_chintai: chintaiC.length,
      source_questions_takken: takkenQ.length,
      source_choices_takken: takkenC.length,
      understanding_cards_total: understandingCards.length,
      understanding_cards_chintai: understandingCards.filter(c => c.exam_type === 'chintai').length,
      understanding_cards_takken: takkenCards.length,
      active_recall_excluded_null_statement_count: nullStatementCount,
      repair_possible_count: repairPossibleCount,
      recovery_pending_count: recoveryPendingValue,
      restoration_candidates_total: rc.length,
      restoration_candidates_auto_ok: rcAutoOk,
      restoration_candidates_candidate: rcCandidate,
      study_events_count: studyEventsCount,
      latest_event_sample: latestEvent ? JSON.stringify(latestEvent, null, 2) : null,
      db_version: 28
    };
  });

  console.log('\n📊 DB実測値:');
  console.log('='.repeat(60));
  console.log(`DB Version: ${dbStats.db_version}`);
  console.log(`\n[source_questions / source_choices]`);
  console.log(`  source_questions_total: ${dbStats.source_questions_total}`);
  console.log(`  source_choices_total: ${dbStats.source_choices_total}`);
  console.log(`  source_questions_chintai: ${dbStats.source_questions_chintai}`);
  console.log(`  source_choices_chintai: ${dbStats.source_choices_chintai}`);
  console.log(`  source_questions_takken: ${dbStats.source_questions_takken}`);
  console.log(`  source_choices_takken: ${dbStats.source_choices_takken}`);
  console.log(`\n[understanding_cards]`);
  console.log(`  understanding_cards_total: ${dbStats.understanding_cards_total}`);
  console.log(`  understanding_cards_chintai: ${dbStats.understanding_cards_chintai}`);
  console.log(`  understanding_cards_takken: ${dbStats.understanding_cards_takken}`);
  console.log(`\n[ActiveRecall除外]`);
  console.log(`  active_recall_excluded_null_statement_count: ${dbStats.active_recall_excluded_null_statement_count}`);
  console.log(`  repair_possible_count: ${dbStats.repair_possible_count}`);
  console.log(`  recovery_pending_count: ${dbStats.recovery_pending_count}`);
  console.log(`\n[restoration_candidates]`);
  console.log(`  restoration_candidates_total: ${dbStats.restoration_candidates_total}`);
  console.log(`  restoration_candidates_auto_ok: ${dbStats.restoration_candidates_auto_ok}`);
  console.log(`  restoration_candidates_candidate: ${dbStats.restoration_candidates_candidate}`);
  console.log(`\n[study_events]`);
  console.log(`  study_events_count: ${dbStats.study_events_count}`);
  console.log(`  latest_event_sample: ${dbStats.latest_event_sample ? 'EXISTS' : 'NULL'}`);
  console.log('='.repeat(60));

  // 結果を保存
  const outputPath = 'C:\\Project vibe\\main\\VCG_INTEGRATED\\宅建ツール\\takken-app\\v29-pre-audit-result.json';
  writeFileSync(outputPath, JSON.stringify(dbStats, null, 2));
  console.log(`\n✅ Audit result saved to: ${outputPath}`);

  await browser.close();

  // 判定
  console.log('\n🔍 判定:');
  console.log('='.repeat(60));

  const issues = [];
  const warnings = [];

  // chintai数値整合性チェック
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
    console.log('B. 数値矛盾あり・追加監査が必要');
  } else {
    console.log('C. 停止・修正優先');
  }

  return dbStats;
}

// 実行
runV29PreAudit().catch(err => {
  console.error('❌ Audit failed:', err);
  process.exit(1);
});
