# MemoryRecall P11 TrapRecall Plan

## 1. 背景
MemoryRecall P10 において、Active, Memory, Number の 3モード統合に成功した。
P11 では、学習者が最も間違えやすい「ひっかけ論点」「例外規定」「混同しやすいルール」をターゲットにした **TrapRecall** モードの導入を設計する。

## 2. 目的
- 試験問題特有の「ひっかけ（罠）」をパターン化し、意識的に回避する能力を養う。
- 単なる暗記ではなく、ルールの「原則」と「例外」の境界線を明確にする。
- 高い学習負荷を考慮し、品質の担保されたデータのみを厳選して出題する。

## 3. 候補データ源と抽出条件
調査の結果、`ULTIMATE_STUDY_DECK.json` 内に 1916件の Trap 候補（「ひっかけ」「例外」「注意」等を含むカード）が存在することを確認。

### 抽出キーワード
- **言語的トリガー**: 「ただし」「例外」「原則」「必ず」「不要」「のみ」「できる/できない」
- **メタデータ**: `flashcards` 配列内の `question_type: "incorrect"`、`examiners_intent`（出題者の意図）に「混同させたい」等の記述があるもの。

### 品質基準 (Quality Standards)
- **ソース根拠**: `core_knowledge.rule` または `explanation.full` が存在すること。
- **理由の明確性**: 「なぜひっかけなのか」が `trap_reason` として説明可能であること。
- **除外対象**: `human_review_required: true`、内容が 10文字未満、プレースホルダを含むもの。

## 4. TrapRecall Item Schema
```json
{
  "id": "TR-{card_id}-{index}",
  "mode": "trap_recall",
  "statement": "問題文（ひっかけが含まれる可能性がある文章）",
  "is_trap": true,
  "trap_point": "どこが罠か（例: 申請先が知事ではなく大臣である点）",
  "correct_rule": "正しい法的ルール",
  "explanation": "詳細な解説",
  "category": "分野",
  "exam_type": "takken/chintai"
}
```

## 5. UI 方針 (案A: True/False with Reason)
- **操作**: 文章を提示し「正しい(◯) / 罠がある(×)」を選択。
- **フィードバック**: 回答後、即座に `trap_point` と `correct_rule` を強調表示。
- **利点**: `ActiveRecallView` のコンポーネントを再利用でき、学習テンポを維持できる。

## 6. Daily Session 混入方針 (安全配分案)
P12 での初期統合配分（案B）:
- **ActiveRecall**: 22問 (最低保証)
- **MemoryRecall**: 4問
- **NumberRecall**: 2問
- **TrapRecall**: 2問
- **Total**: 30問固定
*※ 候補品質が安定しない場合は、単独テスト導線のみで開始する（案A）。*

## 7. Acceptance Criteria (AC)
- **AC-001**: 既存の 3モード（Active/Memory/Number）の安定稼働を維持。
- **AC-002**: 高品質な Trap 候補を 50件以上抽出できるロジックの定義。
- **AC-003**: 「原則/例外」の構造を壊さない UI プロトタイプの設計。
- **AC-004**: P8 auto_apply の安全制約（Active >= 22）を遵守した配分設計。
- **AC-005**: Build PASS / Schema v24 維持。

## 8. 実装フェーズ (P11/P12 分離)
- **P11 (今回)**: 上記の設計および計画書作成（実装なし）。
- **P12 (次)**: TrapRecall 最小実装、データ抽出、db-audit への監査表示追加。

## 9. スケジュール
- 今回は設計・計画のみ。次回 Directive で実装を開始する。
