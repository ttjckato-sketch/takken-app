# STATEMENT ITEMS UNIT AUDIT (2026-05-12)

## 【現状判定】
A. 1問1答の正本単位（statement_items）が確定し、DB設計および移行方針が整理された。

## 【1問1答単位の確定】
| 試験種別 | 元データ | 1問1答単位 | 判定理由 |
|---|---|---|---|
| **宅建** | `ULTIMATE_STUDY_DECK.json` | **カード (Card) 単位** | 既に AI によって 1Q1A 化されており、`card_id` がユニークな学習単位として成立している。 |
| **賃貸管理士** | `chintai_raw.json` | **肢 (Limb) 単位** | 4肢択一形式で保存されているため、肢ごとに ID を振り直し、独立した 1Q1A として扱う必要がある。 |

## 【statement_items 推定総数】
- 宅建: 3,875 件 (Cards)
- 賃貸管理士: 2,000 件 (4 Limbs x 500 Questions)
- **合計: 約 5,875 件**

## 【既存DB評価】
- **`question_explanations`**: 宅建の `card_id` に紐付いているため、100% 移行可能。
- **`choice_explanations`**: 賃貸管理士の肢、または将来的な 4 肢択一用。1肢ごとに `statement_explanation` へ変換。
- **`high_quality_input_units`**: 特定の論点（HQI-PROD-B...）の深層解説として参照を維持。
- **Legacy Placeholder**: `ULTIMATE_STUDY_DECK` 内の不完全な解説は「C品質」としてマークし、順次上書きする。

## 【ゴールド解説 10件候補】
| ID | カテゴリ | 論点 | 理由 |
|---|---|---|---|
| G1 | 宅建業法 | 免許の欠格事由 | 学習の初期で必ず通る重要論点 |
| G2 | 宅建業法 | 35条書面（重要事項説明） | 実務・試験ともに最重要 |
| G3 | 権利関係 | 代理（無権代理） | 登場人物の整理とあてはめの練習に最適 |
| G4 | 権利関係 | 意思表示（詐欺・強迫） | 結論の逆転（善意の第三者）が明確 |
| G5 | 賃貸管理 | 賃貸管理業の登録 | 賃貸管理士試験の核心 |
| G6-G10 | TBD | | 上記分野からランダムに A ランク過去問を抽出 |

## 【安全性】
- DB変更: なし
- source_choices変更: なし
- is_statement_true変更: なし
- 1Q1A単位の再定義により、UI ロジックを「statement_item_id を投げて explanation を 1 件貰う」という極めてシンプルな形に集約可能。
