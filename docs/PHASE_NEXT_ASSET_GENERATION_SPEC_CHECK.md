# Phase Next: Asset Generation Spec Check

**Phase Name**: PHASE_NEXT_ASSET_GENERATION_SPEC_CHECK
**Start Date**: TBD (Golden Build v24 凍結後)
**Status**: NOT_STARTED

## 目的

Golden Build v24 で Fresh DB 初回インポート時に `memory_cards = 0` / `recovered_learning_assets = 0` だった件について、これが「仕様」か「不具合」かを判定する。

また、`source_questions_takken = 934` が意図した値かを確認する。

## 確認範囲

### 1. memory_cards 生成仕様確認

**確認事項**:
- [ ] memory_cards は初回import対象か
- [ ] 最適化エンジン実行後に生成される仕様か
- [ ] processKnowledgeOptimization() 関数は存在するか
- [ ] いつ・誰が実行するのか（自動/手動）
- [ ] UI上の「最適化」ボタンは存在するか

**期待される結果**:
- 明確な生成仕様が文書化されている
- または、生成漏れとして修正される

### 2. recovered_learning_assets 生成仕様確認

**確認事項**:
- [ ] recovered_learning_assets は初回import対象か
- [ ] 最適化エンジン実行後に生成される仕様か
- [ ] いつ・誰が実行するのか（自動/手動）

**期待される結果**:
- 明確な生成仕様が文書化されている
- または、生成漏れとして修正される

### 3. 多モード学習の成立条件確認

**確認事項**:
- [ ] memory_cards 0 の状態で多モード学習は成立するか
- [ ] ActiveRecall中心のGolden BuildとしてはOKか
- [ ] MemoryRecall / NumberRecall / TrapRecall / ComparisonRecall を本番投入するには追加生成が必要か

**期待される結果**:
- 多モード学習の成立条件が明確になっている
- 本番投入時に必要な手順が明確になっている

### 4. source_questions_takken = 934 確認

**確認事項**:
- [ ] 934 は意図した値か
- [ ] フィルタ条件が正しいか
- [ ] 除外された問題のカテゴリ分布
- [ ] 過去の 1026 / 1044 との差分原因

**期待される結果**:
- 934 の理由が明確になっている
- または、フィルタバグとして修正される

## 実行方法

1. src/ 側のコード調査
   - processKnowledgeOptimization 関数を探す
   - memory_cards 生成ロジックを探す
   - recovered_learning_assets 生成ロジックを探す

2. import/ 初期化ロジック調査
   - 初回importで何が実行されているか
   - 最適化エンジンはいつ実行されるか

3. UI/UX 確認
   - 「最適化」ボタンの有無
   - 多モード学習の選択UI

4. Fresh DB再確認
   - 最新版で再確認
   - 必要ならフィルタ条件調整

## 成功基準

- [ ] memory_cards / recovered_learning_assets の生成仕様が明確になっている
- [ ] 多モード学習の成立条件が明確になっている
- [ ] source_questions_takken = 934 の理由が明確になっている
- [ ] または、問題を特定して修正完了している

## 次フェーズ完了後の状態

- 多モード学習を本番投入するための道筋が立っている
- または、ActiveRecall専用として運用方針が明確になっている

## 依存関係

- Golden Build v24 凍装完了
- DB schema v24 同期完了
- VersionError 解消完了

## 関連ファイル

- docs/RELEASE_SNAPSHOT_GOLDEN_BUILD_v24.md
- docs/KNOWN_CAVEATS_GOLDEN_BUILD_v24.md
- src/db.ts (DB schema v24)
- src/services/ (最適化エンジン実装)
