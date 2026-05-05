# 宅建破損カード復元PoC計画書 (2026-05-03)

## 1. 背景と目的
宅建ActiveRecallの安全母集団（1024件）の稼働が確認されたが、依然として2621件のカードが「破損または不明（broken_or_unknown / recovery_pending）」として運用から除外されている。
本PoCでは、これら除外カードの破損原因を詳細に特定し、復元可能性の高い50件を「復元候補（Restoration Candidates）」として抽出・登録することで、次段階の自動復元パイプラインの設計指針を得ることを目的とする。

## 2. 破損原因の分類（対象: 2621件）
調査に基づき、以下のカテゴリで分類を行う。
- **recovery_pending**: `correct_patterns` が空、または変換エラー。
- **missing_question_text**: 問題文がプレースホルダや空。
- **missing_choice_text**: 選択肢テキストが不足。
- **placeholder**: 「TBD」「未定義」等の仮テキスト。
- **short_text**: 3文字以下の極端に短いテキスト（例: 「なし」「1つ」）。
- **count_combination**: 個数問題または組合せ問題（現在の〇×形式に不適合）。
- **duplicate_card_id**: 同一IDによる上書き消失。
- **law_revision_risk**: 法改正により無効化された可能性のある古いデータ。

## 3. PoC候補抽出ポリシー（選定数: 50件）
以下の基準で、手動または半自動復元が容易なものを優先する。
1. **構造化情報の残存**: 年度、問番号、肢番号が明確であること。
2. **カテゴリバランス**: 業法(20)、権利(10)、制限(10)、税他(5)、賃管(5)の配分。
3. **出題形式**: 1問1答（〇×）に落とし込みやすい単純な記述であること。
4. **除外**: 個数問題（count_combination）は本PoCの対象外とする。

## 4. 復元フロー（将来像）
1. `restoration_candidates` への登録（本フェーズ）。
2. 公的ソースまたは整合性のある既存DBからのテキスト補完（次フェーズ）。
3. 人間またはAIによる最終確認（Human-in-the-loop）。
4. `source_choices` への昇格（Promotion）とActiveRecallへの組み込み。

## 5. 安全性担保
- 既存の1024件の `source_choices` および `source_questions` は変更しない。
- `knowledge_units` や `memory_cards` への直接登録は行わない。
- 作業用サイドカーテーブル（`restoration_candidates`）内でのみ作業を完結させる。
