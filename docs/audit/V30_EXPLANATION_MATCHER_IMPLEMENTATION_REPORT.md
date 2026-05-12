# V30 Explanation Matcher Implementation Report

## Summary
- `src/utils/explanationMatcher.ts` を新規作成し、v30 の `question_explanations` / `choice_explanations` を読み取り専用で解決する matcher を実装した。
- 優先順位は `choice_explanations -> question_explanations -> high_quality_input_units -> TAKKEN_PROTOTYPE_UNITS -> final fallback`。
- 誤答時の `ActiveRecallView` に最小接続し、v30 解説がある場合は「結論」「なぜそうなるか」「この問題へのあてはめ」「どこで間違えたか」「1行暗記」「似た論点との比較」を表示する。
- `npm run build` は PASS。
- DB への書き込みは行っていない。

## Implementation Notes
- `resolveExplanationPack(params)` を公開し、`choice_explanations` は `sourceChoiceId` / `choiceId` の選択肢ID一致だけで検索する。
- `question_explanations` は `sourceQuestionId` / `questionId` / `cardId` / `category` を使って検索する。
- `choice_explanations` が見つかった場合は最優先で返す。
- `choice_explanations` が無い場合のみ `question_explanations` を試す。
- さらに無い場合は既存の `inputUnitRepairMatcher.ts` を使って `high_quality_input_units` と `TAKKEN_PROTOTYPE_UNITS` を継承する。
- 最後まで見つからない場合は `none` を返す。
- `ActiveRecallView.tsx` は誤答時だけ `resolveExplanationPack` を呼ぶ。正答時は既存フローを維持する。
- `ExplanationRepairPanel.tsx` は表示専用で、DB と学習イベントには触れない。

## DB Access
- Read-only.
- Used tables:
  - `choice_explanations`
  - `question_explanations`
- Fallback path reuses existing read-only repair matcher:
  - `high_quality_input_units`
  - `TAKKEN_PROTOTYPE_UNITS`

## Matching Priority
1. `choice_explanations`
2. `question_explanations`
3. `high_quality_input_units`
4. `TAKKEN_PROTOTYPE_UNITS`
5. final fallback

## Fallback Confirmation
- `choice_explanations` / `question_explanations` は v30 の explanation tables から解決する。
- 既存 fallback の `high_quality_input_units` と prototype 解決を壊さない。
- 追加の DB 書き込み、削除、clear は未実施。

## Safety
- `source_choices` 変更なし
- `is_statement_true` 変更なし
- `study_events` 変更なし
- `memory_cards` 変更なし
- `question_explanations` / `choice_explanations` 追加投入なし
- `DB add / put / delete / clear` なし
- `npm install` なし
- `package.json` / `package-lock.json` 変更なし
- `commit / push / deploy` なし

## Build
- `npm run build`: PASS
