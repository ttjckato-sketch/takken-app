# Known Caveats - Golden Build v24

**Release Date**: 2026-05-01
**DB Schema Version**: 24
**Status**: Golden Build再判定OK (既知残課題あり)

## 既知残課題一覧

### Caveat #1: fresh_source_questions_takken = 934

**現象**:
Fresh DB 初回インポート時に、source_questions_takken が 934 件のみ。

**背景**:
過去の監査で 1026 / 1044 などの数値が出ていた可能性がある。

**現行v24の状態**:
- 安全フィルタ条件で934に絞られている可能性
- count_choice / combination 問題が除外されている可能性

**確認事項（次フェーズ）**:
- 934 は意図した値か
- フィルタ条件が正しいか
- 除外された問題のカテゴリ分布
- 1026 / 1044 との差分原因

**影響**:
- ActiveRecall 対象宅建問題数が934件に制限されている
- 本番稼働時に問題数不足が発生しないか確認が必要

**優先度**: 中
**ブロッカー**: NO (ActiveRecallは成立)

---

### Caveat #2: fresh_memory_cards = 0 / fresh_recovered_learning_assets = 0

**現象**:
Fresh DB 初回インポート時に、以下のテーブルが 0 件：
- memory_cards: 0
- recovered_learning_assets: 0

**背景**:
これらは多モード学習（MemoryRecall / NumberRecall / TrapRecall / ComparisonRecall）で使用される資産。

**確認事項（次フェーズ）**:
1. 仕様確認
   - 初回importで生成されない仕様か
   - 最適化エンジン実行後に生成される仕様か
   - 手動最適化ボタン押下後に生成される仕様か

2. 生成タイミング
   - processKnowledgeOptimization() 実行後に生成されるのか
   - いつ・誰が実行するのか
   - 自動生成か手動生成か

3. 多モード学習への影響
   - memory_cards 0 の状態で多モード学習は成立するか
   - ActiveRecall中心のGolden BuildとしてはOKか
   - MemoryRecall / NumberRecall / TrapRecall / ComparisonRecall を本番投入するには追加生成が必要か

**想定されるシナリオ**:

**シナリオA**: 初回importでは生成されない（仕様）
- 最適化エンジン実行後に生成される
- ユーザーが「最適化」ボタンを押すと生成される
- Golden Build（ActiveRecall専用）としてはOK

**シナリオB**: 生成漏れ（不具合）
- 初回importで生成すべきものが生成されていない
- 修正が必要

**シナリオC**: 最適化エンジン未実装
- memory_cards 生成機能が未実装
- 次フェーズで実装が必要

**影響**:
- 多モード学習（MemoryRecall等）が使用できない可能性
- 本番稼働時に学習モード選択ができない可能性

**優先度**: 高
**ブロッカー**: 条件付き
- ActiveRecallのみなら NO
- 多モード学習なら YES

---

## 次フェーズでの確認範囲

**PHASE_NEXT_ASSET_GENERATION_SPEC_CHECK** で以下を確認：

1. memory_cards / recovered_learning_assets の生成仕様
2. 初回import対象か、最適化エンジン実行後か
3. 多モード学習の成立条件
4. 本番投入時に追加生成が必要か

---

## 既知残課題への対応方針

| Caveat | 優先度 | ブロッカー | 次フェーズ |
|--------|--------|-----------|-----------|
| #1 takken_source_questions=934 | 中 | NO | YES |
| #2 memory_cards=0 | 高 | 条件付き | YES |

---

## Golden Buildとしての判定

**A. Golden Build再判定OK**

**理由**:
- ActiveRecall（inserted_events=11）は正常に動作
- Grounded解説表示は正常
- suspended_appeared=0
- Console/Networkエラーなし
- 既知残課題は次フェーズで確認

**但し**:
- 多モード学習を本番投入する前に、Caveat #2 を解決する必要がある
