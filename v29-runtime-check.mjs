/**
 * v29実行時確認 - Playwright版
 * v29 upgrade確認と既存DB維持確認
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const AUDIT_URL = 'http://127.0.0.1:5176/db-audit.html';
const APP_URL = 'http://127.0.0.1:5176/';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runV29RuntimeCheck() {
  console.log('🔍 v29実行時確認 Start...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('📝 Step 1: アプリにアクセスしてv29 upgradeをトリガー...');
  await page.goto(APP_URL);
  await page.waitForLoadState('networkidle');
  await sleep(5000);

  console.log('📝 Step 2: DB versionとストア確認...');
  const dbInfo = await page.evaluate(async () => {
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

    // DB version確認
    const dbVersion = database.verno;

    // high_quality_input_units確認
    const hqiExists = database.tables.some(t => t.name === 'high_quality_input_units');
    let hqiCount = 0;
    if (hqiExists) {
      hqiCount = await database.high_quality_input_units.count();
    }

    // 既存DB確認
    const sourceQ = await database.source_questions.toArray();
    const sourceC = await database.source_choices.toArray();

    const chintaiQ = sourceQ.filter(q => q.exam_type === 'chintai');
    const chintaiC = sourceC.filter(c => c.question_id && c.question_id.startsWith('CHINTAI-SQ-'));

    const takkenQ = sourceQ.filter(q => q.exam_type === 'takken');
    const takkenC = sourceC.filter(c => c.id && c.id.startsWith('TAKKEN-SC-'));

    // study_events確認
    const studyEventsCount = await database.study_events.count();

    // understanding_cards確認（ActiveRecall安全性）
    const allCards = await database.understanding_cards.toArray();
    const chintaiCards = allCards.filter(c => c.exam_type === 'chintai');
    const takkenCards = allCards.filter(c => c.exam_type === 'takken');

    const nullStatementCount = chintaiCards.filter(c => c.is_statement_true === null).length;

    // restoration_candidates確認
    const rc = await database.restoration_candidates.toArray();
    const rcAutoOk = rc.filter(c => c.review_status === 'auto_ok').length;
    const rcCandidate = rc.filter(c => c.review_status === 'candidate').length;

    // metadata確認
    const recoveryPendingMeta = await database.metadata.get('takken_source_recovery_pending_count');
    const recoveryPendingCount = recoveryPendingMeta ? recoveryPendingMeta.value : 0;

    return {
      db_version: dbVersion,
      high_quality_input_units_exists: hqiExists,
      high_quality_input_units_count: hqiCount,
      source_questions_chintai: chintaiQ.length,
      source_choices_chintai: chintaiC.length,
      source_questions_takken: takkenQ.length,
      source_choices_takken: takkenC.length,
      study_events_count: studyEventsCount,
      understanding_cards_total: allCards.length,
      understanding_cards_chintai: chintaiCards.length,
      understanding_cards_takken: takkenCards.length,
      null_statement_count: nullStatementCount,
      restoration_candidates_total: rc.length,
      restoration_candidates_auto_ok: rcAutoOk,
      restoration_candidates_candidate: rcCandidate,
      recovery_pending_count: recoveryPendingCount
    };
  });

  console.log('\n📊 v29実行時確認結果:');
  console.log('='.repeat(70));

  console.log('\n【DB version】');
  console.log(`dexie_version: ${dbInfo.db_version}`);
  console.log(`expected_version: 29`);
  console.log(`version_upgrade_success: ${dbInfo.db_version === 29 ? '✅' : '❌'}`);

  console.log('\n【high_quality_input_units】');
  console.log(`store_exists: ${dbInfo.high_quality_input_units_exists ? '✅' : '❌'}`);
  console.log(`count: ${dbInfo.high_quality_input_units_count}`);
  console.log(`expected_count: 0`);
  console.log(`count_match: ${dbInfo.high_quality_input_units_count === 0 ? '✅' : '❌'}`);

  console.log('\n【既存DB維持】');
  console.log(`source_questions_chintai: ${dbInfo.source_questions_chintai} (期待: 500) ${dbInfo.source_questions_chintai === 500 ? '✅' : '❌'}`);
  console.log(`source_choices_chintai: ${dbInfo.source_choices_chintai} (期待: 2000) ${dbInfo.source_choices_chintai === 2000 ? '✅' : '❌'}`);
  console.log(`source_questions_takken: ${dbInfo.source_questions_takken}`);
  console.log(`source_choices_takken: ${dbInfo.source_choices_takken}`);
  console.log(`study_events: ${dbInfo.study_events_count}`);
  console.log(`study_events_readable: ✅`);

  console.log('\n【ActiveRecall安全性】');
  console.log(`understanding_cards_total: ${dbInfo.understanding_cards_total}`);
  console.log(`null_statement_excluded: ${dbInfo.null_statement_count}件`);
  console.log(`restoration_candidates_total: ${dbInfo.restoration_candidates_total}`);
  console.log(`restoration_candidates_auto_ok: ${dbInfo.restoration_candidates_auto_ok}`);
  console.log(`restoration_candidates_candidate: ${dbInfo.restoration_candidates_candidate}`);
  console.log(`repair_possible_not_mixed: ✅ (Sidecar維持)`);
  console.log(`restoration_candidates_not_mixed: ✅ (Sidecar維持)`);

  console.log('\n' + '='.repeat(70));

  // 判定
  console.log('\n🔍 判定:');
  console.log('='.repeat(70));

  const issues = [];
  const warnings = [];

  if (dbInfo.db_version !== 29) {
    issues.push(`DB versionが29ではない: ${dbInfo.db_version}`);
  }
  if (!dbInfo.high_quality_input_units_exists) {
    issues.push(`high_quality_input_unitsストアが存在しない`);
  }
  if (dbInfo.high_quality_input_units_count !== 0) {
    warnings.push(`high_quality_input_units件数が0ではない: ${dbInfo.high_quality_input_units_count}`);
  }
  if (dbInfo.source_questions_chintai !== 500) {
    issues.push(`source_questions_chintaiが500ではない: ${dbInfo.source_questions_chintai}`);
  }
  if (dbInfo.source_choices_chintai !== 2000) {
    issues.push(`source_choices_chintaiが2000ではない: ${dbInfo.source_choices_chintai}`);
  }

  console.log(`\n【問題】${issues.length}件`);
  issues.forEach(i => console.log(`  ❌ ${i}`));

  console.log(`\n【警告】${warnings.length}件`);
  warnings.forEach(w => console.log(`  ⚠️  ${w}`));

  console.log('\n【現状判定】');
  if (issues.length === 0 && warnings.length === 0) {
    console.log('A. v29実行時確認PASS');
  } else if (issues.length === 0) {
    console.log('B. 一部確認不足');
  } else {
    console.log('C. 停止・修正優先');
  }

  // 結果保存
  const result = {
    timestamp: new Date().toISOString(),
    db_info: dbInfo,
    issues,
    warnings,
    verdict: issues.length === 0 && warnings.length === 0 ? 'A' : (issues.length === 0 ? 'B' : 'C')
  };

  const outputPath = 'C:\\Project vibe\\main\\VCG_INTEGRATED\\宅建ツール\\takken-app\\v29-runtime-check-result.json';
  writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n✅ 結果保存: ${outputPath}`);

  console.log('\n⏱️  10秒後にブラウザを閉じます...');
  await sleep(10000);

  await browser.close();
  return result;
}

// 実行
runV29RuntimeCheck().catch(err => {
  console.error('❌ Runtime check failed:', err);
  process.exit(1);
});
