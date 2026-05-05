# MemoryRecall P26 Recency Decay & Focus Mode Plan

## 1. 背景
MemoryRecall P25 において、Dashboard への「苦手 Top 5」および「推奨アクション」の視覚的統合を完了した。
P26 では、弱点分析の精度を向上させるための **Recency Decay（時間減衰）**、および特定分野を集中的に復習する **苦手克服モード（Focus Mode）** の導入を設計する。

## 2. 目的
- **Recency Decay**: 過去の古いミスよりも、直近の躓きをスコアに重く反映させることで、現在の実力に即した弱点分析を実現する。
- **Focus Mode**: 分析された弱点タグに基づき、分野を絞った短時間集中セッションを提供し、弱点の早期払拭を図る。
- **動的ローテーション**: 成績向上に伴い、Dashboard の Top 5 が自然に入れ替わる健全なメタ認知サイクルを確立する。

## 3. Recency Decay の設計
現在の「直近 100件の単純平均」から、イベントの新しさに応じた重み付け（案B: Index-based Decay）へ移行する。

### 計算式 (Decay Factor)
直近のイベントから順にインデックス（0〜99）を付与し、以下の係数を乗算する。
- `decay_factor = max(0.2, 1.0 - (index / 100))`
- 直近 1件目: `1.0`
- 50件目: `0.5`
- 100件目: `0.2` (最小ガード)

### スコアへの組み込み
- `final_score = base_score(誤答/Rating等) * decay_factor`
- これにより、1ヶ月前の 1ミスよりも昨日の 1ミスが 5倍重く評価され、現在の苦手分野が上位に来やすくなる。

## 4. 苦手克服モード (Focus Mode) の設計
### 概要
- **セッションサイズ**: 10問固定。
- **選定ロジック**: weak_tags Top 1 のタグが付与されたカードを優先抽出。
- **導線**: Dashboard の各苦手タグ横に「特訓」ボタン、または推奨アクション欄に「苦手克服を開始」ボタンを配置。

### 運用方針
- 30問標準・35問集中とは完全に独立した **手動オプション** とする。
- `auto_apply`（配分最適化）には干渉せず、学習者が自発的に行う「追加演習」として位置付ける。

## 5. 安全制約と整合性
- **v24 Schema 維持**: 計算は動的に行い、永続化が必要な場合は `metadata` キャッシュを更新する。
- **回帰ガード**: Focus Mode 実行中も FSRS 更新および `study_events` 記録を正確に行い、メインセッションの統計を壊さない。
- **30Q/35Q 保護**: Daily Session の配分ロジックには手を加えず、P25 までの安定状態を死守する。

## 6. db-audit 監査項目の設計
- `decay_strategy_active`: Index-based Decay が有効か。
- `before_after_decay_comparison`: 減衰適用前後の Top 5 の差異を内部的に監査。
- `focus_mode_eligibility`: タグごとの候補カード数（Focus Mode が成立するか）の確認。

## 7. Acceptance Criteria (AC)
- **AC-001**: P25 の Dashboard 安定状態を維持。
- **AC-002**: Index-based Decay（係数 1.0〜0.2）の論理定義完了。
- **AC-003**: 10問構成の苦手克服モード（Focus Mode）のセッション設計完了。
- **AC-004**: `auto_apply` 未接続（表示・手動モード限定）の方針確定。
- **AC-005**: Build PASS / Schema v24 維持。

## 8. 実装フェーズ (P26/P27/P28 分離)
- **P26 (今回)**: 設計および計画書作成（実装なし）。
- **P27 (次)**: `calculateWeakTagsMetrics` への Recency Decay 組み込みと db-audit 表示。
- **P28 (次々)**: 苦手克服モード（Focus Mode）の物理実装と Dashboard 統合。

## 9. スケジュール
- 今回は設計・計画のみ。次回 Directive で実装を開始する。
