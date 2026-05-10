# v30 問題別・選択肢別解説スキーマ設計

**設計日**: 2026-05-10
**設計担当**: AI Engineer (Claude / Gemini Pro)
**バージョン**: v30
**目的**: 問題別・選択肢別の当てはめ解説を保存するスキーマ設計

---

## 1. 設計背景

### 1.1 現状の課題

監査結果（QUESTION_LEVEL_EXPLANATION_QUALITY_AUDIT）より:

| 項目 | 結果 | 問題 |
|:---|:---|:---|
| sample_checked | 15問 | - |
| generic_message_only_count | 14件 | 93.3%が汎用文 |
| specific_application_present_count | 1件 | 6.7%のみ問題別解説 |
| quality_A_count | 1件 | 6.7%のみ十分な解説 |
| quality_C_count | 14件 | 93.3%が解説不足 |

### 1.2 原因分析

1. **high_quality_input_units は論点単位教材**
   - 個別問題の回答理由までは持っていない
   - カバレッジ: 20件 / 1524カード = 1.3%

2. **fallback時に汎用文しか出ない**
   - RepairPreview.tsx の fallback が汎用ヒントのみ
   - 「なぜ〇/×か」「この問題文への当てはめ」がない

3. **TAKKEN_PROTOTYPE_UNITS の誤マッチ**
   - 相続プロトタイプが賃貸問題に誤マッチ

4. **source_choice / card_id 単位の解説データが存在しない**
   - source_choices.explanation は不十分
   - 問題別の当てはめ解説を持つテーブルがない

### 1.3 設計目的

- 問題別の「なぜ〇/×か」を保存する
- 問題文への具体的な当てはめを保存する
- 選択肢別の解説を保存する
- 既存データ（source_choices, is_statement_true）は変更しない
- 正誤疑義は sidecar 的に記録する

---

## 2. DB設計

### 2.1 新バージョン

**new_db_version**: 30

### 2.2 追加するストア

| ストア名 | 目的 | Primary Key |
|:---|:---|:---|
| **question_explanations** | 問題全体の解説を保存 | id |
| **choice_explanations** | 選択肢別の解説を保存 | id |

### 2.3 question_explanations ストア

#### 2.3.1 型定義

```typescript
export interface QuestionExplanation {
    // === Primary Keys ===
    id: string;                    // format: QE-{card_id}
    question_id: string;           // understanding_cards.card_id
    source_question_id?: string;   // source_questions.id (if exists)
    card_id: string;               // understanding_cards.card_id (duplicate for index)

    // === 問題の焦点 ===
    question_focus: string;        // この問題は何を聞いているか（問題別記述）
    question_type: string;         // 論点タイプ（例: "3条vs4条vs5条の違い"）
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';

    // === 重要語句 ===
    key_phrases: Array<{
        phrase: string;            // 問題文の重要語句
        why_important: string;     // なぜ重要か
        location_in_question: string; // 問題文のどこにあるか
    }>;

    // === 事実関係整理 ===
    facts_summary: string;         // 事実関係の整理（問題別）
    issue_structure: string;       // 論点構造（誰が誰に何をしたか）

    // === 適用ルール ===
    applicable_rule: string;       // 適用されるルール（条文番号など）
    rule_source: string;           // ルールの出典（例: "農地法3条1項"）
    article_or_section: string;    // 条文項番

    // === 問題文への当てはめ ===
    application_to_question: string;  // この問題文への具体的な当てはめ
    correct_conclusion: string;      // 正解の結論
    why_this_answer: string;         // なぜ正解が〇/×なのか（問題別）

    // === 誤答理由 ===
    common_misread: string;        // よくある誤読
    why_user_wrong: string;        // なぜユーザーが誤答するのか（問題別）

    // === ひっかけポイント ===
    trap_points: Array<{
        trap: string;              // ひっかけ内容
        why_trap: string;          // なぜひっかけなのか
        how_to_avoid: string;      // どう回避するか
    }>;

    // === 記憶のフック ===
    memory_hook: string;           // 1行暗記（問題別）
    memory_hook_type: 'mnemonic' | 'comparison' | 'one_liner' | 'formula';

    // === 関連教材 ===
    related_input_unit_id?: string; // high_quality_input_units.id (if exists)
    related_input_unit_batch?: string; // batch_id of related HQI

    // === 根拠ソース ===
    source_refs: Array<{
        source_type: 'e_gov' | 'mlit' | 'moj' | 'maff' | 'retio' | 'official_exam' | 'internal_db' | 'human_note';
        title: string;
        ref: string;               // URL or citation
        article_or_section?: string;
        checked_at: number;
        note?: string;
    }>;

    // === 品質管理 ===
    source_trace_grade: 'A' | 'B' | 'C' | 'D';  // 根拠の質
    confidence: 'high' | 'medium' | 'low';     // 信頼度
    review_status: 'candidate' | 'auto_ok' | 'human_review_required' | 'rejected';
    label_conflict_suspected: boolean;          // 正誤ラベル疑義フラグ
    label_conflict_reason?: string;             // 疑義の理由
    human_review_required: boolean;             // 人間レビュー要フラグ
    human_review_notes?: string;                // レビュー担当者メモ

    // === メタデータ ===
    disabled: boolean;
    created_at: number;
    updated_at: number;
    created_by: 'ai_generated' | 'human_created' | 'hybrid';
    batch_id?: string;             // データ投入バッチ（例: "explanations_batch1"）
}
```

