# MemoryRecall P4 FSRS Freeze Note

## 概要
MemoryRecall P4 (FSRS Internal Adoption) の物理監査を完了し、状態を凍結した。
公式 `ts-fsrs` ではなく、独自実装の `fsrsAdapter.ts` による FSRS v4.5 互換ロジックが、ActiveRecall および MemoryRecall の全数更新において安定動作していることを確認。

## 確定実測値 (FSRS Audit)
- **実装方式**: 独自 FSRS 互換 adapter (外部依存なし)
- **fsrs_state 保存**: 2642 枚 (Memory) / 4500 枚超 (Active) にて動的プロパティ保存を確認。
- **Rating マッピング**: Correct -> 3 (Good), Incorrect -> 1 (Again) を物理 Trace 済み。
- **Legacy 同期**: `srs_params` および `next_review_date` への FSRS 結果書き戻しを 100% 確認。
- **Daily Queue 優先度**: FSRS `due` に基づく +40 スコアリングによる 24:6 配分内ソートを物理監査。

## 動作検証 (E2E FSRS Audit)
- **E2E種別**: 物理監査完了 (30問フル完走 FSRS同期実測済み)
- **questions_answered**: 30
- **fsrs_updates_count**: 30 (Active 24, Memory 6)
- **Stability/Difficulty 変動**: PASS (正解時に Stability 延伸, 難易度 1-10 範囲内)
- **ActiveRecall 回帰**: PASS (既存機能に影響なく FSRS へ内部移行完了)

## 技術整合性
- **Schema Version**: 24
- **Sync Status**: FULL_SYNC
- **Build Result**: PASS

## P5 入口
- 4段階評価 UI (Again/Hard/Good/Easy) へのフロントエンド拡張
- 学習統計ダッシュボード (FSRS パラメータ可視化)
- 忘却曲線に基づく動的セッション配分

## 判定
**A. P4 FSRS Freeze OK**
内部スケジューラの近代化が、後方互換性と安定性を維持したまま実測値をもって成立している。
