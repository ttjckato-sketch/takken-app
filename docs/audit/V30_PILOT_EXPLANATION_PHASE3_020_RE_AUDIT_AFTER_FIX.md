# V30 Phase3-020 修正後再監査

**再監査日**: 2026-05-11  
**対象**: `docs/generated/v30_pilot_question_choice_explanations_phase3_020.json`

## 結論

判定は **B**。

重複 ID、placeholder、yes/no 先頭固定は解消済みです。  
一方で、28件の `choice_explanations` が source_question ベースの補正文または未復元相当として `human_review_required=true` に落ちており、`auto_ok` 対象は 32件に限定されます。

## 監査サマリー

| 項目 | 結果 |
|---|---:|
| question_explanations_checked | 20 |
| choice_explanations_checked | 40 |
| source_refs_checked | 66 |
| duplicate_choice_explanation_id_count | 0 |
| placeholder_choice_text_count | 0 |
| yes_no_lead_missing_count | 0 |
| source_question_based_choice_count | 28 |
| source_question_based_choice_auto_ok_count | 0 |
| source_question_based_choice_human_review_required_count | 28 |
| quality_A_valid_count | 32 |
| quality_B_count | 28 |
| quality_C_count | 0 |
| auto_ok_valid_count | 32 |
| auto_ok_should_downgrade_count | 0 |
| human_review_required_count | 28 |
| ready_for_import_count | 32 |

## 監査結果

### 1. ID 監査

- `choice_explanations` 全40件の `id` は一意。
- `duplicate_choice_explanation_id_count = 0` を確認。
- source_choice_id があるものは基本的に追跡可能。
- takken 側は source choice の文面が復元できないため、補正文へ置換したうえで別 ID 化されている。

### 2. choice_text 監査

- `選択肢4（テキスト元データ不足）` のような placeholder は残っていない。
- source_question ベース補正文は 28件。
- これら 28件は `human_review_required=true` に降格されており、`auto_ok` には入っていない。

### 3. yes/no 先頭固定

- cooling_off の結論は yes/no 系の先頭固定になっている。
- rental_management_law も同様。
- 抽象結論だけで終わるものは解消済み。

### 4. auto_ok 妥当性

- `auto_ok` は 32件。
- `auto_ok` は、実 choice 文が成立しているものに限定されている。
- source_question ベース補正文は auto_ok に入っていない。
- したがって `auto_ok_should_downgrade_count = 0` を確認。

## source_refs 監査

| 項目 | 結果 |
|---|---:|
| source_refs_total | 66 |
| source_refs_alignment_ok_count | 66 |
| source_refs_mismatch_count | 0 |
| article_number_error_count | 0 |
| legal_interpretation_error_count | 0 |
| private_site_auto_ok_count | 0 |

## カテゴリ別判定

| カテゴリ | 判定 |
|---|---|
| agricultural_land_law | A |
| article_35_37 | A |
| brokerage_contract | A |
| cooling_off | A |
| rental_management_law | A |
| lease_law | A |
| civil_law | A |
| tax_other | A |

## 再監査判断

再監査の結果、初期の B 判定要因だった

- ID 重複
- placeholder 残存
- yes/no 先頭固定不足

は解消されています。

ただし、source_question ベース補正文 28件は `human_review_required=true` に明確に分離され、`auto_ok` 対象は 32件に限定されています。  
この状態は品質管理としては妥当ですが、**A判定の「完全自動承認」水準にはまだ届いていない**ため、判定は **B** とします。

