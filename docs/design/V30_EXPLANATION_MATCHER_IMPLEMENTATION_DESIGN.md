# V30 Explanation Matcher Implementation Design

**対象**: `question_explanations` / `choice_explanations` を ActiveRecall の誤答補修へ接続するための read-only matcher 設計  
**前提**: v30 Phase3-020 は投入済み。DB は `TakkenOS_DB` / v30。`question_explanations=20`, `choice_explanations=12`, `high_quality_input_units=20`。  
**非対象**: DB投入、UI改修、`RepairPreview.tsx` 修正、`ActiveRecallView.tsx` 修正、`inputUnitRepairMatcher.ts` の破壊的変更。

## 1. 既存構造の確認

### 1.1 `inputUnitRepairMatcher.ts` の責務

`src/utils/inputUnitRepairMatcher.ts` は、誤答後に表示する `InputUnit` を解決する既存の補修マッチャーである。

現在の優先順位は以下。

1. `high_quality_input_units` からカテゴリ一致を検索
2. `TAKKEN_PROTOTYPE_UNITS` からタグ・カテゴリ一致を検索
3. `null` を返す

この matcher は「説明レコード」ではなく「補修ユニット」を返す。
したがって、v30 の `question_explanations` / `choice_explanations` をそのまま置き換える責務は持たせない。

### 1.2 `RepairPreview.tsx` の入力仕様

`src/components/learning/RepairPreview.tsx` は `InputUnit | null` を受け取る。

必要な表示材料は `InputUnit` 側の構造に依存しており、主に以下を使う。

- `title`
- `conclusion`
- `trap_points`
- `comparison`
- `repair_explanation.short_note`
- `check_question`
- `source_trace`

つまり、`RepairPreview` は v30 解説テーブルの直接レンダリング先ではなく、既存の `InputUnit` を使う表示層である。

### 1.3 `ActiveRecallView.tsx` の現在フロー

`src/components/learning/ActiveRecallView.tsx` は現在、以下の順で動く。

1. `source_choices` をロード
2. `buildLearningContentContract()` で出題解説を構築
3. 正誤判定を行う
4. 誤答時に `findRepairInputUnit()` を呼ぶ
5. `RepairPreview` または `InputUnitViewer` を表示する

現状は `question_explanations` / `choice_explanations` を読む経路がない。
したがって、v30 を接続するためには新しい read-only matcher が必要である。

### 1.4 v29 fallback の表示優先順位

既存の補修表示は以下の順で成立している。

1. `high_quality_input_units`
2. `TAKKEN_PROTOTYPE_UNITS`
3. 最終 fallback（`null` / 問題文ヒントのみ）

v30 を追加しても、この fallback 構造は壊さない。

### 1.5 v30 の型定義

`src/db.ts` 上の v30 ストアは以下。

- `question_explanations`
- `choice_explanations`

`question_explanations` の主な識別子:

- `id`
- `question_id`
- `source_question_id`
- `card_id`

`choice_explanations` の主な識別子:

- `id`
- `choice_id`
- `source_choice_id`
- `question_id`
- `source_question_id`
- `card_id`

v30 の解説は `InputUnit` ではなく説明レコードであり、`choice_explanations` は `question_explanations` より細粒度である。

## 2. 設計方針

### 方針 A: 既存 matcher に v30 を混ぜ込む

`inputUnitRepairMatcher.ts` に `question_explanations` / `choice_explanations` を直接追加し、同じ関数で全て解決する案。

**長所**
- 呼び出し側が少ない
- 既存の `RepairPreview` にそのまま渡しやすい

**短所**
- 説明レコードと補修ユニットの責務が混ざる
- v29 fallback と v30 解説の境界が曖昧になる
- 後で `question_explanations` と `choice_explanations` の表示粒度を分けにくい

### 方針 B: 新規 `explanationMatcher.ts` を read-only resolver として追加する

v30 解説ストア専用の解決層を新規作成し、必要に応じて既存の `findRepairInputUnit()` を fallback として呼ぶ案。

**長所**
- 既存補修ユニット層を壊さない
- choice / question の優先順位を明示できる
- v30 の説明レコードと v29 の InputUnit を分離できる

**短所**
- 新しい中間層が 1 つ増える
- ActiveRecall 側に薄い接続変更が必要になる

### 方針 C: 統合リゾルバへ全面再設計

説明レコード、HQI、prototype を 1 つの統合リゾルバで扱う案。

**長所**
- 1 回の呼び出しで全候補を得やすい

