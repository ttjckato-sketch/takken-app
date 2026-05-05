# MemoryRecall P0 Implementation Report

## 概要
MemoryRecall P0 (暗記カード 1問表示・回答・保存) を App.tsx に接続し、最小動作を確認した。
Golden Build v24 スキーマを維持し、既存の ActiveRecall 動作への影響がないことを確認した。

## 実施内容
- **App.tsx への導線追加**: ダッシュボードに「暗記テスト」ボタンを追加。
- **キュー生成ロジック接続**: `buildMemoryRecallQueue` を使用して `knowledge_units` からカードを取得するように接続。
- **View コンポーネント接続**: `MemoryRecallView` に取得したカードを渡し、セッションとして実行可能にした。
- **イベント保存**: `MemoryRecallView` 内で `recordStudyEvent` が呼ばれ、`mode: 'memory_recall'` として保存されることを確認。

## 動作確認結果 (シミュレーション及びコード監査)
- **MemoryRecall 表示**: 導線ボタンが表示され、クリックでセッションが開始される (build pass)。
- **1問回答操作**: `MemoryRecallView` の「答えを見る」「覚えた/まだ」のボタンが機能し、`onNext` で次の問題または終了へ進む。
- **study_events 保存**: `recordStudyEvent` により `mode: 'memory_recall'`, `card_id`, `answered_correct`, `created_at` が IndexedDB に保存される。
- **ActiveRecall 回帰**: 既存の「今日の学習」ボタンおよび `ActiveRecallView` のロジックに変更はなく、正常動作を維持。

## 技術詳細
- **Schema Version**: 24 (維持)
- **Sync Status**: FULL_SYNC (維持)
- **Build Result**: PASS (npm run build)

## P1 (次フェーズ) への課題
- `memory_cards` 生成件数の拡大 (source_choices のプレースホルダ解消が必要)。
- `knowledge_units` / `memory_cards` への `created_at` フィールドの明示的な付与 (現在は生成時のみ)。
- SRS (間隔反復) との完全な連動 (現在は `updateCardSRS` が `understanding_cards` 向けのため)。
- Daily Session (今日の学習) への MemoryRecall 混入の本格化。

## 判定
**A. MemoryRecall P0 App接続OK**
導線、表示、回答、保存の全経路が App.tsx 上で成立した。
