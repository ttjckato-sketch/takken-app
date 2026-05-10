# v29移行前監査報告

## 【現状判定】
B. 数値矛盾あり・追加監査が必要

## 【git status】
```
変更ファイル多数:
- src/db.ts
- src/components/learning/InputUnitViewer.tsx
- src/components/learning/MemoryRecallView.tsx
- src/components/learning/RepairPreview.tsx
- src/types/inputUnit.ts
- src/utils/highQualityDataLoader.ts
- src/utils/inputUnitPrototypes.ts

未追跡ファイル:
- v29-pre-audit.mjs
- v29_audit.py
- src/utils/productionBatchLoader.ts
- src/utils/v29SchemaDryRun.ts
```

## 【build】
npm run build: PASS
```
✓ built in 2.20s
```

## 【DB version】
- dexie_version: 28
- v29_store_exists: false
- v29_dry_run_only: true (v29SchemaDryRun.tsがdry-run検証用として存在)

## 【source実測】
⚠️ **注意**: DB内の実測値ではなく、コード上の期待値

| 項目 | 値 | 備考 |
|------|-----|------|
| source_questions_total | 未実測 | DBアクセスが必要 |
| source_choices_total | 未実測 | DBアクセスが必要 |
| source_questions_chintai | 500 | chintaiDataTransformer.tsの期待値 |
| source_choices_chintai | 2000 | chintaiDataTransformer.tsの期待値 |
| source_questions_takken | 未実測 | DBアクセスが必要 |
| source_choices_takken | 未実測 | DBアクセスが必要 |

## 【chintai数値整合性】
- source_questions_chintai は500か: 期待値通り
- source_choices_chintai は2000か: 期待値通り
- **前回報告の source_questions_chintai:2000 の原因**:
  - source_questionsとsource_choicesの定義が混ざっている可能性あり
  - 実測値の確認が必要

## 【ActiveRecall安全性 実測】
⚠️ **注意**: 実測値ではなく、コード上の集計ロジック

| 項目 | 値 | 備考 |
|------|-----|------|
| active_recall_total_candidate_count | 未実測 | - |
| active_recall_eligible_count | eligible | takkenSourceTransformer.ts |
| active_recall_excluded_null_statement_count | 未実測 | - |
| active_recall_excluded_recovery_pending_count | recoveryPending | - |
| active_recall_excluded_broken_count | broken | - |
| active_recall_excluded_count_combination_count | excludedCountCombo | - |
| null_statement_breakdown | 未実測 | - |
| repair_possible_count | 未実測 | DBアクセスが必要 |
| **推定値の有無** | **あり** | コード上の集計値のみ |

## 【repair_possible / Sidecar確認】
- repair_possibleの根拠: `takkenCards.filter(c => hasPlaceholder && hasRule)`
- 正式データかSidecar候補か: **restoration_candidatesテーブル（Sidecar）**
- ActiveRecall対象に混ざっていないか: FORBIDDEN_RISKSで保護
- source_choicesへ直接混ぜていないか: productionBatchLoader.tsで検証

## 【study_events 実UI確認】
⚠️ **注意**: 未実測（ブラウザでの操作が必要）

| 項目 | 値 |
|------|-----|
| 回答前 study_events | 未実測 |
| 回答後 study_events | 未実測 |
| 増加判定 | 未確認 |
| latest_event_sample JSON | 未取得 |
| 実カードID | 未確認 |
| mode | 未確認 |
| selected_answer | 未確認 |
| correct_answer | 未確認 |
| answered_correct | 未確認 |

## 【Focus 10Q】
- InputUnit件数: **23件**
- Input Unit任意表示: 実装済み
- すぐ解く導線: 実装済み
- 強制読了なし: 実装済み
- Input Unitなし時: fallback表示実装済み
- **判定**: 実装完了

Input Unitカテゴリ分布:
- 宅建業法: 14件
- 権利関係: 3件
- 法令上の制限: 6件

## 【RepairPreview】
- 誤答時表示: 実装済み (RepairPreview.tsx)
- 正解時非表示: 実装済み
- fallback: 実装済み (unit=null時の表示)
- 対応済みInput Unit件数: 23件
- 比較表: 実装済み (comparisonフィールド)
- **判定**: 実装完了

## 【v29 readiness】
v29へ進んでよいか: **B. 数値矛盾あり・追加監査が必要**

**止めるべき理由**:
1. source_questions_chintaiの実測値が未確認
2. ActiveRecall除外数の実測値が未確認
3. repair_possibleの扱いが不明（Sidecar候補か正式データか）
4. study_eventsの実UI確認が未実施

**v29実装前に必要な作業**:
1. DB内の実測値を取得する（db-audit.htmlをブラウザで開く）
2. source_questions_chintai = 500を確認する
3. repair_possibleがActiveRecall対象に混ざっていないか確認する
4. study_eventsが+1されるか実UIで確認する

## 【次にやること】
1. ブラウザで http://127.0.0.1:5176/db-audit.html を開いて実測値を確認する
2. ブラウザで http://127.0.0.1:5176/activerecall-test.html を開いてstudy_eventsの+1を確認する
