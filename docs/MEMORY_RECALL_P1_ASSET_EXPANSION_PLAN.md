# MemoryRecall P1 Asset Expansion Plan

## 1. 背景
MemoryRecall P0 では暗記カードの機能が実現されたが、生成件数が 1件にとどまっている。これは、Takken側のソースデータ変換時に肢のテキストが復元できておらず、「テキスト元データ不足」というプレースホルダが品質フィルタで除外されているためである。
P1 では、既存のリッチなデータソースから本文を復元し、生成件数を大幅に拡大する。

## 2. 現状分析
- **発生源**: `src/utils/takkenSourceTransformer.ts` の `extractChoicesFromPattern` でプレースホルダを生成している。
- **原因**: `correct_patterns` には肢のテキストが含まれておらず、正解の肢番号しか持っていないため。
- **フィルタ**: `db-audit.html` の生成ロジックが、プレースホルダを含むカードを意図的に除外している（正しい挙動）。

## 3. 復元候補データ源
調査の結果、以下のデータ源から高品質な本文を復元可能であることが判明した。

1. **`ULTIMATE_STUDY_DECK.json` (flashcards 配列)**
   - 各知識カードに紐付く 〇×形式のフラッシュカード。
   - 本文 (`qa.q`) と正解 (`qa.a`) が揃っている。
   - 1枚の知識カードから平均 5〜10枚の肢を復元可能。
2. **`ACTIVE_RECALL_SYSTEM.json` (active_recall_deck)**
   - `partial_recall` タイプの問題に、復元済みの肢の文章が含まれている。

## 4. 推奨案: 案D (統合復元)
`takkenSourceTransformer.ts` を拡張し、`knowledge_cards` テーブル (ULTIMATE_STUDY_DECK.json 由来) の `flashcards` データを `source_choices` に流し込む。

### 実装手順
1. **`takkenSourceTransformer.ts` の修正**:
   - `extractChoicesFromPattern` を廃止し、`knowledge_cards` の `flashcards` を検索して `SourceChoice` を作成する `recoverChoicesFromKnowledgeCard` 関数を実装する。
2. **`knowledgeEngine.ts` の調整**:
   - `created_at` を `MemoryCard` に付与する。
   - 生成時に品質チェックを継続しつつ、復元されたテキストを優先的に使用する。
3. **`db-audit.html` の更新**:
   - 生成ボタンのロジックを `knowledgeEngine.ts` の最新版に合わせ、プレースホルダ以外のカードを確実に生成するようにする。

## 5. Acceptance Criteria (AC)
- **AC-001**: `memory_cards` の件数が 1件から 50件以上に拡大する。
- **AC-002**: 生成されたカードに「テキスト元データ不足」が含まれない。
- **AC-003**: 生成されたカードに `created_at` が付与されている。
- **AC-004**: Appの「暗記テスト」で、拡大されたカードセットから出題される。
- **AC-005**: 既存の ActiveRecall 動作への影響ゼロ。
- **AC-006**: build:clean PASS / Schema v24 維持。

## 6. リスクと対策
- **リスク**: 重複カードの発生。
- **対策**: `card_id` + `option_no` (または flashcard index) で一意識別を行い、`bulkPut` で上書きする。
- **リスク**: メモリ消費。
- **対策**: 大量の `flashcards` を一括処理せず、バッチ処理 (100枚単位など) で DB に保存する。

## 7. スケジュール
- 今回は調査・計画のみ。次回 Directive で実装を開始する。