**短所**
- 変更範囲が大きい
- 今回の目的より広すぎる
- 既存表示との互換性リスクが高い

### 推奨

**方針 B** を採用する。

理由は、v30 解説テーブルを追加しても既存の `InputUnit` ベース補修を壊さず、段階的に ActiveRecall へ接続できるからである。

## 3. 新 matcher の役割

### 3.1 新 file

`src/utils/explanationMatcher.ts`

### 3.2 target function

推奨シグネチャ:

```ts
resolveExplanationPack(params): Promise<ExplanationMatchResult>
```

### 3.3 matcher の責務

`explanationMatcher.ts` は read-only で以下を行う。

- `choice_explanations` を最優先で検索
- 見つからない場合に `question_explanations` を検索
- さらに見つからない場合に既存の `findRepairInputUnit()` へ fallback
- 何も見つからなければ `null` を返す

この matcher は DB に書き込まない。
`review_status` や `human_review_required` を更新しない。

## 4. Matching Priority

表示優先順位は以下で固定する。

1. `choice_explanations`
2. `question_explanations`
3. `high_quality_input_units`
4. `TAKKEN_PROTOTYPE_UNITS`
5. 最終 fallback

### 4.1 choice_explanations の優先キー

`choice_explanations` は最も粒度が細かいため、以下の順で一致させる。

1. `source_choice_id`
2. `choice_id`
3. `source_question_id`
4. `question_id`
5. `card_id`

### 4.2 question_explanations の優先キー

`question_explanations` は選択肢が無い/弱い場合の論点説明として使う。

1. `source_question_id`
2. `question_id`
3. `card_id`
4. `category`

### 4.3 HQI / prototype fallback

v30 解説が存在しない場合は、既存の `findRepairInputUnit()` を使う。
これにより、`high_quality_input_units` と `TAKKEN_PROTOTYPE_UNITS` の fallback を維持できる。

## 5. データフロー

### 5.1 ActiveRecall の誤答時

1. `ActiveRecallView` が誤答を検知
2. 現在の `buildLearningContentContract()` はそのまま使う
3. `explanationMatcher.ts` を呼び、該当する v30 解説を取得
4. 解説があれば、`RepairPreview` へ渡す補修文脈を増やす
5. v30 解説がなければ、既存の `findRepairInputUnit()` 経路へ落とす

### 5.2 既存 UI の互換性

`RepairPreview` は `InputUnit` を前提にしているため、初期実装では UI を壊さない。

- 既存の `repairUnit` 表示は維持
- v30 解説は matcher の返却値に同梱し、後続で段階的に UI 表示へ接続する

## 6. 具体的な返却モデル

推奨する返却モデルは以下。

```ts
type ExplanationMatchSource =
  | 'choice_explanations'
  | 'question_explanations'
  | 'high_quality_input_units'
  | 'prototype'
  | 'none';

interface ExplanationMatchResult {
  source: ExplanationMatchSource;
  confidence: 'exact' | 'question' | 'category' | 'fallback' | 'none';
  reason: string;
  questionExplanation?: QuestionExplanation | null;
  choiceExplanation?: ChoiceExplanation | null;
  repairUnit?: InputUnit | null;
}
```

この形にすると、v30 解説を UI に渡しつつ、既存の `RepairPreview` 用 `InputUnit` も保持できる。

## 7. 破壊しないための制約

- `inputUnitRepairMatcher.ts` は原則そのまま保持する
- `RepairPreview.tsx` の props を即時変更しない
- `ActiveRecallView.tsx` の正誤判定ロジックは変更しない
- `question_explanations` / `choice_explanations` は read-only で読むだけにする
- `v29` の `high_quality_input_units` fallback を最後まで残す

## 8. テスト方針

実装時は最低限以下を確認する。

1. `choice_explanations` がある場合、`question_explanations` より優先される
2. `question_explanations` だけある場合、`high_quality_input_units` より優先される
3. `question_explanations` / `choice_explanations` がない場合、既存 `findRepairInputUnit()` が動く
4. `high_quality_input_units` と `TAKKEN_PROTOTYPE_UNITS` の fallback が壊れない
5. `source_choices` / `is_statement_true` / `study_events` に書き込まない

## 9. 実装前監査結論

この設計であれば、v30 解説ストアを ActiveRecall の誤答補修に安全に接続できる。
最終的には、`explanationMatcher.ts` を read-only resolver として追加し、既存の `inputUnitRepairMatcher.ts` を fallback として残す構成が最も安全である。
