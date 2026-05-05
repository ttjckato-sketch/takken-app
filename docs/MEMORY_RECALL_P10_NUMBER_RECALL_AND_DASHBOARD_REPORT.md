# MemoryRecall P10 NumberRecall & Dashboard Implementation Report

## 概要
多モード学習の第一弾として `NumberRecall` (数字暗記) を最小実装し、同時に P8 の既知の課題（run_id, 安定性判定）を解消した。また、学習者向けの最小 Dashboard をアプリ本体に統合した。

## 実施内容
- **P8 Caveats 解消**:
  - `auto_apply_last_run_id` の生成と保存を実装。自動適用の各イベントに一意の ID を付与。
  - `recommendation_stability` (2回連続同一方向ルール) を実装し、突発的な指標変動による配分乱高下を抑止。
- **NumberRecall 最小実装**:
  - `knowledge_cards` の `core_knowledge.rule` から数字（年数、％、金額等）を含む論点を 390件抽出。
  - `NumberRecallView.tsx` を新規作成。数字を伏せ字（[ ? ]）にして提示し、自己評価で回答する学習フローを実現。
  - `mode: 'number_recall'` を `StudyEvent` に追加し、FSRS 更新および統計集計を可能にした。
- **Daily Session への試験導入**:
  - `buildDailyStudySessionQueue` において、Memory 枠の一部を Number 枠へ分割（Active 24, Memory 4, Number 2）するマルチモード配分をデフォルト化した。
  - Active 22問最低保証の安全制約を厳守。
- **App 内 Dashboard 最小統合**:
  - `App.tsx` のトップ画面に、FSRS 定着度 (Stability)、復習期限数 (Due)、自動適用状態を表示するウィジェットを追加。

## 結果 (実測値)
- **NumberRecall 候補数**: 390 枚
- **P10 セッション配分**: Active 24 : Memory 4 : Number 2
- **run_id トレース**: `AUTO-P10-YYYYMMDD...` 形式での記録を確認。
- **Build 結果**: PASS (npm run build)
- **Schema 整合性**: FULL_SYNC (v24) 維持

## 動作確認
- 「今日の学習」を開始すると、過去問・暗記・数字の 3つのモードが混在して出題されることを確認。
- アプリ本体の Dashboard に、現在の知識の安定性や復習の山がリアルタイムで反映されることを確認。
- ロールバックおよび手動予約が、マルチモード化されたセッションに対しても正常に機能することを物理 Trace 監査済み。

## P11 (次フェーズ) への課題
- `TrapRecall` (ひっかけ) の設計と統合。
- `NumberRecall` における具体的な正解数字の判定補助。
- App Dashboard での分野別弱点（weak_tags）の可視化。
- セッション総数の 35問への拡張検討。

## 判定
**A. P10 NumberRecall / Dashboard 実装OK**
マルチモード学習の道筋が確立され、学習者へのフィードバックループが強化された。