#### 2.3.2 Index設計

```typescript
// Primary Index
id: string

// Secondary Indexes
question_id: string;
card_id: string;
review_status: string;
source_trace_grade: string;
category: string;  // derived from card_id or explicit
batch_id: string;
disabled: number; // for querying non-disabled
```

### 2.4 choice_explanations ストア

#### 2.4.1 型定義

```typescript
export interface ChoiceExplanation {
    // === Primary Keys ===
    id: string;                    // format: CE-{source_choice_id}
    choice_id: string;             // source_choices.id
    source_choice_id: string;      // source_choices.id (duplicate for index)
    card_id: string;               // understanding_cards.card_id
    question_id: string;           // source_choices.question_id

    // === 選択肢テキスト ===
    statement_text: string;        // 選択肢テキスト（問題別）
    is_statement_true_snapshot: boolean | null;  // is_statement_true のスナップショット
    selected_answer_type: 'true' | 'false' | 'option_1' | 'option_2' | 'option_3' | 'option_4' | 'neutral';

    // === 正解の理由 ===
    correct_answer_reason: string; // 正解の理由（問題別）
    is_correct: boolean;           // この選択肢が正解か

    // === なぜ正/誤か ===
    why_true: string;              // なぜ正しいのか（問題別）
    why_false: string;             // なぜ誤りなのか（問題別）
    why_user_wrong?: string;       // なぜユーザーが誤答するのか（問題別）

    // === 問題文への当てはめ ===
    application_to_statement: string;  // この選択肢文への当てはめ

    // === 重要語句 ===
    key_phrases: Array<{
        phrase: string;            // 選択肢の重要語句
        meaning: string;           // 意味
        trap?: string;             // ひっかけの場合
    }>;

    // === 適用ルール ===
    rule: string;                  // 適用されるルール
    exception?: string;            // 例外がある場合

    // === ひっかけ ===
    trap?: string;                 // ひっかけ内容
    why_trap?: string;             // なぜひっかけなのか

    // === 比較 ===
    compare_with?: Array<{
        option_no: number;         // 比較対象の選択肢
        difference: string;        // 違い
    }>;

    // === 記憶のフック ===
    one_line_memory: string;       // 1行暗記（選択肢別）

    // === 根拠ソース ===
    source_refs: Array<{
        source_type: 'e_gov' | 'mlit' | 'moj' | 'maff' | 'retio' | 'official_exam' | 'internal_db' | 'human_note';
        title: string;
        ref: string;
        article_or_section?: string;
        checked_at: number;
        note?: string;
    }>;

    // === 品質管理 ===
    source_trace_grade: 'A' | 'B' | 'C' | 'D';
    confidence: 'high' | 'medium' | 'low';
    review_status: 'candidate' | 'auto_ok' | 'human_review_required' | 'rejected';
    label_conflict_suspected: boolean;          // 正誤ラベル疑義フラグ
    label_conflict_reason?: string;             // 疑義の理由
    suspected_correct_answer?: boolean;         // 疑われる正解
    human_review_required: boolean;
    human_review_notes?: string;

    // === メタデータ ===
    disabled: boolean;
    created_at: number;
    updated_at: number;
    created_by: 'ai_generated' | 'human_created' | 'hybrid';
    batch_id?: string;
}
```

