# MemoryRecall P7 Manual Apply & Persistence Report

## 概要
FSRS 指標に基づく推奨配分を IndexedDB の `metadata` テーブルに永続保存し、ユーザーが手動で次回の学習セッション（Daily Session）に適用できる「手動適用予約」機能を実装した。
これにより、システム提案の最適配分をリスクなく実セッションに反映させるライフサイクルが完成した。

## 実施内容
- **`active_due_count` の実装**: `understanding_cards` の FSRS 期限を参照し、演習の復習負荷を可視化した。
- **推奨配分の永続化**: `analytics.ts` に `persistRecommendedDistribution` を追加。推奨案と算出指標を `metadata` テーブルの `study_distribution_config` キーに保存。
- **手動適用予約ロジック**: `reserveManualDistribution` を実装。安全制約（Active 最低 22問）を検証した上で、次回セッション用のフラグ `manual_pending` を設定。
- **一回使い切り適用の統合**: `buildDailyStudySessionQueue` を更新。セッション開始時に予約済み配分があれば適用し、生成完了後に自動でデフォルト（24:6）へ回帰する仕組みを導入。
- **監査 UI の強化**: `db-audit.html` に、永続化された推奨データと手動適用の予約状況を表示するセクションを追加。

## 結果 (実測値)
- **永続化先**: `metadata` (Key: `study_distribution_config`)
- **適用ポリシー**: 手動予約による「次回 1回のみ」の適用。
- **安全制約**: Active 22-26 : Memory 4-8 (常に Total 30) を厳守。
- **Build 結果**: PASS (TypeScript / Vite)
- **Schema 整合性**: FULL_SYNC (v24) 維持

## 動作確認
- `db-audit.html` 実行時に最新の推奨配分が自動保存され、リロード後も保持されることを確認。
- `reserveManualDistribution`（手動予約）を実行後、次回の Daily Session キューが予約通りの配分で生成されることを物理実測済み。
- セッション開始後に `manual_pending` が自動でクリアされ、2回目以降はデフォルトの 24:6 に戻ることを確認。

## P8 (次フェーズ) への課題
- **自動適用の解禁**: ユーザー設定により、手動操作なしで推奨配分を常に適用するオプションの追加。
- **長期最適化**: 1ヶ月単位の忘却曲線に基づいた、より深い配分チューニング。
- **UI の洗練**: App 内の設定画面から配分ポリシーを変更できる機能。

## 判定
**A. P7 Manual Apply / Persistence 実装OK**
インテリジェンス（推奨）から実行（適用）への橋渡しが、安全性と透明性を保ったまま物理的に開通した。
