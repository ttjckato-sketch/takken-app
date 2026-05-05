# 宅建Source安全母集団固定監査レポート (2026-05-03)

## 1. 監査サマリー
宅建データのバックフィル処理により生成された `source_questions` および `source_choices` の整合性を確認し、ActiveRecallで安全に使用可能な1024件の母集団を「安全母集団（Safe Pool）」として固定した。

## 2. 統計値 (2026-05-03時点)
- **takken_source_raw_candidate_count**: 1046
- **takken_safe_active_recall_pool_count**: 1024
- **takken_source_questions_count**: 1024
- **takken_source_choices_count**: 1024
- **source_choices_per_question_distribution**: `{ "1": 1024 }`
- **eligible_but_not_sourced_count**: 22
- **short_text_excluded_count**: 2
- **duplicate_overwrite_excluded_count**: 20
- **broken_or_unknown_count (recovery_pending)**: 2621

## 3. 実装仕様
- **takken_is_full_choice_reconstruction**: false (現在は正解肢からの復元のみ)
- **source_generation_method**: correct_patterns_statement (正解肢テキストを問題文として利用)

## 4. 除外基準 (ActiveRecall安全ガード)
以下の条件に該当するカードは、ActiveRecallの出題対象から自動的に除外されることを確認済み。
1. `is_statement_true` が `null` のもの
2. `recovery_pending` フラグが立っているもの
3. `short_text` 除外対象 (3文字以下など)
4. 個数問題 (`count_combination`) 系

## 5. 判定
**PASS**: 1024件の母集団はID重複および品質基準をクリアしており、ActiveRecallにおいて「実カード」として運用可能な状態である。
