# MemoryRecall P30 Focus Progress & Top5 UI Plan

## 1. 背景
MemoryRecall P29 において、苦手分野に特化した 10問集中特訓モード（Focus Mode）の安定稼働を物理監査した。
P30 では、特訓の効果を可視化する **Focus Progress Graph** の導入、および Dashboard の **Top 5 UI 整理** を設計し、学習者が改善を実感できる仕組みを構築する。

## 2. 目的
- **改善の可視化**: 特訓（Focus Mode）を実施した分野の正答率や定着度が向上しているかをグラフで示し、達成感を醸成する。
- **UI の最適化**: Dashboard の情報密度を整理し、最も重要な「No.1 弱点」への対策を強調する。
- **データ駆動の確信**: 漠然とした不安を、具体的な「改善数値」に変えることで、試験直前期のメンタルを安定させる。

## 3. Focus Progress 指標の設計
以下の指標を `focus_tag`（分野）ごとに集計し、推移を分析する。

### 採用指標 (P31目標)
- **Focus Accuracy**: 当該タグでの Focus Mode 内正答率。
- **Recent Accuracy Delta**: 前回の Focus Session との正答率差分（例: +15%）。
- **Focus Session Count**: 当該分野での特訓実施回数。
- **Stability Improvement**: FSRS 上の平均定着度（Stability）の上昇幅。

### 算出範囲
- `study_sessions` (variant='focus_10q') および関連する `study_events`。
- 直近 10 セッションをスライディングウィンドウとして利用。

## 4. Dashboard 表示方針 (学習者向け)
### 視覚的フィードバック
- **Progress Card**: 「特訓の成果」セクションを新設。
- **表示形式**: Top 1 苦手タグの正答率推移を小型の棒グラフまたはパーセンテージで表示。
- **トレンド表示**: 「前回より向上中！」「横ばい、もう一踏ん張り」等のメッセージ。

### Top 5 UI 整理 (案B)
- **Top 1**: カードを大きく表示し、「10Q Focus」ボタンを強調。
- **Top 2-5**: リスト形式でコンパクトに表示し、ボタンを小型化。
- **レイアウト**: 縦並びから、重要度に応じた階層化へシフト。

## 5. 安全制約と整合性
- **v24 Schema 維持**: 集計は動的に行い、永続化が必要な場合は `metadata` にキャッシュ。
- **配分エンジンの保護**: Focus Progress は表示のみに限定し、Daily Session の配分（30Q/35Q）や `auto_apply` には干渉しない（P33以降で検討）。

## 6. db-audit 監査項目の設計
- `focus_tag_aggregation_integrity`: タグごとの集計が正確か。
- `session_variant_filter_accuracy`: Focus Session が正しく抽出されているか。
- `performance_impact`: 履歴集計による Dashboard 読み込み遅延の有無。

## 7. Acceptance Criteria (AC)
- **AC-001**: P29 の Focus Mode 安定状態を維持。
- **AC-002**: 改善指標（Accuracy Delta / Stability Gain）の論理定義完了。
- **AC-003**: Top 1 強調・Top 2-5 コンパクト化の UI 刷新案の策定。
- **AC-004**: `auto_apply` 未接続（表示・手動モード限定）の方針再確認。
- **AC-005**: Build PASS / Schema v24 維持。

## 8. 実装フェーズ (P30/P31/P32 分離)
- **P30 (今回)**: 上記の設計および計画書作成（実装なし）。
- **P31 (次)**: Focus Progress 算出ロジックの実装と db-audit 表示。
- **P32 (次々)**: Dashboard UI 刷新（Top 1 強調）と小型グラフ統合。

## 9. スケジュール
- 今回は設計・計画のみ。次回 Directive で実装を開始する。
