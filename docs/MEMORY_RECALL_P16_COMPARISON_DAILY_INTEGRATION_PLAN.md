# MemoryRecall P16 Comparison Daily Integration Plan

## 1. 背景
MemoryRecall P15 において、重大なファイル破損からの完全復旧（Phoenix Recovery）と `ComparisonRecall`（概念比較）の単独実装を完了した。
P16 では、学習効果をさらに高めるため、この比較学習モードを 1日30問の「今日の学習（Daily Session）」へと統合する設計を行う。

## 2. 目的
- 類似制度や混同しやすい用語の識別能力を、日々のルーチン学習の中で体系的に強化する。
- 認知負荷の高い「比較」を 1日1問という低頻度で混入させることで、挫折を防ぎつつ深い理解を促進する。
- 4つの周辺モード（Memory, Number, Trap, Comparison）すべてが統合された「完全版マルチモード学習」のプロトタイプを確立する。

## 3. 配分案の設計
現在の Daily Session（Active 22 : Memory 4 : Number 2 : Trap 2）に対し、以下の案を検討。

| 案 | 配分 (A:M:N:T:C) | メリット | リスク |
| :--- | :--- | :--- | :--- |
| **案A (推奨)** | **22 : 3 : 2 : 2 : 1** | Active 22 を維持しつつ、資産の多い Memory から 1枠捻出。最もバランスが良い。 | 特になし。 |
| 案B | 22 : 4 : 1 : 2 : 1 | Number から捻出。数字の露出が減る。 | 数字の定着率低下。 |
| 案C | 22 : 4 : 2 : 1 : 1 | Trap から捻出。ひっかけ対策が薄まる。 | 試験直前期には不向き。 |

**結論**: 案A（22:3:2:2:1）を採用し、ActiveRecall 最低 22問ガードを死守する。

## 4. 運用判断とアセット戦略
- **可用性**: 高品質な手動定義ペアが 20枚存在。1日1問の場合、20日で一巡。
- **FSRS 連携**: FSRS スケジューラにより、既習ペアの復習間隔は自動調整される。
- **拡張性**: 今後の資産拡大（P18以降）に伴い、比較枠を 2問へ増やす検討を行う。

## 5. 安全制約と整合性
### auto_apply (自動適用)
- P16 では、`ComparisonRecall` は自動適用の変動対象外（固定 1問）とする。
- 推奨配分計算は引き続き Active と Memory の比率調整に集中し、全体の安全性を優先する。

### manual_pending (手動予約)
- 手動予約（例: Active 24 : Memory 6）がある場合は、手動設定を優先し `Comparison` は 0 とする（P15以前の安全仕様を維持）。

### rollback (ロールバック)
- 配分異常やシステム不整合発生時は、P15 デフォルト（22:4:2:2, C=0）またはシステムデフォルト（24:6, C=0）へ回帰する。

## 6. db-audit 監査項目の設計
以下の指標を `db-audit.html` に追加し、混入状況を監視する。
- `comparison_daily_enabled`: Daily セッションへの混入が有効か。
- `comparison_rotation_days`: 現在の資産数に基づくローテーション日数（実測値: 20日）。
- `actual_distribution_trace`: 直近セッションの物理的な配分比率。

## 7. Acceptance Criteria (AC)
- **AC-001**: 既存の Phoenix Recovery 済み `analytics.ts` の整合性を維持。
- **AC-002**: Daily Session 配分が `Active 22 : Memory 3 : Number 2 : Trap 2 : Comparison 1` に更新されること。
- **AC-003**: 30問完走時に `comparison_recall` モードのイベントが正確に 1件記録されること。
- **AC-004**: auto_apply および manual_pending の安全ガードが正常に機能すること。
- **AC-005**: Build PASS / Schema v24 維持。

## 8. 実装フェーズ (P16/P17 分離)
- **P16 (今回)**: 上記の設計および計画書作成（実装なし）。
- **P17 (次)**: `buildDailyStudySessionQueue` の更新、1問混入の物理実装とフル E2E 監査。

## 9. スケジュール
- 今回は設計・計画のみ。次回 Directive で実装を開始する。
