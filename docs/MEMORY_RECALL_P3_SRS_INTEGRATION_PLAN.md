# MemoryRecall P3 SRS Integration Plan

## 1. 背景
MemoryRecall P2 において、1日30問の混合セッション（ActiveRecall 24問 / MemoryRecall 6問）の物理完走と正確な集計に成功した。
P3 では、学習効果を最大化するため、回答結果に基づき「次回復習日（`next_review_date`）」を動的に更新する最小限の間隔反復（SRS）を統合する。

## 2. 目的
- `MemoryCard` および `UnderstandingCard` の両方で、回答結果に応じて復習間隔を調整可能にする。
- 既存の DB Schema v24 を維持し、テーブル構造の変更なしに SRS 状態を保存・管理する。
- セッション生成時に復習期限が来ているカードを優先的に抽出するロジックを確立する。

## 3. 現状分析
- **スキーマ状況**:
  - `understanding_cards` には `srs_params` (EF, interval, repetitions, next_review_date) がすでに存在する。
  - `memory_cards` には現在 SRS 専用フィールドがないが、`KnowledgeUnit` を経由して管理するか、`memory_cards` 自体の型を拡張（コード上のみ）して対応可能。
- **既存ロジック**:
  - `analytics.ts` の `updateCardSRS` が SM-2 風のシンプルアルゴリズムを実装済み（ただし現在は `understanding_cards` 専用）。
  - `buildLearningQueue` が `next_review_date` に基づくスコアリングをサポートしている。

## 4. 最小SRS仕様 (Minimal SRS Policy)
複雑な FSRS パラメータ最適化は P4 以降に送り、P3 では以下のシンプルルールを採用する。

- **正解（Correct）**:
  - 初回正解: 間隔 +1日
  - 2回目連続正解: 間隔 +3日
  - 3回目以降: 間隔 = 前回収穫間隔 × 2.5 (EF)
- **不正解（Wrong）**:
  - 間隔をリセット（0日、翌日復習）
  - 2回連続ミスで `quality_review_needed` フラグを検討（救済資産の場合）。
- **共通化**:
  - `updateCardSRS` を拡張し、`MemoryCard` の ID にも対応可能にする。

## 5. 変更対象ファイル
- `src/db.ts`: `MemoryCard` インターフェースに `srs_params` を（オプショナルで）追加（※Schema変更なし、コード上の型定義のみ）。
- `src/utils/analytics.ts`:
  - `updateCardSRS` を `MemoryCard` にも対応。
  - `buildMemoryRecallQueue` を更新し、復習期限超過分を優先。
  - `buildDailyStudySessionQueue` の優先順位ロジック調整。

## 6. Acceptance Criteria (AC)
- **AC-001**: `MemoryRecall` で回答後、IndexedDB 上の当該カードの復習期限が更新される。
- **AC-002**: 正解時に復習間隔が伸び、不正解時に翌日に設定される。
- **AC-003**: `Daily Session` (30問) 生成時、期限切れカードが優先的にスロット（6問）に割り当てられる。
- **AC-004**: 既存の `ActiveRecall` 側の SRS 動作が壊れていない。
- **AC-005**: 物理実測（3問回答×2モード）により期限更新を確認。
- **AC-006**: Build PASS / Schema v24 / FULL_SYNC 維持。

## 7. 実装範囲を P3/P4 に分離
- **P3 (今回)**: シンプル間隔更新、期限優先抽出、v24維持。
- **P4 (次)**: FSRS パラメータ最適化、4段階評価（Again/Hard/Good/Easy）、長期保持率分析。

## 8. ロールバック方針
- 期限計算に不備がある場合、`updateCardSRS` の呼び出しをコメントアウトすることで、従来のランダム抽出に戻す。

## 9. スケジュール
- 今回は設計・計画のみ。次回 Directive で実装を開始する。
