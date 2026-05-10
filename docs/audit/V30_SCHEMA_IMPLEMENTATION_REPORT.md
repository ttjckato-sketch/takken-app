# v30 Schema Implementation Report

**実施日**: 2026-05-10
**担当**: AI Engineer
**対象**: v30 question_explanations / choice_explanations スキーマ実装

---

## 1. 実装概要

v30として問題別・選択肢別解説ストアをIndexedDB/Dexieに追加しました。

- **old_version**: 29
- **new_version**: 30
- **実装タイプ**: 純増のみ（既存storeへの変更なし）

---

## 2. 追加ストア

### A. question_explanations

目的: 問題全体の読み方・論点・当てはめ・正解理由を保存する

**indexes**:
```
id, question_id, source_question_id, card_id, batch_id, category, review_status, source_trace_grade, confidence, disabled, label_conflict_suspected, human_review_required, created_at, updated_at
```

### B. choice_explanations

目的: 選択肢単位で「なぜ〇/×か」「なぜユーザー回答が違うか」を保存する

**indexes**:
```
id, choice_id, source_choice_id, question_id, source_question_id, card_id, batch_id, category, review_status, source_trace_grade, confidence, disabled, label_conflict_suspected, human_review_required, created_at, updated_at
```

---

## 3. 型定義

### QuestionExplanation

必須フィールド:
- id, source_trace_grade, confidence, review_status, label_conflict_suspected, human_review_required, disabled, created_at, updated_at

オプションフィールド:
- question_id, source_question_id, card_id, batch_id, category
- question_focus, question_type, difficulty, key_phrases
- facts_summary, issue_structure, applicable_rule
- application_to_question, correct_conclusion, why_this_answer
- common_misread, why_user_wrong, trap_points
- memory_hook, memory_hook_type
- related_input_unit_id, source_refs

### ChoiceExplanation

必須フィールド:
- id, source_trace_grade, confidence, review_status, label_conflict_suspected, human_review_required, disabled, created_at, updated_at

オプションフィールド:
- choice_id, source_choice_id, question_id, source_question_id
- card_id, batch_id, category
- statement_text, is_statement_true_snapshot, selected_answer_type
- is_correct, correct_answer_reason, why_true, why_false
- application_to_statement, key_phrases
- rule, exception, trap, why_trap
- one_line_memory, source_refs

---

## 4. 補助型定義

### SourceRef
```typescript
{
  source_type: 'e_gov' | 'mlit' | 'moj' | 'maff' | 'retio' | 'official_exam' | 'other',
  title: string,
  url?: string,
  law_name?: string,
  article?: string,
  checked_at?: number,
  note?: string
}
```

### KeyPhrase
```typescript
{
  phrase: string,
  meaning?: string,
  trap?: string,
  why_important?: string,
  location_in_question?: string
}
```

### TrapPoint
```typescript
{
  trap: string,
  why_trap: string,
  how_to_avoid: string
}
```

---

## 5. 既存Store影響

- **変更なし**: v1〜v29のstore定義を完全維持
- **index変更なし**: 既存storeのindexを変更していない
- **migrationなし**: データ移動なし
- **破壊的変更なし**: 既存データに影響なし

---

## 6. データ投入状態

- **question_explanations_count**: 0
- **choice_explanations_count**: 0

今回はスキーマ実装のみ。データ投入は次のタスクで実施。

---

## 7. 安全性確認

| 項目 | 結果 |
|:---|:---:|
| source_choices変更 | ✅ なし |
| is_statement_true変更 | ✅ なし |
| study_events変更 | ✅ なし |
| memory_cards変更 | ✅ なし |
| restoration_candidates変更 | ✅ なし |
| high_quality_input_units変更 | ✅ なし |
| DB削除 | ✅ なし |
| DB clear | ✅ なし |
| IndexedDB初期化 | ✅ なし |
| Batch 1正式投入再実行 | ✅ なし |
| rollback本実行 | ✅ なし |
| npm install | ✅ なし |
| package.json変更 | ✅ なし |
| package-lock.json変更 | ✅ なし |
| commit | ✅ なし |
| push | ✅ なし |
| deploy | ✅ なし |

---

## 8. Build結果

```
✓ built in 2.33s
```

---

## 9. 変更ファイル

- `src/db.ts` - v30スキーマ追加、型定義追加

---

## 10. 次にやること

1. v30データ投入スクリプト作成（別タスク）
2. explanationMatcher.ts 実装（別タスク）
3. 表示ロジック修正（別タスク）

---

**実施署名**: AI Engineer
**日付**: 2026-05-10
**ステータス**: A - v30スキーマ実装完了
