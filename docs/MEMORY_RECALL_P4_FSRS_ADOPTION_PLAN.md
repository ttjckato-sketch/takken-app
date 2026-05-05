# MemoryRecall P4 FSRS Adoption Plan

## 1. 背景
MemoryRecall P3 において、ActiveRecall と MemoryRecall 両対応の最小 SRS（SM-2風）の実装に成功し、30問フル完走による動作確認を完了した。
P4 では、より高度で科学的な学習アルゴリズムである **FSRS (Free Spaced Repetition Scheduler)** を導入し、学習効率のさらなる最適化を目指す。

## 2. 目的
- 現在のシンプルな SM-2 アルゴリズムから、安定性（Stability）と難易度（Difficulty）に基づく FSRS v4 アルゴリズムへ移行する。
- 既存の DB Schema v24 を維持したまま、FSRS 状態を保存・管理する手法を確立する。
- ユーザーインターフェースの大規模変更を避けつつ、評価モデルを高度化する。

## 3. 現状分析と課題
- **現状**: `efactor` (SM-2由来) を使用。正解/不正解の 2段階評価のみ。
- **課題**: FSRS は通常「Again / Hard / Good / Easy」の 4段階評価を必要とする。
- **データ項目差分**:
  - 現在: `efactor`, `interval`, `repetitions`, `next_review_date`, `quality_history`
  - FSRS要求: `stability`, `difficulty`, `elapsed_days`, `scheduled_days`, `reps`, `lapses`, `state`, `last_review`

## 4. 実装戦略
### A. ライブラリ選定
- **`ts-fsrs`**: TypeScript 対応が最も進んでおり、ブラウザ・オフライン環境での実績も豊富なため、これを採用候補とする。

### B. スキーマ戦略 (v24維持)
- `memory_cards` および `understanding_cards` の `srs_params` フィールド（動的プロパティ含む）に、FSRS 用のパラメータを JSON オブジェクトとして追記する。
- 既存の `next_review_date` はそのまま Due 判定に使用し、ロジックのみを FSRS に置き換える。

### C. UI・評価モデルの橋渡し
- P4 の初期段階では、既存の「覚えた / まだ」の 2ボタン UI を維持する。
- **マッピング案**:
  - 「覚えた（Correct）」 → FSRS: `Good` (Rating 3)
  - 「まだ（Incorrect）」 → FSRS: `Again` (Rating 1)
- UI の 4ボタン化（Again/Hard/Good/Easy）は、アルゴリズムの安定稼働を確認した後の P5 以降とする。

## 5. Acceptance Criteria (AC)
- **AC-001**: `ts-fsrs` (または同等ロジック) により、安定性と難易度が計算・更新される。
- **AC-002**: 回答後に `srs_params` 内に FSRS 固有のフィールド（stability, difficulty等）が保存される。
- **AC-003**: 既存の Simple SRS から FSRS 状態へ、最初の回答時に安全に自動移行される。
- **AC-004**: Daily Session 24:6 配分および Due 優先ソートが FSRS の due に基づき正常に機能する。
- **AC-005**: 物理実測（3問回答）により、FSRS パラメータの変動を確認。
- **AC-006**: Build PASS / Schema v24 維持。

## 6. ロールバック方針
- FSRS 移行に問題が発生した場合は、`srs_params` 内の旧 `efactor` モデルに戻すフォールバックロジックを用意する。

## 7. スケジュール
- 今回は設計・計画のみ。次回 Directive で実装を開始する。
