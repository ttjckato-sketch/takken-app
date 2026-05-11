# V30 Phase3-020 20件Pilot 品質監査

**監査日**: 2026-05-11  
**監査対象**: `docs/generated/v30_pilot_question_choice_explanations_phase3_020.json`

## 結論

判定は **B**。

question_explanations 20件は概ね成立していますが、choice_explanations 40件のうち 14件が takken の単一 choice を二重説明しており、`id` が重複しています。  
その結果、見かけ上は 40件でも、実質的に独立した choice_explanations は 26件しかありません。

## 監査サマリー

| 項目 | 結果 |
|---|---:|
| question_explanations_checked | 20 |
| choice_explanations_checked | 40 |
| source_refs_checked | 66 |
| quality_A_valid_count | 46 |
| quality_B_count | 14 |
| quality_C_count | 0 |
| auto_ok_valid_count | 46 |
| auto_ok_should_downgrade_count | 14 |
| human_review_required_count | 14 |
| label_conflict_suspected_count | 0 |
| trap_detected_count | 20 |
| ready_for_import_count | 46 |
| unique_choice_explanations_count | 26 |
| duplicate_choice_id_count | 14 |

## 主要指摘

### 1. takken 側 choice_explanations が重複 ID のまま 2 件ずつ生成されている

- 14件の takken pilot で、`choice_explanations[0]` と `choice_explanations[1]` が同じ `id` / `choice_id` を持っています。
- 差分は `statement_trap_detected` の真偽だけで、独立した別 choice として扱えていません。
- そのため `choice_explanations_generated: 40` は件数上のカウントであり、実質的なユニーク件数は 26 です。

### 2. takken 側 choice_text がプレースホルダのままで、実際の選択肢文に基づく説明になっていない

- 例: `選択肢4（テキスト元データ不足）`
- source_choices が実データ化されていないため、choice_explanations が「実際の選択肢文」に当たらず、説明の独立性が弱いです。
- 生成済み JSON は DB 書込していないので安全ですが、`auto_ok` のまま import 対象にするのは危険です。

### 3. 一部の結論がやや抽象的で、正答を直接返していない

- 例: `v30-pilot-phase3-010` の `correct_conclusion`
  - `事務所等以外でも、買主自ら指定した場所ならクーリング・オフが制限される場面がある。`
- 問題文は解除可否を直接問う形なので、結論は yes/no を先頭に固定した方がよいです。
- 監査上は致命傷ではありませんが、A判定の水準としては弱いです。

## カテゴリ別判定

| カテゴリ | 判定 | コメント |
|---|---|---|
| agricultural_land_law | A | 3条/4条/5条の使い分けは概ね正しい |
| article_35_37 | A | 契約前/契約後、説明/交付の切り分けは良好 |
| brokerage_contract | A | 有効期間・登録・報告の方向性は妥当 |
| cooling_off | B | 結論がやや抽象的で、直接の可否判定として弱い |
| rental_management_law | B | 大筋は妥当だが、要件の精密さが不足する箇所あり |
| lease_law | A | 定期借家と賃料増減額請求の区別は良好 |
| civil_law | A | 詐欺/強迫、無権代理、時効の方向性は妥当 |
| tax_other | A | 不動産取得税と原状回復の整理は概ね妥当 |

## source_refs 監査

| 項目 | 結果 |
|---|---:|
| source_refs_total | 66 |
| source_refs_alignment_ok_count | 66 |
| source_refs_alignment_weak_count | 0 |
| source_refs_mismatch_count | 0 |
| missing_official_support_count | 0 |
| private_site_auto_ok_count | 0 |

## hard stop 監査

| 項目 | 結果 |
|---|---:|
| article_number_error_count | 0 |
| legal_interpretation_error_count | 0 |
| source_refs_mismatch_count | 0 |
| auto_ok_without_source_refs_count | 0 |
| private_site_only_auto_ok_count | 0 |
| label_conflict_ignored_count | 0 |
| db_write_detected | false |
| source_choices_changed | false |
| is_statement_true_changed | false |

## 監査判断

この Pilot は、法令解釈と source_refs の整合は概ね保たれています。  
ただし、choice_explanations の 14件が重複 ID のまま auto_ok になっており、実質的な独立性が不足しています。  
よって、次工程へそのまま渡すには不十分で、**B判定**とします。