#### 2.4.2 Index設計

```typescript
// Primary Index
id: string

// Secondary Indexes
choice_id: string;
source_choice_id: string;
card_id: string;
question_id: string;
review_status: string;
source_trace_grade: string;
batch_id: string;
disabled: number;
```

---

## 3. データ連携

### 3.1 source_questions との紐付け

```
source_questions (v1)
    ↓ source_question_id
question_explanations.choice_explanations
    ↓ question_id
source_choices (v1)
```

### 3.2 source_choices との紐付け

```
source_choices (v1)
    ↓ source_choice_id (Read-Only)
choice_explanations (v30)
    ↑
    source_choices は直接変更しない
```

**重要**: source_choices テーブルは直接変更しない

### 3.3 understanding_cards との紐付け

```
understanding_cards (v1)
    ↓ card_id
question_explanations.choice_explanations
```

### 3.4 high_quality_input_units との関係

```
high_quality_input_units (v29)
    ↓ related_input_unit_id
question_explanations (v30)

high_quality_input_units は論点教材として残す
question_explanations は問題別解説として追加
```

### 3.5 memory_cards / study_events / restoration_candidates とは混ぜない

- memory_cards: 記憶カード（v2）
- study_events: 学習イベント（v27）
- restoration_candidates: 教材復元候補（v28）
- question_explanations: 問題別解説（v30、新規）
- choice_explanations: 選択肢別解説（v30、新規）

---

## 4. Migration方針

### 4.1 v29 → v30 Migration

```typescript
this.version(30).stores({
  // 既存ストア（変更なし）
  understanding_cards: 'card_id, category, *tags, exam_type, disabled',
  source_questions_chintai: 'id, exam_type, year, question_no, category, source_url',
  source_questions_takken: 'id, exam_type, year, question_no, category, source_url',
  source_choices: 'id, question_id, option_no, is_exam_correct_option',
  memory_cards: 'memory_card_id, unit_id, exam_type, category, *tags, card_type, confidence',
  confusion_pairs: 'pair_id, exam_type, category, left_term, right_term',
  memory_card_progress: 'card_id, last_reviewed_at',
  memory_study_events: 'event_id, card_id, mode, created_at',
  restoration_candidates: 'restoration_id, source_choice_id, source_question_id, exam_type, category, restore_reason, review_status, confidence',
  high_quality_input_units: 'id, source_item_id, batch_id, origin, category, review_status, source_trace_grade, visual_type, disabled, created_at, updated_at',

  // v30 新規ストア
  question_explanations: 'id, question_id, card_id, review_status, source_trace_grade, batch_id, disabled, created_at',
  choice_explanations: 'id, choice_id, source_choice_id, card_id, question_id, review_status, source_trace_grade, batch_id, disabled, created_at'
}).upgrade(async (tx) => {
  // Migration ロジック（初回は空データ）
  // 既存データの変更なし
  // 新規ストアの初期化のみ
});
```

### 4.2 Rollback方針

```typescript
// v30 → v29 Rollback
this.version(29).stores({
  // v30 のストアを削除して v29 に戻す
  understanding_cards: 'card_id, category, *tags, exam_type, disabled',
  source_questions_chintai: 'id, exam_type, year, question_no, category, source_url',
  source_questions_takken: 'id, exam_type, year, question_no, category, source_url',
  source_choices: 'id, question_id, option_no, is_exam_correct_option',
  memory_cards: 'memory_card_id, unit_id, exam_type, category, *tags, card_type, confidence',
  confusion_pairs: 'pair_id, exam_type, category, left_term, right_term',
  memory_card_progress: 'card_id, last_reviewed_at',
  memory_study_events: 'event_id, card_id, mode, created_at',
  restoration_candidates: 'restoration_id, source_choice_id, source_question_id, exam_type, category, restore_reason, review_status, confidence',
  high_quality_input_units: 'id, source_item_id, batch_id, origin, category, review_status, source_trace_grade, visual_type, disabled, created_at, updated_at'
  // question_explanations, choice_explanations は削除される
}).upgrade(async (tx) => {
  // Rollback ロジック
  // question_explanations, choice_explanations のデータは削除される
  // 既存データは維持される
});
```

