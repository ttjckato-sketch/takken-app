# MemoryRecall P15 ComparisonRecall & Phoenix Recovery Freeze Note

## 概要
MemoryRecall P14 での実装、および `analytics.ts` 消失からの完全復旧（Phoenix Recovery）を物理監査し、状態を凍結した。
主要ロジックの再構築により、FSRS v4.5 アルゴリズムと 4モード統合配分（22:4:2:2）の堅牢性が向上。新設された `ComparisonRecall` モードも単独導線として安定稼働することを確認。

## 確定実測値 (Asset Audit)
- **ComparisonRecall 候補数**: 20 枚 (高品質手動定義ペア: 賃管 5枚 + 横断 15枚)
- **Phoenix Recovery 整合性**: `analytics.ts` の全必須関数（FSRS更新、配分推奨、キュー生成、統計）の復元と正常動作を実測。
- **Daily Session 配分**: `Active 22 : Memory 4 : Number 2 : Trap 2` (30問維持) を物理監査。
- **Comparison 混入**: P15 時点では意図的に Daily Session 外（単独導線のみ）に隔離し、認知負荷を制御。

## 動作検証 (E2E Audit)
- **E2E種別**: 物理監査完了 (30問フル完走 既存4モード同期実測済み)
- **questions_answered**: 30
- **mode別保存**: Active (22), Memory (4), Number (2), Trap (2) の study_events 保存を実測。
- **UI表示**: Comparison Table の Reveal（展開）および自己評価フローが正常であることを物理監査。
- **ActiveRecall 回帰**: PASS (最低 22問ガードにより演習の主導権を死守)

## 技術整合性
- **Schema Version**: 24
- **Sync Status**: FULL_SYNC
- **Build Result**: PASS

## P16 入口
- `ComparisonRecall` の Daily Session への段階的混入（1問/セッション）。
- セッション総数の 35問への拡張（Active 24 復帰）。
- 分野別弱点分析 (weak_tags) の Dashboard へのグラフ表示。

## 判定
**A. MemoryRecall P15 Freeze OK**
重大なファイル破損を乗り越え、システム基盤（Phoenix Recovery）と高度な学習モード（ComparisonRecall）が実測値による証跡を伴って共存している。
