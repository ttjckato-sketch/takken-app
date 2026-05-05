# MemoryRecall P7 Manual Apply & Persistence Freeze Note

## 概要
MemoryRecall P7 (Manual Apply & Persistence) の物理監査を完了し、状態を凍結した。
IndexedDB `metadata` テーブルへの推奨配分永続化と、ユーザー操作による「次回 1回限定の手動適用」が実測値に基づき安定動作していることを確認。

## 確定実測値 (Persistence & Apply Audit)
- **永続保存先**: `metadata` (Key: `study_distribution_config`)
- **Manual Pending 制御**: 予約時に `true`, セッション開始時に `false` への自動遷移を物理 Trace 済み。
- **一回使い切り特性**: 適用セッションの次セッションで `24:6` デフォルトへ自動回帰することを 100% 確認。
- **安全制約検証**: `Active 22-26` の範囲外設定を拒否するガードロジックの有効性を確認。
- **Active Due Count**: 実装済み。推奨ロジックへの統合を物理監査。

## 動作検証 (E2E Audit)
- **E2E種別**: 物理監査完了 (30問フル完走 1回使い切り適用)
- **applied_distribution**: `Active 22 : Memory 8` (または推薦値) の適用と `study_sessions` への記録を実測。
- **Auto Revert**: セッション完走後、次回の Queue 生成が `24:6` に戻ることを物理実測。
- **ActiveRecall 回帰**: PASS (手動適用時も演習品質・FSRS更新に影響なし)

## 技術整合性
- **Schema Version**: 24
- **Sync Status**: FULL_SYNC
- **Build Result**: PASS

## P8 入口
- `auto_apply: true` オプションの解禁（完全自動化）。
- 長期学習ログに基づく動的配分エンジンの更なる高度化。
- 特化型カード（NumberRecall 等）を動的スロットとして組み込む。

## 判定
**A. P7 Manual Apply / Persistence Freeze OK**
「推奨 -> 予約 -> 1回適用 -> 回帰」のライフサイクルが、実測値をもって安全に開通している。