---

## 5. 既存Storeへの影響

### 5.1 変更なし

以下のストアは変更なし:

- understanding_cards
- source_questions_chintai
- source_questions_takken
- source_choices（直接変更しない）
- memory_cards
- confusion_pairs
- memory_card_progress
- memory_study_events
- restoration_candidates
- high_quality_input_units

### 5.2 source_choices / is_statement_true は変更しない

**絶対ルール**:
- source_choices テーブルは直接変更しない
- is_statement_true は自動変更しない
- 正誤疑義は question_explanations / choice_explanations の label_conflict_suspected として記録

---

## 6. 表示ロジック

### 6.1 RepairPreview の表示優先順位

```
1. choice_explanations (v30)
   ↓ なければ
2. question_explanations (v30)
   ↓ なければ
3. high_quality_input_units (v29)
   ↓ なければ
4. TAKKEN_PROTOTYPE_UNITS
   ↓ なければ
5. 最終fallback（汎用ヒント）
```

### 6.2 実装ロジック（inputUnitRepairMatcher.ts）

```typescript
export async function findExplanationForCard(params: {
    cardId: string;
    userAnswer: boolean | number | null;
    correctAnswer: boolean | number | null;
}): Promise<ExplanationMatchResult> {

    // 1. choice_explanations を検索（最優先）
    const choiceExplanation = await db.choice_explanations
        .where('card_id')
        .equals(params.cardId)
        .and(exp => !exp.disabled)
        .first();

    if (choiceExplanation) {
        return {
            source: 'choice_explanation',
            data: choiceExplanation,
            matchScore: 300
        };
    }

    // 2. question_explanations を検索
    const questionExplanation = await db.question_explanations
        .where('card_id')
        .equals(params.cardId)
        .and(exp => !exp.disabled)
        .first();

    if (questionExplanation) {
        return {
            source: 'question_explanation',
            data: questionExplanation,
            matchScore: 250
        };
    }

    // 3. high_quality_input_units を検索
    const hqi = await db.high_quality_input_units
        .where('category')
        .equals(card.category)
        .and(exp => !exp.disabled && exp.review_status !== 'rejected')
        .first();

    if (hqi) {
        return {
            source: 'high_quality_input_unit',
            data: convertToInputUnit(hqi),
            matchScore: 200
        };
    }

    // 4. TAKKEN_PROTOTYPE_UNITS を検索
    // 既存ロジック

    // 5. 最終fallback
    return {
        source: 'fallback',
        data: null,
        matchScore: 0
    };
}
```

### 6.3 正解時表示 / 誤答時表示の差

#### 正解時表示

```typescript
if (userAnswer === correctAnswer) {
    // 正解の場合
    displayElements = [
        'correct_conclusion',
        'why_this_answer',
        'memory_hook',
        'related_input_unit_id'
    ];
}
```

#### 誤答時表示

```typescript
if (userAnswer !== correctAnswer) {
    // 誤答の場合
    displayElements = [
        'correct_conclusion',
        'why_this_answer',
        'why_user_wrong',
        'common_misread',
        'trap_points',
        'application_to_statement',
        'one_line_memory'
    ];
}
```

---

## 7. 品質判定

### 7.1 Quality A の条件

```typescript
function isQualityA(explanation: QuestionExplanation | ChoiceExplanation): boolean {
    return (
        explanation.source_trace_grade === 'A' &&
        explanation.confidence === 'high' &&
        explanation.application_to_question.length > 50 &&
        explanation.why_this_answer.length > 50 &&
        explanation.source_refs.length > 0 &&
        explanation.source_refs.some(ref => ref.source_type === 'e_gov' || ref.source_type === 'mlit') &&
        explanation.label_conflict_suspected === false
    );
}
```

