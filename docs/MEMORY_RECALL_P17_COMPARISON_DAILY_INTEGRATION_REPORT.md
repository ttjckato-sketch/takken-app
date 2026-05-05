# MemoryRecall P17 Comparison Daily Integration Report

## 概要
多モード学習の完成形として `ComparisonRecall` (概念比較) を 1日30問の Daily Session へ安全に統合した。
これにより、演習（Active）、暗記（Memory）、数字（Number）、罠（Trap）、比較（Comparison）の 5モードが日次で網羅されるマルチモード学習体系が確立された。

## 実施内容
- **Daily Session 配分の更新**:
  - `buildDailyStudySessionQueue` を更新し、`Active 22 : Memory 3 : Number 2 : Trap 2 : Comparison 1` (合計30問) の配分を実装。
  - ActiveRecall 最低 22問の安全ガードを維持。
- **セッション統計の強化**:
  - `completeStudySession` を改良し、セッション期間中の `study_events` を自動集計して `mode_distribution` (5モード対応) を正確に保存するように拡張。
- **UI/UX の改善**:
  - メインダッシュボードの残りタスク欄に「1 Comparison Incl.」という軽量なインジケータを追加し、学習者に混入を通知。
- **監査基盤の更新**:
  - `db-audit.html` を P17 仕様に更新。5モード配分の管制および算出指標の監査を可能にした。
- **安全制約の維持**:
  - Comparison は `auto_apply` の変動対象外（固定1問）とし、既存のスケジュール最適化ロジックを壊さない設計を採用。
  - 手動予約（manual_pending）時は手動設定を優先し、意図しない混入を防ぐ仕様を維持。

## 結果 (実測値)
- **Daily 配分比率**: Active 22 : Memory 3 : Number 2 : Trap 2 : Comparison 1
- **セッション総数**: 30問固定
- **Build 結果**: PASS
- **Schema 整合性**: FULL_SYNC (v24) 維持

## 動作確認
- 30問フル E2E 監査済み (Active 22, Memory 3, Number 2, Trap 2, Comparison 1)。、最終的に 5つの異なる学習モードが混在し、それぞれの結果が正確に `study_events` および `study_sessions` に記録されることを確認。
- `analytics.ts` 復旧後の FSRS スケジュールおよび自動適用ガードが正常に回帰していることを物理監査。

## P18 (次フェーズ) への課題
- 5モード統合状態の長期安定稼働の確認。
- セッション総数の 35問への拡張検討（周辺モードの露出増）。
- 分野別弱点（weak_tags）に基づく動的配分への Comparison/Trap の組み込み。

## 判定
**A. MemoryRecall P17 実装OK**
「比較学習」の Daily 統合により、宅建・賃管試験特有の混同論点を毎日少しずつ、かつ着実に克服できる学習サイクルが完成した。
