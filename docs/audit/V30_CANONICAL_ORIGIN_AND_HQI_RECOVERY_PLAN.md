# v30 正本origin再定義・HQI復旧設計

**実施日**: 2026-05-11
**担当**: 正本origin再定義・HQI復旧設計担当
**対象**: v30 Phase3-020 20件Pilot生成前のDB状態確認とHQI復旧設計

---

## 1. 状況確認

### 1.1 origin別DB状態

| ポート | dexie_version | source_questions_total | source_choices_total | HQI | 状態 |
|:---:|:---:|:---:|:---:|:---:|:---|
| **5173** | 30 | 1524 | 3024 | **0** | source系データ完備、HQI未投入 |
| **5176** | 30 | 0 | 0 | **0** | 空DB |

### 1.2 問題点

- これまでBatch 1のHQI 20件を投入・監査していた正本DBが不明
- 5176は空DBのため使用不可
- 5173はsource系データが揃っているが、HQI未投入

---

## 2. 5173正本化判定

### 2.1 5173を暫定正本候補にできるか

| 項目 | 判定 | 理由 |
|:---|:---:|:---|
| source_questions_takken = 1024 | ✅ | 正常 |
| source_choices_takken = 1024 | ✅ | 正常 |
| source_questions_chintai = 500 | ✅ | 正常 |
| source_choices_chintai = 2000 | ✅ | 正常 |
| dexie_version = 30 | ✅ | 正常 |
| question_explanations = 0 | ✅ | 未投入で正常 |
| choice_explanations = 0 | ✅ | 未投入で正常 |
| **判定** | **合格** | **5173を暫定正本候補とする** |

### 2.2 既存学習履歴保全確認

5173では以下のstoreが存在し、既存学習履歴が保全されている：

- source_questions: 1524件
- source_choices: 3024件
- study_events: （存在）
- memory_cards: （存在）
- memory_card_progress: （存在）

これらのstoreはHQI復旧では変更しないため、既存学習履歴は保全されます。

---

## 3. HQI Batch1復旧元監査

### 3.1 Batch1データ確認

| 項目 | 結果 |
|:---|:---:|
| batch1_json_exists | ✅ True |
| batch1_topic_count | **20件** |
| source_trace_grade_A_count | **20件** |
| human_review_required_false_count | **20件** |

### 3.2 productionBatchLoader監査

| 項目 | 結果 |
|:---|:---:|
| productionBatchLoader_exists | ✅ True |
| writes_only_high_quality_input_units | ✅ Yes |
| source_choices_write | ❌ No（参照のみ） |
| is_statement_true_write | ❌ No |
| study_events_write | ❌ No |
| uses_add_or_bulkAdd | ✅ hqiStore.add() |
| uses_put_or_bulkPut | ❌ No |
| dry_run_supported | ✅ Yes |
| rollback_dry_run_supported | ✅ Yes |

### 3.3 Safety Guards確認

1. confirm flag必須
2. batch_id validation
3. item count = 20 validation
4. duplicate ID check
5. dry-run validation必須
6. source_trace_grade_A validation（全件）
7. human_review_required_false validation（全件）

---

## 4. 復旧方針

### 4.1 推奨アクション

**A. 5173を暫定正本originとする**

- 理由: source系データが完備しており、既存学習履歴が保全されている
- 5176は空DBのため使用不可

### 4.2 HQI復旧方針

**B. HQI Batch1 20件を5173へ再投入する**

- target_origin: **5173**
- scope: **high_quality_input_unitsのみ**
- source_questions/source_choices: 再投入不要
- question_explanations/choice_explanations: 復旧後に投入

### 4.3 Phase3-020実行タイミング

**C. Phase3-020はHQI復旧後に実施する**

- Phase3-020実施条件: HQI Batch1 20件が投入されていること
- 実施順序:
  1. HQI Batch1復旧（5173）
  2. HQI復旧確認
  3. Phase3-020 20件Pilot生成（5173）

---

## 5. 復旧実行計画

### 5.1 復旧手順

1. **5173でAntigravity Browserを起動**
2. **productionBatchLoader.tsを使用してHQI Batch1を投入**
   - dry-run mode: true で検証
   - dry-run mode: false, confirm: true で本投入
3. **投入確認**: high_quality_input_units_count = 20
4. **Phase3-020実行**: 20件Pilot生成

### 5.2 復旧禁止事項

- source_questions再投入: 禁止
- source_choices再投入: 禁止
- is_statement_true変更: 禁止
- study_events変更: 禁止
- DB削除: 禁止
- DB clear: 禁止

---

## 6. 品質基準

### 6.1 復旧成功基準

- high_quality_input_units_count = 20
- 全件source_trace_grade = A
- 全件human_review_required = false
- 既存学習履歴が保全されている

### 6.2 復旧失敗基準

- high_quality_input_units_count ≠ 20
- 条文番号誤り
- 法令解釈誤り
- 既存学習履歴が破壊されている

---

## 7. 次のステップ

1. **HQI Batch1復旧実行**（5173）
2. **HQI復旧確認**
3. **Phase3-020 20件Pilot生成**（5173）

---

**設計署名**: 正本origin再定義・HQI復旧設計担当
**日付**: 2026-05-11
**ステータス**: 設計完了（復旧実行待ち）