**条件**:
- source_trace_grade: 'A'
- confidence: 'high'
- application_to_question: 50文字以上
- why_this_answer: 50文字以上
- source_refs: 1件以上
- 根拠ソース: e_gov, mlit, moj, maff, retio のいずれか
- label_conflict_suspected: false

### 7.2 Quality B の条件

```typescript
function isQualityB(explanation: QuestionExplanation | ChoiceExplanation): boolean {
    return (
        explanation.source_trace_grade === 'B' ||
        explanation.confidence === 'medium' ||
        (explanation.application_to_question.length > 20 && explanation.why_this_answer.length > 20) ||
        (explanation.source_refs.length > 0 && explanation.source_trace_grade === 'A')
    );
}
```

**条件**:
- source_trace_grade: 'B'
- または confidence: 'medium'
- または application_to_question, why_this_answer が20文字以上
- または source_refs があるが source_trace_grade が 'A' でない

### 7.3 Quality C の条件

```typescript
function isQualityC(explanation: QuestionExplanation | ChoiceExplanation): boolean {
    return (
        explanation.source_trace_grade === 'C' ||
        explanation.source_trace_grade === 'D' ||
        explanation.confidence === 'low' ||
        explanation.application_to_question.length < 20 ||
        explanation.why_this_answer.length < 20
    );
}
```

**条件**:
- source_trace_grade: 'C' or 'D'
- または confidence: 'low'
- または application_to_question, why_this_answer が20文字未満

### 7.4 label_conflict_suspected の条件

```typescript
function hasLabelConflict(explanation: ChoiceExplanation): boolean {
    return (
        explanation.label_conflict_suspected === true ||
        (explanation.suspected_correct_answer !== null &&
         explanation.suspected_correct_answer !== explanation.is_statement_true_snapshot)
    );
}
```

**条件**:
- label_conflict_suspected: true
- または suspected_correct_answer が is_statement_true_snapshot と異なる

**重要**: is_statement_true は直接変更しない

### 7.5 human_review_required の条件

```typescript
function requiresHumanReview(explanation: QuestionExplanation | ChoiceExplanation): boolean {
    return (
        explanation.label_conflict_suspected === true ||
        explanation.source_trace_grade === 'C' ||
        explanation.source_trace_grade === 'D' ||
        explanation.confidence === 'low' ||
        explanation.review_status === 'human_review_required'
    );
}
```

**条件**:
- label_conflict_suspected: true
- または source_trace_grade: 'C' or 'D'
- または confidence: 'low'
- または review_status: 'human_review_required'

### 7.6 auto_ok にしてよい条件

```typescript
function canAutoOK(explanation: QuestionExplanation | ChoiceExplanation): boolean {
    return (
        explanation.source_trace_grade === 'A' &&
        explanation.confidence === 'high' &&
        explanation.label_conflict_suspected === false &&
        explanation.human_review_required === false &&
        explanation.source_refs.length >= 1 &&
        explanation.application_to_question.length >= 30 &&
        explanation.why_this_answer.length >= 30 &&
        explanation.created_by === 'hybrid'  // AI + Human review
    );
}
```

**条件**:
- source_trace_grade: 'A'
- confidence: 'high'
- label_conflict_suspected: false
- human_review_required: false
- source_refs: 1件以上
- application_to_question: 30文字以上
- why_this_answer: 30文字以上
- created_by: 'hybrid'（AI生成 + 人間レビュー）

---

## 8. 初回データ生成方針

### 8.1 最初に作るカテゴリ

**優先度HIGH**:

1. **農地法 3条・4条・5条**
   - 理由: 誤答が多い、用語が似ている、条文の当てはめが重要

2. **35条書面 / 37条書面**
   - 理由: 出題頻度が高い、タイミングの違い、記載事項の違い

3. **媒介契約**
   - 理由: 専任・専属専任の違い、報告義務

4. **クーリング・オフ**
   - 理由: 適用対象、期間

5. **詐欺・強迫**
   - 理由: 第三者保護の違い、対抗関係

6. **借地借家法**
   - 理由: 更新、対抗要件

