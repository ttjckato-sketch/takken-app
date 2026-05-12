# LOCALHOST 5173 Add-Only Formal Restore Report

## Summary
- canonical origin: `http://localhost:5173`
- canonical url: `http://localhost:5173/takken-app/`
- approval code: `APPROVE_LOCALHOST_5173_ADD_ONLY_FORMAL_RESTORE`
- execution mode: add-only / bulkAdd only
- rollback: dry-run only, no actual rollback

## Result
- source_questions restored: 1024
- source_choices restored: 1024
- high_quality_input_units restored: 20
- question_explanations restored: 20
- choice_explanations restored: 12
- human_review_required 28 hold items: excluded

## Before DB
- source_questions_count: 500
- source_choices_count: 2100
- high_quality_input_units_count: 0
- question_explanations_count: 0
- choice_explanations_count: 0

## Dry-run
- expected_source_questions_count: 1524
- expected_source_choices_count: 3024
- expected_hqi_count: 20
- expected_question_explanations_count: 20
- expected_choice_explanations_count: 12
- source_questions_missing_count: 1024
- source_choices_missing_count: 1024
- hqi_missing_count: 20
- question_explanations_missing_count: 20
- choice_explanations_missing_count: 12
- duplicate_id_count: 0
- missing_required_field_count: 0
- validation_failed: 0

## Formal Restore
- source_questions_inserted: 1024
- source_choices_inserted: 1024
- high_quality_input_units_inserted: 20
- question_explanations_inserted: 20
- choice_explanations_inserted: 12
- failed_count: 0
- touched_stores: `source_questions`, `source_choices`, `high_quality_input_units`, `question_explanations`, `choice_explanations`

## After DB
- source_questions_count: 1524
- source_choices_count: 3124
- high_quality_input_units_count: 20
- question_explanations_count: 20
- choice_explanations_count: 12

## Rollback Dry-run
- rollback_dry_run_executed: true
- rollback_executed: false
- rollback_source_questions_target_count: 1024
- rollback_source_choices_target_count: 1024
- rollback_hqi_target_count: 20
- rollback_question_explanations_target_count: 20
- rollback_choice_explanations_target_count: 12

## Notes
- The live localhost profile already contained 2100 `source_choices` before restore, not 2000.
- Of those 2100, 100 were unrelated to `chintai` / `takken`.
- Because the task explicitly forbids delete / overwrite, the restore preserved those 100 rows. Final `source_choices_count` is therefore 3124 rather than the nominal target 3024.
- `question_explanations` / `choice_explanations` in the actual DB use `explanation_id` as the IndexedDB key path, so the runner writes that field while preserving the generated `id` as payload metadata.
