# MemoryRecall P33 Top 5 UI Refinement & Weak Score Delta Plan

## 1. 背景
MemoryRecall P32 において、苦手分野特化特訓（Focus Mode）の成果を可視化する指標算出ロジックを実装し、Dashboard に「特訓の成果」を統合した。
P33 では、学習者が「今最も対策すべき弱点」を迷わず認識し、改善を定量的に実感できる環境を整えるため、Dashboard の **Top 5 UI 整理** および改善指標 **weak_score_delta** を設計する。

## 2. 目的
- **意思決定の簡素化**: Top 1 弱点を「Priority Card」として強調し、学習者が次に取るべき行動を明確にする。
- **改善の数値化**: 特訓（Focus Mode）の前後で弱点スコアがどれだけ減少したか（delta）を定義し、克服の実感を与える。
- **UI の階層化**: 情報密度のバランスを取り、Top 2-5 はコンパクトな補助情報として整理する。

## 3. Top 5 UI 整理の設計
### Top 1: Priority Card (最優先弱点)
- **デザイン**: カードを大きく配置し、他の項目と差別化。
- **表示内容**: 分野名、苦手理由（詳細）、その分野の最新の特訓正答率（Focus Progress 連動）、目立つ「10Q Focus」ボタン。
- **期待効果**: 学習者が迷わず「最優先の特訓」を開始できる。

### Top 2-5: Compact List (その他の弱点)
- **デザイン**: 1行ずつのコンパクトなリスト形式。
- **表示内容**: 分野名、簡易スコア、小型の Focus ボタン。
- **期待効果**: Dashboard の圧迫を抑えつつ、全体像を把握可能にする。

## 4. weak_score_delta (改善スコア) の設計
### 目的
特訓実施により、当該分野の「弱点スコア」がどれだけ下がったかを追跡する。

### 算出アルゴリズム案 (案A: Cache Comparison)
- `weak_tags_cache` に保存された前回の累積スコアと、最新の累積スコアの差分を計算。
- **利点**: システム全体の計算式をそのまま利用できるため、論理的な一貫性が高い。
- **式**: `delta = previous_score - current_score` (正の値が改善を示す)。

## 5. 安全制約と整合性
- **auto_apply (自動適用)**: P33/P34 時点では、UI 整理や改善スコアを自動適用（配分変更）には接続しない。表示と監査に限定する。
- **v24 Schema 維持**: 新テーブルは作成せず、`metadata` へのキャッシュ拡張により対応する。
- **回帰ガード**: Daily Session (30Q/35Q) の配分ロジック（22:3:2:2:1 等）は一切変更しない。

## 6. db-audit 監査項目の設計
- `top1_priority_resolution_integrity`: Top 1 タグと Focus Progress の紐付け精度。
- `weak_score_delta_candidate_audit`: 算出された改善幅の妥当性。
- `ui_layer_distribution_metrics`: 階層化による Dashboard の描画パフォーマンス。

## 7. Acceptance Criteria (AC)
- **AC-001**: P32 の Focus Progress 安定稼働を維持。
- **AC-002**: Top 1 強調・Top 2-5 コンパクト化の具体的な Component 設計完了。
- **AC-003**: `weak_score_delta` 算出ロジックの定義完了。
- **AC-004**: auto_apply 未接続（表示限定）の方針再確認。
- **AC-005**: Build PASS / Schema v24 維持。

## 8. 実装フェーズ (P33/P34/P35 分離)
- **P33 (今回)**: 上記の設計および計画書作成（実装なし）。
- **P34 (次)**: Dashboard UI 刷新（Priority Card 実装）と改善スコアの試験算出。
- **P35 (次々)**: `weak_score_delta` の Dashboard 統合と P33-P35 Freeze。

## 9. スケジュール
- 今回は設計・計画のみ。次回 Directive で実装を開始する。
