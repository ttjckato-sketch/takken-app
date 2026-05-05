# MemoryRecall P3 SRS Integration Report

## 概要
MemoryRecall および ActiveRecall の両方に対応した最小限の SRS（間隔反復）機能を実装した。
回答結果に基づいて次回復習日（`next_review_date`）を動的に更新し、Daily Session において期限切れカードを優先的に出題するサイクルを確立した。

## 実施内容
- **`updateCardSRS` の拡張**: `analytics.ts` 内の SRS 更新ロジックを、`UnderstandingCard` に加え `MemoryCard` にも対応させた。`MC-` プレフィックスを検知して適切にテーブルを切り替える。
- **データ永続化**: `MemoryCard` に対しては IndexedDB の動的プロパティとして `srs_params` を保存することで、Schema v24 を変更せずに状態管理を実現。
- **キュー生成の最適化**: `buildMemoryRecallQueue` にスコアリングロジックを導入。復習期限超過（overdue）カードに高いプライオリティを付与し、Daily Session の 6問枠に優先的に割り当てるようにした。
- **View との接続**: `MemoryRecallView.tsx` において、回答保存直後に `updateCardSRS` を呼び出すように接続。
- **監査機能の追加**: `db-audit.html` に、モード別の「復習期限切れ（Due）」カード数を表示する項目を追加。

## 結果 (実測値)
- **SRS 対応テーブル**: `understanding_cards`, `memory_cards`
- **復習間隔ロジック**: 正解時 (+1日/3日/EF倍)、不正解時 (翌日リセット)
- **Due カード優先抽出**: PASS (スコアリングによるソートを確認)
- **Build 結果**: PASS (TypeScript / Vite)
- **Schema 整合性**: FULL_SYNC (v24) 維持

## 動作確認
- 物理テストにより、暗記カードの回答後に `next_review_date` が正しく設定・更新されることを確認。
- ActiveRecall 側も同様に SRS パラメータが維持・更新されることを確認（回帰テスト合格）。
- Daily Session (30問) において、設計通りの 24:6 配分を維持したまま、学習履歴に基づいたパーソナライズされた出題が開始された。

## P4 (次フェーズ) への課題
- **FSRS 本格導入**: 4段階評価（Again/Hard/Good/Easy）に基づいた、より科学的な保持率計算の実装。
- **長期分析ダッシュボード**: 忘却曲線や保持率の推移を可視化する UI の追加。
- **動的配分最適化**: 未学習カードと復習カードの比率を、個人の学習進捗に合わせて自動調整するロジック。

## 判定
**A. MemoryRecall P3 SRS Integration OK**
最小限の SRS ループが全モードで開通し、実用的な「忘れない学習」の基盤が完成した。
