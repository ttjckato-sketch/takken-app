# V30 HQI Batch1 5173 Formal Restore Report

## 結論
- `high_quality_input_units` のみを対象に、Batch1 20件の正式復旧を実測で完了。
- `source_questions` / `source_choices` / `question_explanations` / `choice_explanations` は不変。
- Rollback は dry-run のみ実施し、実削除は未実行。

## 実測サマリ
- 実行環境: `http://127.0.0.1:5173`
- 正規 runner: `http://127.0.0.1:5173/takken-app/tools/dev-pages/v30-hqi-batch1-5173-formal-restore-runner.html`
- DB 名: `TakkenOS_DB`
- Dexie version: `30`
- Batch1: `20` 件
- Formal import dry-run: `PASS`
- HumanGate: `APPROVE_HQI_BATCH1_5173_FORMAL_RESTORE`
- 正式復旧 insert: `20`
- 失敗件数: `0`
- 重複 ID: `0`
- 変更ストア: `high_quality_input_units` のみ

## 事前 / 事後DB
- 事前 `high_quality_input_units`: `0`
- 事後 `high_quality_input_units`: `20`
- `source_questions_total`: `1524` -> `1524`
- `source_choices_total`: `3024` -> `3024`
- `question_explanations_count`: `0` -> `0`
- `choice_explanations_count`: `0` -> `0`

## Rollback dry-run
- `rollback_dry_run_executed`: `true`
- `rollback_executed`: `false`
- `rollback_target_count`: `20`
- `high_quality_input_units_count_after_rollback_dry_run`: `20`

## 安全性
- `put` / `bulkPut` / `clear` / `deleteDatabase` 未使用
- `source_choices` / `is_statement_true` / `study_events` / `memory_cards` / `memory_card_progress` への書込なし
- `npm install` / `package.json` 変更 / `commit` / `push` / `deploy` なし

## 備考
- Browser 実測は Playwright 経由で Antigravity Browser の CDP コンテキストに接続して実施。
- スクリーンショットは取得処理がタイムアウトしたため、今回は JSON レポートを証跡として採用。
