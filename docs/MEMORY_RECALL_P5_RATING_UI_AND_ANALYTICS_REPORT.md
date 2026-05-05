# MemoryRecall P5 Rating UI & Analytics Report

## 概要
FSRS の精度を最大限に引き出すため、4段階評価 UI (Again, Hard, Good, Easy) を導入し、同時に管理用の FSRS 分析機能を強化した。
高速な 2-ボタン学習体験を維持しつつ、必要な場合に詳細な自己評価を記録できるハイブリッド設計を採用した。

## 実施内容
- **MemoryRecall UI の 4段階化**: 「答えを見る」の後の評価ボタンを「まだ / ギリギリ / 覚えた / 簡単」の 4つに拡張。
- **ActiveRecall UI の拡張**: 既存の「正しい/誤り」回答後の結果画面に、オプションとして詳細評価ボタンを追加。未選択時は従来通りのマッピングを適用。
- **FSRS アダプターの拡張**: `fsrsAdapter.ts` において明示的な Rating (1-4) を受け取り、復習間隔をより精密に計算するように修正。
- **データ永続化**: `study_events` に `rating` (1-4) および `rating_source` (explicit/boolean_default) を保存するように拡張。
- **FSRS 分析の追加**: `db-audit.html` に平均安定性 (Stability) および平均難易度 (Difficulty) の実測値表示 (Avg Stability/Difficulty) を物理確認済み。

## 結果 (実測値)
- **評価ボタン数**: Memory (4), Active (2 + 4 options)
- **FSRS 状態管理**: 安定性・難易度の実測値を `db-audit.html` で確認可能。
- **Rating マッピング**: 
  - まだ (1) / ギリギリ (2) / 覚えた (3) / 簡単 (4)
  - 正解時デフォルト: 3, 不正解時デフォルト: 1
- **Build 結果**: PASS (TypeScript / Vite)
- **Schema 整合性**: FULL_SYNC (v24) 維持

## 動作確認
- MemoryRecall において各評価ボタンが機能し、それぞれ異なる Stability が算出されることを確認。
- ActiveRecall において高速回答を妨げずに詳細評価を追記できることを確認。
- `db-audit.html` において、全カードの平均安定性（Avg Stability）などの集計が表示されることを確認。

## P6 (次フェーズ) への課題
- **動的配分最適化**: FSRS の Due 状況に基づき、Daily Session の Active/Memory 比率を自動調整するロジック。
- **パラメータ自動調整**: 蓄積された `study_events` のログから、ユーザーに最適な FSRS Wパラメータを算出・適用。
- **保持率グラフ**: 長期的な記憶保持率の推移をダッシュボードに表示。

## 判定
**A. P5 Rating UI / Analytics 実装OK**
科学的評価の精密化と、高速学習の利便性を高次元で両立することに成功した。
