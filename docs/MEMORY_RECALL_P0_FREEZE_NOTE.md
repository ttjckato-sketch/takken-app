# MemoryRecall P0 Freeze Note

## 概要
MemoryRecall P0 (暗記カード 1問表示・回答・保存) の実装が完了し、安定動作を確認した。
本ドキュメントは、P1 (生成件数拡大) に進む前の基準状態を記録するものである。

## 現在の状態
- **Golden Build Version**: 24
- **Schema Sync Status**: FULL_SYNC
- **Build Status**: PASS
- **Memory Cards Count**: 1 (品質フィルタ適用後)
- **主要な変更ファイル**:
  - `src/App.tsx`: 「暗記テスト」導線の追加
  - `src/components/learning/MemoryRecallView.tsx`: 表示・回答・保存ロジックの実装
  - `src/utils/analytics.ts`: `buildMemoryRecallQueue` の接続

## 検証済み項目
- [x] Appダッシュボードに「暗記テスト」ボタンが表示される
- [x] クリックすると `memory_cards` から1問がランダムに表示される
- [x] 「答えを見る」→「覚えた/まだ」の回答フローが動作する
- [x] 回答後、`study_events` に `mode: 'memory_recall'` として正しく保存される
- [x] 既存の ActiveRecall (今日の学習) への影響がない
- [x] `db-audit.html` での整合性チェックが PASS する

## 判明した課題 (Known Caveats)
- **生成件数不足**: Takken側の `source_choices` の多くが「テキスト元データ不足」のプレースホルダを含んでいるため、品質フィルタで除外されている。
- **created_at 未設定**: `memory_cards` テーブルのレコードに `created_at` が入っていない場合がある (生成ロジックの改善が必要)。
- **SRS未連動**: 現時点では回答しても `understanding_cards` のSRSパラメータは更新されない (P1で実装予定)。

## P1 への引き継ぎ事項
- `ULTIMATE_STUDY_DECK.json` の `flashcards` 配列から本文を復元する。
- `ACTIVE_RECALL_SYSTEM.json` の `partial_recall` から本文を復元する。
- `memory_cards` 生成時に `created_at` を付与する。
- `MemoryRecall` 専用の復習アルゴリズムまたは既存SRSへの統合を行う。
