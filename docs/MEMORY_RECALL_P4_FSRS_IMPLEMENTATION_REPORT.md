# MemoryRecall P4 FSRS Implementation Report

## 概要
FSRS (Free Spaced Repetition Scheduler) アルゴリズムを内部スケジューラとして導入した。
既存の 2-ボタン UI（覚えた/まだ）を維持しつつ、背後で安定性（Stability）と難易度（Difficulty）に基づいた高度な復習間隔計算を行う基盤を確立した。

## 実施内容
- **FSRS アダプターの実装**: `src/utils/fsrsAdapter.ts` を新規作成。外部ライブラリに依存せず、FSRS v4.5 相当の基本計算ロジックを独自実装。
- **データモデルの拡張**: `MemoryCard` および `UnderstandingCard` に `fsrs_state` を動的プロパティとして保存。既存の `srs_params` (SM-2風) も同期対象として維持し、後方互換性を確保。
- **Rating マッピング**: 
  - 「覚えた（Correct）」 → FSRS `Good` (Rating 3)
  - 「まだ（Incorrect）」 → FSRS `Again` (Rating 1)
- **スケジューラの統合**: `updateCardSRS` を拡張し、FSRS による次回復習日（`due`）の算出と保存を実装。
- **キュー生成の最適化**: `buildDailyStudySessionQueue` において FSRS の `due` を優先的に判定し、Daily Session 24:6 配分内での出題精度を向上。

## 結果 (実測値)
- **FSRS 対応テーブル**: `memory_cards`, `understanding_cards`
- **状態管理**: `fsrs_state` (stability, difficulty, reps, state) を確認。
- **互換性維持**: レガシーな `next_review_date` も同時に更新。
- **Build 結果**: PASS (npm run build)
- **Schema 整合性**: FULL_SYNC (v24) 維持

## 動作確認
- 暗記カードの回答後に `fsrs_state` が自動生成・更新されることを物理 Trace で確認。
- 正解時に安定性が向上し、復習間隔（`scheduled_days`）が科学的に延伸されることを確認。
- Daily Session (30問) において、FSRS の期限切れカードが正確にスロットに割り当てられることを確認。

## P5 (次フェーズ) への課題
- **4段階評価 UI**: Again / Hard / Good / Easy ボタンへの UI 拡張。
- **パラメータ最適化**: 学習ログに基づいた W パラメータの自動チューニング。
- **忘却曲線分析**: ダッシュボードでの長期保持率グラフ表示。

## 判定
**A. P4 FSRS内部導入OK**
ユーザー体験を損なうことなく、内部アルゴリズムの近代化を安全に完了した。
