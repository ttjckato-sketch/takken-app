# v30 Explanation Dry-run Output Quality Audit Report

**監査日**: 2026-05-10
**監査担当**: AI Engineer
**監査対象**: v30解説データdry-run出力品質監査

---

## 1. 監査概要

| 項目 | 結果 |
|:---|:---:|
| build | ✅ PASS (2.33s) |
| ファイル存在 | ✅ 完了 |
| 実装安全性 | ✅ DB writeなし |
| 整合性 | ✅ 定義明確 |
| **内容品質** | ⚠️ **問題あり** |

---

## 2. ファイル確認

| ファイル | 存在 |
|:---|:---:|
| src/utils/v30ExplanationDryRunGenerator.ts | ✅ |
| docs/audit/V30_EXPLANATION_DRY_RUN_IMPLEMENTATION_REPORT.md | ✅ |
| docs/audit/v30_explanation_dry_run_implementation_report.json | ✅ |

---

## 3. Dry-run結果整合性確認

### 3.1 定義確認

| 項目 | 定義 | 内容 |
|:---|:---|:---|
| ready_for_formal_import_count | quality_A_count (line 389) | question + choice 両方含む |
| quality_A_count | allItems.filter (line 367) | question + choice 両方含む |
| source_trace_grade_A_count | allItems.filter (line 387) | question + choice 両方含む |

### 3.2 整合性評価

✅ **整合性は取れている**

- ready_for_formal_import_count = quality_A_count
- すべてのカウントは question + choice の合計
- generated_question_explanations_count (15) + generated_choice_explanations_count (45) = 60
- quality_A_count = 15 は60件中15件

---

## 4. サンプル品質監査

### 4.1 監査方法

実装ロジックのコード監査（ブラウザ実行なし）

### 4.2 汎用文の使用

**問題**: 実装ロジックで汎用テンプレート文を使用

| フィールド | 実装内容 | 問題 |
|:---|:---|:---|
| question_focus | `${sq.category}に関する問題` | ❌ テンプレート文 |
| facts_summary | `${sq.category}の事実関係` | ❌ テンプレート文 |
| application_to_question | `この問題文への具体的な当てはめ。法令の要件を問題の事実に適用する。` | ❌ 汎用文 (68文字) |
| correct_conclusion | `正解の結論` | ❌ 汎用文 |
| why_this_answer | `なぜ正解がその結論になるのか。法令の根拠に基づき説明。` | ❌ 汎用文 (34文字) |
| memory_hook | `1行暗記フレーズ` | ❌ 汎用文 |
| trap_points | `ひっかけポイント` | ❌ テンプレート文 |
| correct_answer_reason | `正解の理由。法令に基づき説明。` | ❌ 汎用文 |

### 4.3 source_refs確認

✅ **妥当**

- source_type: 'e_gov'
- url: https://elaws.e-gov.go.jp/document?lawid=...
- 実在URL

### 4.4 auto_ok判定の問題

**問題**: 長さだけで判定、内容を確認していない

```javascript
const hasApp = (qeApp && qeApp.length > 30) || (ceApp && ceApp.length > 30);
return grade === 'A' && hasApp;
```

- application_to_questionは68文字（汎用文だが30文字超）
- これでquality_Aと判定されている
- 実際の内容はquality_Cレベル

### 4.5 品質判定の現実

**実装上のquality_A**: 15件
**実質的な品質**: quality_C (汎用文のみ)

---

## 5. Label Conflict 検出

### 5.1 検出ロジック

```javascript
label_conflict_suspected: sc.is_statement_true === null
```

### 5.2 評価

⚠️ **最低限機能**

- is_statement_true === null のみ検出
- その他の正誤疑義パターンは未検出
- 特に農地法、競売、公売、市街化区域内外、3条/4条/5条、買受適格証明などの注意が必要なケースに対応不足

---

## 6. 安全性監査

| 項目 | 結果 |
|:---|:---:|
| add / bulkAdd 使用 | ❌ なし |
| put / bulkPut 使用 | ❌ なし |
| delete / clear 使用 | ❌ なし |
| source_choices変更 | ❌ なし |
| is_statement_true変更 | ❌ なし |
| DB write | ❌ なし |

✅ **安全性は問題なし**

---

## 7. 監査結論

### 7.1 判定

**B - 一部修正必要**

### 7.2 問題点

1. **汎用文の使用**: 実装ロジックがテンプレート文を使用している
2. **auto_ok判定が甘い**: 長さだけで判定、内容を確認していない
3. **quality_A_countが過大**: 実質quality_CだがAと判定されている
4. **ready_for_formal_import_count = 15**: 実際には本投入不可

### 7.3 推奨対応

1. **汎用文の削除**: 実際の問題文に即した内容を生成する
2. **auto_ok判定の厳格化**: 内容品質を確認する
3. **品質基準の再定義**: application_to_questionが具体性を持っているか確認

---

## 8. 次のステップ

1. **生成ロジックの修正**: 汎用文を削除、問題文に即した内容を生成
2. **品質判定の厳格化**: 内容ベースの品質判定
3. **実行時確認**: 修正後の実装でブラウザ実行

---

**監査署名**: AI Engineer
**日付**: 2026-05-10
**ステータス**: B - 一部修正必要
