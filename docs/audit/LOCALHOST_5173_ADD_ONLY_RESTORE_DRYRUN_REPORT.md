# localhost:5173 Add-Only Restore Dry-Run Report

## Summary
- `tools/dev-pages/localhost-5173-add-only-restore-dryrun.html` を修正し、期待集合を `current DB` ではなく静的元データから再構築するように変更した。
- Takken 側は `ULTIMATE_STUDY_DECK.json` を `buildIntegratedCard()` で統合し、`ensureTakkenSourceTransformed()` 相当の read-only 判定で 1024 件の expected set を算出する。
- Chintai 側は `chintai_raw.json` から 500 問 + 2000 肢を ID 単位で再構築する。
- HQI 20 件、v30 explanation 32 件は add-only dry-run 対象としてカウントするが、実 DB へは書き込まない。

## Verification
- 正規 origin: `http://localhost:5173`
- 正規 URL: `http://localhost:5173/takken-app/tools/dev-pages/localhost-5173-add-only-restore-dryrun.html`
- DB: `TakkenOS_DB` / Dexie v30
- Build: PASS

## Observed DB state in the verified Chrome Default copy
- `source_questions_count`: 500
- `source_choices_count`: 2000
- `high_quality_input_units_count`: 0
- `question_explanations_count`: 0
- `choice_explanations_count`: 0
- `understanding_cards_count`: 4269

## Dry-run result
- `expected_source_questions_count`: 1524
- `expected_source_choices_count`: 3024
- `expected_hqi_count`: 20
- `expected_question_explanations_count`: 20
- `expected_choice_explanations_count`: 12
- `human_review_28_excluded`: true
- `source_questions_missing_count`: 1024
- `source_choices_missing_count`: 1024
- `hqi_missing_count`: 20
- `question_explanations_missing_count`: 20
- `choice_explanations_missing_count`: 12
- `duplicate_id_count`: 0
- `missing_required_field_count`: 0
- `validation_failed`: 0
- `db_write_executed`: false

## Source choice breakdown
- `source_choices_2100_reason` field now reports the current breakdown by `chintai / takken / other`.
- In the verified profile, the breakdown was `chintai=2000, takken=0, other=0`.

## Notes
- The runner now uses `resolvePublicAssetPath()` so Vite base `/takken-app/` is respected.
- HQI candidate IDs are synthesized from topic/category text when the source JSON lacks a direct `id`.
- The report confirms the bug is fixed: `source_questions_missing_count` is no longer hardcoded to `0`.