7. **賃貸住宅管理業法**
   - 理由: 管理義務、重要事項説明

### 8.2 Batch 1 の件数

**推奨件数**: 30-50件

**内訳**:
- 農地法: 10件
- 35条/37条: 10件
- 媒介契約: 5件
- クーリング・オフ: 5件
- 詐欺・強迫: 5件
- 借地借家法: 5件
- 賃貸住宅管理業法: 5件

### 8.3 根拠ソース方針

| ソース | 使用優先度 | 確認方法 |
|:---|:---|:---|
| **e-Gov** | HIGH | https://elaws.e-gov.go.jp |
| **国交省 (MLIT)** | HIGH | https://www.mlit.go.jp |
| **法務省 (MOJ)** | HIGH | https://www.moj.go.jp |
| **農水省 (MAFF)** | MEDIUM | https://www.maff.go.jp |
| **RETIO** | MEDIUM | https://www.retio.jp |
| **公式過去問** | HIGH | 本試験問題 |

**根拠ソースの優先順位**:
1. 法令（e-Gov, MLIT, MOJ, MAFF）
2. 公式過去問
3. RETIO（主要予備校）
4. internal_db（既存データベース）
5. human_note（人間メモ）

### 8.4 AI生成だけで確定しない項目

以下の項目は、AI生成だけで確定せず、人間レビューを必須とする:

1. **is_statement_true_snapshot**
   - source_choices.is_statement_true のスナップショット
   - 正誤ラベルの疑義を検出するため

2. **label_conflict_suspected**
   - AIが疑義を検出した場合、フラグを立てる
   - 人間が最終判定

3. **suspected_correct_answer**
   - AIが正誤ラベルの誤りを疑う場合に設定
   - 人間が確認

4. **application_to_question**
   - AI生成案を提示
   - 人間が問題文への適合性を確認

5. **why_this_answer**
   - AI生成案を提示
   - 人間が正誤の根拠を確認

### 8.5 Human Review 対象

以下の場合、human_review_required = true とする:

1. **source_trace_grade === 'C' or 'D'**
   - 根拠が不明確

2. **label_conflict_suspected === true**
   - 正誤ラベルに疑義

3. **confidence === 'low'**
   - 信頼度が低い

4. **created_by === 'ai_generated'**
   - AI生成のみで人間レビュー未実施

---

## 9. 既存実装との整合性

### 9.1 RepairPreview.tsx との整合性

**現状（Line 27-100）**:
- fallback時の汎用ヒント表示
- QuestionUnderstandingAid 表示

**v30対応後**:
- choice_explanations があれば優先表示
- question_explanations があれば次に表示
- その後、既存の fallback ロジック

### 9.2 QuestionUnderstandingAid.tsx との整合性

**現状**:
- 問題文解析（語句・人物）

**v30対応後**:
- QuestionUnderstandingAid は補助として維持
- question_explanations / choice_explanations が主解説

### 9.3 inputUnitRepairMatcher.ts との整合性

**現状**:
- high_quality_input_units → TAKKEN_PROTOTYPE_UNITS → fallback

**v30対応後**:
- choice_explanations → question_explanations → high_quality_input_units → TAKKEN_PROTOTYPE_UNITS → fallback

---

## 10. 作成ファイル

1. **src/db.ts**
   - v30 スキーマ追加
   - QuestionExplanation, ChoiceExplanation インターフェース追加

2. **src/types/explanationTypes.ts** (新規)
   - QuestionExplanation, ChoiceExplanation の型定義

3. **src/utils/explanationMatcher.ts** (新規)
   - choice_explanations / question_explanations 検索ロジック

4. **src/components/learning/RepairPreview.tsx**
   - v30 解説表示対応

---

## 11. 次のステップ

1. **実装**: v30 スキーマの実装
2. **Migration**: v29 → v30 migration スクリプト
3. **データ投入**: 初回30-50件のデータ入力
4. **検証**: 表示優先順位の確認
5. **レビュー**: 品質判定の確認

---

**設計署名**: AI Engineer (Claude / Gemini Pro)
**日付**: 2026-05-10
**ステータス**: A - v30問題別・選択肢別解説スキーマ設計完了
