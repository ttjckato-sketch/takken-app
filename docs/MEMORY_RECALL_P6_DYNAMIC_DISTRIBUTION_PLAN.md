# MemoryRecall P6 Dynamic Distribution Plan

## 1. 背景
MemoryRecall P5 において、4段階評価 UI と詳細な FSRS 分析機能の導入に成功した。
P6 では、これらの実測データ（正答率、復習期限切れ数、レーティング分布）を活用し、1日30問の「今日の学習（Daily Session）」の配分をユーザーの学習状況に合わせて最適化する **動的配分 (Dynamic Distribution)** を導入する。

## 2. 目的
- ユーザーの弱点や復習負荷に応じて、ActiveRecall と MemoryRecall の比率を自動調整する。
- 過去問演習（ActiveRecall）の最低比率を保証し、試験対策としての有効性を維持する。
- FSRS の Due 状況に基づき、適切なタイミングで暗記カードを提示する。

## 3. 採用指標 (Selected Metrics)
以下の 5つの指標に基づき配分を算出する。
- **`active_accuracy_7d`**: 直近7日間の ActiveRecall 正答率。
- **`memory_accuracy_7d`**: 直近7日間の MemoryRecall 正答率。
- **`memory_due_count`**: 本日復習が必要な暗記カード数。
- **`overdue_count`**: 期限を大幅に超過しているカードの総数。
- **`rating_1_2_ratio`**: 自己評価で「まだ(1)」「ギリギリ(2)」を選んだ割合。

## 4. 安全制約 (Safety Constraints)
学習バランスを崩さないため、以下の制約を厳守する。
- **セッション総数**: 常に 30問固定。
- **ActiveRecall 最小数**: 22問 (約73%)。
- **MemoryRecall 最大数**: 8問 (約27%)。
- **MemoryRecall 最小数**: 4問 (約13%)。
- **変更幅**: 1日あたりの変動は最大 ±2問。
- **ガードロジック**: `active_accuracy_7d` < 70% の場合、ActiveRecall の比率を下げない。

## 5. 動的配分ルール (Adjustment Rules)
- **基準値**: Active 24 / Memory 6
- **暗記強化モード**: `memory_due_count` > 30 かつ `active_accuracy` >= 75% の場合 -> **Active 22 / Memory 8**
- **演習重点モード**: `active_accuracy` < 70% または `rating_1_2_ratio` > 40% の場合 -> **Active 26 / Memory 4**
- **デフォルト**: 上記以外、またはログ不足時 -> **Active 24 / Memory 6**

## 6. 実装フェーズ (P6/P7 分離)
- **P6 (今回)**: 
  - 動的配分計算ロジックの実装。
  - `db-audit.html` に「推奨配分」を表示。
  - 実適用はデフォルト OFF (または手動切り替え)。
- **P7 (次フェーズ)**: 
  - 動的配分の全自動適用。
  - 特化型カード (Number/Trap/Comparison) の混入。
  - ユーザー別パラメータ最適化。

## 7. Acceptance Criteria (AC)
- **AC-001**: 5つの指標に基づき、動的配分を正確に計算できる。
- **AC-002**: 配分が安全制約 (22〜26 / 4〜8) の範囲内に収まる。
- **AC-003**: `db-audit.html` に現在のステータスに基づく推奨配分が表示される。
- **AC-004**: 既存の P5 FSRS 計算および 24:6 固定運用を壊さない。
- **AC-005**: Build PASS / Schema v24 維持。

## 8. ロールバック方針
- 計算ロジックに不備がある場合、フラグ `use_dynamic_distribution` を `false` にすることで即座に P5 の固定配分に戻す。
