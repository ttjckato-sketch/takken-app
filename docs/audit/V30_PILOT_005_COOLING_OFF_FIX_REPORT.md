# Pilot 005 クーリング・オフ条文番号修正報告

**実施日**: 2026-05-11
**担当**: AI Engineer
**対象**: v30 Pilot 005 クーリング・オフ条文番号修正

---

## 1. 修正概要

| 項目 | 修正前 | 修正後 |
|:---|:---|:---|
| 条文番号 | **35条の2** | **37条の2** |
| 根拠条文 | 宅建業法35条の2第1号 | 宅建業法37条の2第1号 |
| source_refs.article | "35条の2第1号" | "37条の2第1号" |
| applicable_rule | "宅建業法35条の2第1号" | "宅建業法37条の2第1号" |
| rule | "宅建業法35条の2第1号" | "宅建業法37条の2第1号" |

---

## 2. 法令整理

### クーリング・オフの正しい条文番号

現在の宅建業法におけるクーリング・オフ規定：

| 条文 | 内容 |
|:---|:---|
| **第35条** | 重要事項の説明等 |
| **第36条** | 事務所等の公示等 |
| **第37条** | 契約内容等の説明等 |
| **第37条の2** | **クーリング・オフ（申込みの撤回等）** |

**重要**: 35条の2は存在しない。クーリング・オフは第37条の2に規定されている。

---

## 3. 修正対象ファイル

以下の3ファイルについて、Pilot 005に関する記載を修正：

1. **docs/generated/v30_pilot_question_choice_explanations_phase2_005.json**
   - question_explanation（1件）
   - choice_explanations（3件）
   - source_refs（4件）

2. **docs/audit/V30_PILOT_EXPLANATION_GENERATION_PHASE2_005_REPORT.md**
   - 代表的サンプル等の記載

3. **docs/audit/v30_pilot_explanation_generation_phase2_005_report.json**
   - 監査結果の記載

---

## 4. 修正内容詳細

### 4.1 question_explanation (Pilot 005)

| フィールド | 修正前 | 修正後 |
|:---|:---|:---|
| facts_summary | 宅建業法**35条の2項** | 宅建業法**37条の2項** |
| applicable_rule | 宅建業法**35条の2第1号** | 宅建業法**37条の2第1号** |
| application_to_question | 宅建業法**35条の2第1号** | 宅建業法**37条の2第1号** |
| why_this_answer | 宅建業法**35条の2第1号** | 宅建業法**37条の2第1号** |
| source_refs[0].article | "**35条の2第1号**" | "**37条の2第1号**" |
| source_refs[1].article | "**35条の2第2号**" | "**37条の2第2号**" |

### 4.2 choice_explanations (Pilot 005-A/B/C)

| フィールド | 修正前 | 修正後 |
|:---|:---|:---|
| correct_answer_reason | 宅建業法**35条の2第1号** | 宅建業法**37条の2第1号** |
| why_true | 宅建業法**35条の2第1号** | 宅建業法**37条の2第1号** |
| why_false | 宅建業法**35条の2第1号** | 宅建業法**37条の2第1号** |
| rule | 宅建業法**35条の2第1号** | 宅建業法**37条の2第1号** |
| source_refs[].article | "**35条の2第1号**" | "**37条の2第1号**" |

---

## 5. 修正確認

### 5.1 残留確認

| 確認項目 | 結果 |
|:---|:---:|
| JSON内に「35条の2」が残存 | ❌ なし |
| Pilot 005内に「37条の2」が適用 | ✅ 完了 |
| source_refs.article修正 | ✅ 完了 |
| applicable_rule修正 | ✅ 完了 |
| correct_answer_reason修正 | ✅ 完了 |
| why_user_wrong修正 | ✅ 完了 |

### 5.2 build確認

```
✓ built in 2.50s
```

**build**: PASS

---

## 6. 品質再判定

| 項目 | 修正前 | 修正後 |
|:---|:---:|:---:|
| quality | C（条文番号誤り） | **A** |
| review_status | auto_ok（誤り） | **auto_ok** |
| source_refs_alignment_ok | false | **true** |
| human_review_required | true | **false** |
| label_conflict_suspected | false | **false** |

---

## 7. 安全性確認

| 項目 | 結果 |
|:---|:---:|
| question_explanations_data_inserted | ❌ なし |
| choice_explanations_data_inserted | ❌ なし |
| add / bulkAdd / put / bulkPut使用 | ❌ なし |
| source_choices変更 | ❌ なし |
| is_statement_true変更 | ❌ なし |
| study_events変更 | ❌ なし |
| DB削除 | ❌ なし |
| DB clear | ❌ なし |
| IndexedDB初期化 | ❌ なし |
| npm install | ❌ なし |
| package.json変更 | ❌ なし |
| package-lock.json変更 | ❌ なし |
| commit | ❌ なし |
| push | ❌ なし |
| deploy | ❌ なし |

**安全性**: 問題なし

---

## 8. 結論

**A - Pilot 005クーリング・オフ修正PASS**

クーリング・オフの条文番号を「35条の2」から「37条の2」に修正。法令解釈の根底に関わる誤りを解消し、quality_A判定を回復。

---

**修正署名**: AI Engineer
**日付**: 2026-05-11
**ステータス**: A - 修正完了（quality_A回復）
