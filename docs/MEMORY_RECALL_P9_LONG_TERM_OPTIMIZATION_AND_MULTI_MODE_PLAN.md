# MemoryRecall P9 Long-Term Optimization & Multi-Mode Plan

## 1. 背景
MemoryRecall P8 にて、FSRS 実測値に基づいた「安全な」自動配分適用（Auto Apply）が稼働し始めた。
しかし現在の指標は直近 7日間に限定されており、またモードも ActiveRecall と MemoryRecall の 2つに限られている。
P9 では、学習の長期定着を最適化する新たな指標の導入と、アプリ内 Dashboard への統合、そして次なる特化型モード（NumberRecall等）の統合手順を設計する。

## 2. 目的
- 7日単位の短期指標から、30日以上の長期的な学習効果（忘却曲線）を評価する指標へ拡張する。
- ユーザーに「自動適用状態」や「明日の復習予定」を分かりやすく伝える App 内 Dashboard を設計する。
- NumberRecall などの特化モードを、安全制約（Active 最低 22問）を壊さずに Daily Session へ混入する順番とルールを確立する。
- P8 の既知の課題（`run_id` の不在、単発判定による揺らぎ）を解消する。

## 3. 長期最適化の対象 (Metrics Strategy)
P9 以降で採用する長期指標:
- **`active_accuracy_30d`**: 全体的な学習トレンドの評価（短期のブレを吸収）。
- **`retention_proxy`**: FSRS `stability` と `last_review` から算出する現在時点の推計記憶保持率（90%目標）。
- **`due_next_7_days`**: 向こう1週間の復習負荷予測（過負荷時の新規学習抑制に利用）。

*※ 弱点タグ (weak_tags) 等のコンテンツ特化分析は P10 へ見送る。*

## 4. Known Caveats (P8) の解決方針
- **`auto_apply_run_id`**: 自動適用が走るたびに UUID を生成し `metadata` と `study_sessions` に記録し、ロールバック時のトレース精度を向上させる（P10 実装）。
- **`recommendation_stability`**: 推奨配分が前日と同一方向（増/減）を示した場合にのみ `auto_apply` を発動する。これにより一時的な正答率低下による配分のバタつきを防ぐ（P10 実装）。

## 5. App 内 Dashboard 設計
管理用の `db-audit.html` から学習者向け UI へ以下の要素を移植する。
- **今日の学習進捗**: `completed / total`
- **次回の自動配分予告**: 「明日は暗記重点モード(22:8)が発動予定です」
- **FSRS スコア**: 平均安定性 (定着度) と 期限切れ数 (復習の山)
*※ 設定画面（自動適用 ON/OFF トグル）はプロフィールの Settings 内に配置を検討。*

## 6. 多モード統合方針 (Multi-Mode Strategy)
既存の「Active 22問最低保証」を守るため、総問題数を 30問から増やすか、MemoryRecall の枠を削るかの二択となる。

**推奨戦略 (P10 以降順次実装)**:
1. **Total 30問維持 (初期)**: 
   - `Active 22` / `Memory 6` / `Number 2` (Memory枠を分割)
2. **Total 35問拡張 (安定後)**: 
   - `Active 24` / `Memory 6` / `Number 3` / `Trap 2`
- **統合順序**: `NumberRecall` -> `TrapRecall` -> `ComparisonRecall`

## 7. 公式 `ts-fsrs` 移行判断
- **現状**: 独自 `fsrsAdapter` により Schema v24 を維持したまま要件を満たしている。
- **判断**: **当面見送り**。公式ライブラリ導入によるバンドルサイズ増加と Schema 更新リスク（v25以降への強制）を避けるため、現行のアダプター方式を正本として運用を継続する。

## 8. Acceptance Criteria (AC)
- **AC-001**: 既存の P8 Auto Apply の安全制約（24:6ベース、Active>=22）が完全に維持されていること。
- **AC-002**: P10 実装に向けた長期指標（retention_proxy 等）の算出ロジックが定義されていること。
- **AC-003**: NumberRecall 導入時における配分ルール（Memory枠の分割）が明記されていること。
- **AC-004**: P8 Caveats 解消方針が確定していること。
- **AC-005**: 公式 ts-fsrs を利用しないことが決定されていること。
- **AC-006**: Build PASS / Schema v24 / FULL_SYNC 維持。

## 9. 実装フェーズ (P9/P10 分離)
- **P9 (今回)**: 上記の設計および計画書作成（実装なし）。
- **P10 (次)**: NumberRecall 最小実装、App Dashboard への指標表示、`run_id` および安定性チェックの実装。
- **P11 (将来)**: TrapRecall 等の追加、35問セッションへの拡張。

## 10. スケジュール
- 今回は設計・計画のみ。次回 Directive で実装を開始する。
