# MemoryRecall P13 ComparisonRecall Plan

## 1. 背景
MemoryRecall P12 において、Active, Memory, Number, Trap の 4モード統合に成功した。
P13 では、類似した制度や要件、法律効果の「違い」を整理して学習する **ComparisonRecall** モードの導入を設計する。

## 2. 目的
- 混同しやすい 2つの概念（例: 管理受託方式 vs サブリース方式）を対比させ、識別能力を高める。
- 宅建・賃管の両試験で頻出する「制度の比較」をパターン化し、横断的な理解を促進する。
- 比較表（Comparison Table）を活用し、視覚的に知識を整理する。

## 3. 比較対象カテゴリ
- **宅建業法**: 免許基準 vs 登録基準、営業保証金 vs 保証協会、専任 vs 一般（媒介契約）。
- **権利関係**: 借地 vs 借家、抵当権 vs 質権、普通借地 vs 定期借地。
- **法令制限**: 用途地域（住居 vs 商業）、開発許可の要否（面積要件）、建ぺい率 vs 容積率。
- **賃管**: 管理受託方式 vs サブリース方式、維持保全 vs 清掃管理。

## 4. 候補データ源
- `chintaiOptimizer.ts`: `buildChintaiConfusionPairs` に手動定義された比較ペア。
- `crossExamOptimizer.ts`: `processCrossExamOptimization` による横断比較ペア。
- `ULTIMATE_STUDY_DECK.json`: 3158件の比較候補（「違い」「比較」等を含むカード）。

## 5. ComparisonRecall Item Schema
```json
{
  "id": "CP-{id}",
  "mode": "comparison_recall",
  "topic": "比較テーマ（例: 契約形態の違い）",
  "left_term": "概念A（例: 管理受託方式）",
  "right_term": "概念B（例: サブリース方式）",
  "question": "「A」と「B」の決定的な違いは？",
  "difference": "正解の差異（結論）",
  "trap_point": "混同しやすいポイント",
  "comparison_table": [
    { "feature": "当事者", "left": "...", "right": "..." },
    { "feature": "リスク", "left": "...", "right": "..." }
  ],
  "source_text": "根拠テキスト",
  "explanation": "詳細解説",
  "exam_type": "takken/chintai/cross",
  "confidence": "high/medium"
}
```

## 6. UI 方針 (案A: Comparison Card Reveal)
- **操作**: 2つの用語と「違いは？」という問いを提示。「違いを確認」ボタンを押す。
- **フィードバック**: 差異の要点と、構造化された比較表を表示。「覚えた / まだ」で自己評価。
- **利点**: 複雑な情報を整理された形で提供でき、暗記効率が最大化される。

## 7. Daily Session 混入方針 (安全配分案)
P14 での初期統合配分（案A: 単独導線優先）:
- **Daily Session**: Active 22 / Memory 4 / Number 2 / Trap 2 (30問維持)
- **Standalone**: ComparisonRecall 単独導線を Dashboard に追加。
*※ 比較学習は認知負荷が高いため、まずは「1問の質」を確認し、P15以降で 1問/セッション 程度の混入を検討する。*

## 8. Acceptance Criteria (AC)
- **AC-001**: 既存の 4モード（Active/Memory/Number/Trap）の安定稼働を維持。
- **AC-002**: 手動定義ペアおよび自動抽出ペアから、高品質な比較候補を 20件以上特定。
- **AC-003**: 比較表（Table）を表示可能な `ComparisonRecallView` の設計。
- **AC-004**: P8 auto_apply との競合なし（初期は自動適用の対象外）。
- **AC-005**: Build PASS / Schema v24 維持。

## 9. 実装フェーズ (P13/P14 分離)
- **P13 (今回)**: 上記の設計および計画書作成（実装なし）。
- **P14 (次)**: `ComparisonRecallView` 最小実装、データ抽出、単独導線開通。

## 10. スケジュール
- 今回は設計・計画のみ。次回 Directive で実装を開始する。
