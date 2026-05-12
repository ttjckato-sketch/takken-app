# STATEMENT EXPLANATIONS SSOT DESIGN

## 1. コンセプト: 1Q1A 学習正本の統一
現在のアプリには `source_questions` (1,524) と `source_choices` (3,024) が混在し、1問1答の単位が曖昧である。
学習者が「1画面で解く1つの内容」を `statement_item` と定義し、それに対して一意な高品質解説 `statement_explanation` を紐付けることで、解説DBを SSOT 化する。

## 2. statement_items の定義
- **宅建**: `ULTIMATE_STUDY_DECK.json` にて既に 1Q1A 化（カード化）されているものを正本とする。
  - 基本的に `source_question` 1件 = `statement_item` 1件。
- **賃貸管理士**: 4肢択一の `source_choices` を 1肢ごとに分解して 1Q1A 化する。
  - `source_choice` 1件 = `statement_item` 1件。
- **総数推定**: 約 3,500 〜 4,000 件。

## 3. statement_explanations スキーマ設計
既存の `question_explanations` と `choice_explanations` を統合した新スキーマ。

| フィールド | 型 | 説明 |
|---|---|---|
| `explanation_id` | string (PK) | `SE-` 接頭辞 + UUID |
| `statement_item_id` | string | `KC_` または `CH_` 由来のユニークID |
| `source_question_id` | string? | 元の問題ID |
| `source_choice_id` | string? | 元の選択肢ID |
| `app_type` | 'takken' \| 'chintai' | 試験種別 |
| `category` | string | 分野名 |
| `statement_text` | string | 1Q1A の問題文（肢の文章） |
| `is_statement_true` | boolean | 正解（〇か×か） |
| `conclusion_short` | string | 結論（例: 「代理権の範囲外なので無効です」） |
| `reason_bullets` | string[] | 理由（2〜3点の弾丸形式） |
| `application_to_question` | string | 問題文へのあてはめ |
| `common_trap` | string? | ひっかけポイント |
| `one_line_memory` | string | 1行暗記（最重要ポイント） |
| `source_refs` | object[] | 条文・判例等の根拠ソース |
| `source_trace_grade` | 'A' \| 'B' \| 'C' | 出典の信頼度 |
| `quality` | 'A' \| 'B' \| 'C' | 解説自体の品質 |
| `review_status` | string | `auto_ok` \| `human_review` \| `draft` |
| `label_conflict_suspected`| boolean | 正誤判定と解説内容の矛盾疑い |

## 4. 既存DBの移行・吸収計画
1. **v30 Pilot (32件)**: 最優先で `statement_explanations` へコンバート。
2. **HQI Units (20件)**: `repairUnit` としての参照を維持しつつ、解説テキストを `statement_explanations` の `application` 等に流し込む。
3. **Legacy Placeholder**: 移行対象から除外し、新規に高品質解説を生成する対象リストへ回す。

## 5. ロードマップ

### Phase 1: ゴールド解説 10件 (即時設計)
学習のショーケースとなる「絶対に間違えられない解説」を 10 件作成。
- 対象: 宅建業法「免許」「35条書面」、権利関係「代理」「時効」。

### Phase 2: 重点分野 200件
- 宅建業法・権利関係の A ランク過去問を網羅。

### Phase 3: 全件自動生成 & 自動監査
- v30 スキーマに基づき全件生成。
- `label_conflict_suspected` を自動スキャンし、矛盾があるものを `human_review` へ。

## 6. 品質ゲート (Gate Conditions)
- **Gate 1**: 問題文の固有名詞（A, B, 甲, 乙）が解説の「あてはめ」に使われているか。
- **Gate 2**: `is_statement_true` と解説の「結論」の論理が一致しているか。
- **Gate 3**: 条文番号がプレースホルダ（例: 第00条）になっていないか。
