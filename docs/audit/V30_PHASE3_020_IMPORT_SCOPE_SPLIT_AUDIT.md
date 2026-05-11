# V30 Phase3-020 Import Scope Split Audit

**監査日**: 2026-05-11  
**対象**: docs/generated/v30_pilot_question_choice_explanations_phase3_020.json

## 結論

判定は **A**。

auto_ok 32件と human_review_required 28件の分離が成立し、auto_ok 側に重複 ID・placeholder・source_question ベース補正文は残っていません。

## 切り出し結果

- total_items: 20
- auto_ok_import_candidate_count: 32
- human_review_hold_count: 28
- question_explanations_auto_ok_count: 20
- choice_explanations_auto_ok_count: 12
- question_explanations_human_review_count: 0
- choice_explanations_human_review_count: 28

## auto_ok 32件監査

- duplicate_id_count: 0
- placeholder_count: 0
- source_question_based_choice_count: 0
- human_review_required_count: 0
- label_conflict_suspected_count: 0
- source_refs_missing_count: 0
- source_refs_mismatch_count: 0
- article_number_error_count: 0
- legal_interpretation_error_count: 0
- ready_for_import_count: 32

## human_review 28件監査

- human_review_required_count: 28
- source_question_based_choice_count: 28
- reason_summary: source_questionベース補正文であり、実source_choice文ではないため正式投入対象外
- formal_import_allowed: false

## 安全性

- DB書込なし
- source_choices変更なし
- is_statement_true変更なし
- commit/push/deployなし
