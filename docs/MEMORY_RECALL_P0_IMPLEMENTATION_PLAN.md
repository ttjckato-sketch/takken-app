# MemoryRecall P0 Implementation Plan

**作成日**: 2026-05-01
**Golden Build**: v24 (凍結済み)
**Status**: 計画策定完了 (実装未開始)

## 背景

Golden Build v24 で ActiveRecall は成立しているが、多モード学習（MemoryRecall / NumberRecall / TrapRecall / ComparisonRecall）は未実装である。

**既知残課題**:
- fresh_memory_cards = 0
- fresh_recovered_learning_assets = 0
- processKnowledgeOptimization() 関数は存在するが呼ばれていない
- buildMemoryRecallQueue() は存在するが、memory_cards=0 のためキューが空

## 現状

### 実装済みコード
- `src/utils/knowledgeEngine.ts`: processKnowledgeOptimization() 関数
- `src/utils/analytics.ts`: buildMemoryRecallQueue() 関数
- `src/components/learning/MemoryRecallView.tsx`: MemoryRecall UI コンポーネント
- `src/db.ts`: memory_cards, knowledge_units, recovered_learning_assets テーブル定義

### 未実装
- processKnowledgeOptimization() の呼び出し経路
- memory_cards 生成のトリガー
- MemoryRecall キューの App.tsx への統合
- session_mode = 'memory_recall' の選択UI
- db-audit.html での memory_cards 件数表示

## P0 スコープ (最小実装)

**目標**: MemoryRecall で1問出題できるようにする

### AC-001: processKnowledgeOptimization() を明示操作で実行できる
- db-audit.html に「Memory Cards生成」ボタンを追加
- ボタンクリックで processKnowledgeOptimization() を実行
- 実行前後の memory_cards 件数を表示

### AC-002: memory_cards が 0 → 1件以上に増える
- 生成実行前に memory_cards.count() = 0
- 生成実行後に memory_cards.count() >= 1
- knowledge_units も生成される

### AC-003: low confidence / placeholder は出題対象に入らない
- confidence = 'low' はキューから除外
- answer に '不足' を含むものは除外

### AC-004: MemoryRecall queue が 1件以上生成される
- buildMemoryRecallQueue() を実行
- queue.length >= 1

### AC-005: MemoryRecallで1問回答できる
- session_mode = 'memory_recall' のカードを出題
- 正解/不正解ボタンが機能する
- study_events に記録される

### AC-006: study_events に mode = 'memory_recall' が保存される
- recordStudyEvent() で mode = 'memory_recall' を保存

### AC-007: Console error 0
- 生成実行時のエラーなし

### AC-008: VersionError 0
- DB schema v24 を維持

### AC-009: ActiveRecall 10問操作が引き続き成功する
- 既存動作の回帰確認

### AC-010: npm run build:clean PASS
- ビルド成功

## P1 スコープ (次フェーズ)

- MemoryRecallのSRS/priority連携
- category/tag別MemoryRecall
- 30問Daily Sessionへの混入
- session_mode 選択UIの実装

## P2 スコープ (将来)

- NumberRecall
- TrapRecall
- ComparisonRecall
- recovered_learning_assets生成
- 自動品質改善ループ連携

## 今回の対象外

- ~~NumberRecall~~
- ~~TrapRecall~~
- ~~ComparisonRecall~~
- ~~recovered_learning_assets生成~~
- ~~session_mode 選択UI~~
- ~~SRS連携~~
- ~~Daily Session混入~~

---

## 採用実装案

### 案A: db-audit手動生成方式 (推奨)

**内容**:
- db-audit.html に「Memory Cards生成」ボタンを追加
- processKnowledgeOptimization() を呼び出す
- 生成前後の memory_cards / knowledge_units 件数を表示

**メリット**:
- Golden Buildを壊しにくい
- 手動確認しやすい
- 初期importが重くならない
- 失敗時にロールバックしやすい

**デメリット**:
- ユーザーが生成ボタンを押す必要がある

**実装内容**:
1. db-audit.html にボタン追加
2. 生成関数呼び出し (processKnowledgeOptimization)
3. 生成前後件数表示
4. エラーハンドリング

### 案B: 初回import後の自動生成方式 (非推奨)

**内容**:
- ensureAllDataReady() 後に自動実行
- memory_cardsを初回から作る

**メリット**:
- すぐMemoryRecallを使える

**デメリット**:
- 初期ロードが重くなる
- 失敗時の影響が大きい
- Golden Buildの安定性を壊すリスクが高い

---

## 推奨実装案

**案A: db-audit手動生成方式**

**理由**:
1. Golden Build v24 の安定性を最優先
2. ユーザーが明示的に生成をトリガーできる
3. 生成失敗時に既存DBに影響を与えない
4. 実装範囲が最小限に抑えられる

---

## 変更対象ファイル

1. **public/db-audit.html**
   - 「Memory Cards生成」ボタン追加
   - 生成前後件数表示
   - エラーハンドリング

2. **src/utils/knowledgeEngine.ts** (変更なし)
   - processKnowledgeOptimization() 既存関数を使用

3. **src/App.tsx** (変更なし、P1で対応)
   - session_mode 選択は P1 に延期

---

## 検証手順

### 事前準備
1. Fresh Profile で確認
2. before_memory_cards = 0 を確認

### P0 検証
1. db-audit.html を開く
2. 「Memory Cards生成」ボタンをクリック
3. memory_cards >= 1 であることを確認
4. knowledge_units >= 1 であることを確認
5. Console error = 0 を確認
6. VersionError = 0 を確認

### 回帰検証
1. ActiveRecall で10問回答
2. inserted_events = 10 以上であることを確認
3. grounded_explanation_visible = YES

---

## ロールバック方針

- db-audit.html のボタン削除でロールバック可能
- memory_cards / knowledge_units は db.delete() でクリア可能
- DB schema v24 は維持

---

## Golden Build保護ルール

1. **DB version 変更禁止**: v24 を維持
2. **public/db-audit.html の v24 同期維持**: CURRENT_DB_VERSION = 24
3. **ActiveRecall 既存動作維持**: session_mode = 'active_recall' の動作を壊さない
4. **初期importへの変更禁止**: loadInitialData() は変更しない

---

## 次フェーズへの道筋

P0 完了後、P1 で以下を実装：
1. session_mode 選択UI
2. App.tsx への buildMemoryRecallQueue 統合
3. Mixed Mode Session (ActiveRecall + MemoryRecall 混在)
