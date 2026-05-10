# ProductionBatchLoader Batch 1 Dry-Run Report

**実行日時**: 2026-05-10
**Batch ID**: batch1
**実行モード**: DRY_RUN_ONLY

---

## 1. Dry-Run概要

| 項目 | 結果 |
|------|------|
| ステータス | DRY_RUN_PASS |
| DB書込実行 | なし |
| 適用実行 | なし |
| Rollback実行 | なし |

---

## 2. 入力ファイル

**ファイルパス**: `docs/research/high_quality_input_web_research_batch1.json`

| 項目 | 値 |
|------|------|
| ファイル存在 | ✅ |
| 総論点数 | 20 |
| JSON形式 | 有効 |

---

## 3. 変換件数

| 項目 | 値 |
|------|------|
| 総アイテム数 | 20 |
| 変換成功 | 20 |
| 変換失敗 | 0 |
| バリデーション成功 | 20 |
| バリデーション失敗 | 0 |

---

## 4. Source Trace Grade 分布

| Grade | 件数 |
|-------|------|
| A | 20 |
| B | 0 |
| C | 0 |
| D | 0 |

**説明**: 全20論点が最高信頼度（Grade A）の公的ソースに基づいている

---

## 5. Human Review Required 分布

| 状態 | 件数 |
|------|------|
| false (自動審査OK) | 20 |
| true (要人間審査) | 0 |

**説明**: 全20論点が自動審査OK候補

---

## 6. カテゴリ分布

| カテゴリ | 件数 |
|----------|------|
| 宅建業法 | 7 |
| 権利関係 | 6 |
| 法令上の制限 | 5 |
| 賃貸管理士 | 2 |
| �その他 | 1 |

---

## 7. 必須フィールド確認

全20論点について以下の必須フィールドを確認：

✅ **確認済みフィールド**:
- id (unit_id)
- source_item_id
- batch_id
- origin
- category
- review_status
- source_trace_grade
- visual_type
- disabled
- created_at
- updated_at
- title
- conclusion
- why (reasoning)
- rule (principle)
- exception
- trap (trap_points)
- comparison
- source_url
- source_title

---

## 8. 品質確認

| 項目 | 結果 |
|------|------|
| source_trace_grade_A | 20件 |
| human_review_required_false | 20件 |
| 公的ソースのみ | 20件 (e-Gov, 国交省) |
| 民間サイトのみ | 0件 |
| 比較情報あり | 20件 |
| ひっかけ情報あり | 20件 |

---

## 9. バリデーション結果

| 項目 | 結果 |
|------|------|
| ID重複 | なし |
| 必須フィールド欠落 | なし |
| 禁止リスクフラグ混入 | なし |
| 衝突（既存データ） | 未検出（DB未投入のため） |
| source_trace欠落 | なし |

---

## 10. 正式投入可能候補

**全20論点が正式投入可能候補**

### 投入推奨論点（高優先度）:

1. **35条書面（重要事項説明）** - 宅建業法
2. **37条書面（契約書）** - 宅建業法
3. **クーリング・オフ** - 宅建業法
4. **媒介契約（一般・専任・専属専任）** - 宅建業法
5. **抵当権（物上代位）** - 権利関係
6. **代理（無権代理と表見代理）** - 権利関係
7. **借地借家法（定期建物賃貸借）** - 権利関係
8. **建築基準法（接道義務と42条2項道路）** - 法令上の制限
9. **都市計画法（開発許可）** - 法令上の制限
10. **用途地域** - 法令上の制限
11. **農地法（3条・4条・5条）** - 法令上の制限
12. **建ぺい率 / 容積率** - 法令上の制限
13. **原状回復ガイドライン** - 賃貸管理士
14. **賃貸住宅管理業法（業務管理者）** - 賃貸管理士
15. **賃貸住宅管理業法（管理受託契約の重要事項説明）** - 賃貸管理士
16. **賃貸住宅管理業法（サブリース事業者の不当な勧誘等の禁止）** - 賃貸管理士

---

## 11. 保留候補

**なし** - 全20論点が投入可能

---

## 12. DB Write未実行確認

| 項目 | 確認 |
|------|------|
| db.high_quality_input_units.put() 実行 | なし |
| db.high_quality_input_units.bulkPut() 実行 | なし |
| db.high_quality_input_units.add() 実行 | なし |
| DB書込実行フラグ | false |

---

## 13. high_quality_input_units_count 前後比較

| 項目 | 値 |
|------|------|
| 実行前 | 0 |
| 実行後 | 0 |
| 変化 | なし |

**説明**: dry-runのためDB書込を実行していない

---

## 14. 安全性確認

| 項目 | 結果 |
|------|------|
| DB削除 | なし |
| DB clear | なし |
| IndexedDB初期化 | なし |
| source_choices変更 | なし |
| is_statement_true変更 | なし |
| Batch正式投入 | なし |
| npm install | なし |
| package.json変更 | なし |
| package-lock.json変更 | なし |

---

## 15. 次にやること

1. **Batch 1正式投入審査**: dry-runレポートの確認と正式投入の可否判断
2. **正式投入実施**: 審査OKの場合、high_quality_input_unitsへの本投入実行

---

## 16. 結論

**ProductionBatchLoader Batch 1 dry-runはPASS**

- 全20論点がバリデーションを通過
- source_trace_grade A = 20
- human_review_required false = 20
- 必須フィールドの欠落なし
- 禁止リスクフラグの混入なし
- DB書込は実行していない

**推奨**: 正式投入へ進んでOK
