# MemoryRecall P5 Rating UI & Analytics Plan

## 1. 背景
MemoryRecall P4 において、独自実装の `fsrsAdapter` による科学的な復習間隔計算の導入に成功した。
P5 では、FSRS の精度を最大限に引き出すため、従来の 2段階評価（正解/不正解）から 4段階評価（Again, Hard, Good, Easy）への拡張と、学習状況の可視化（分析ダッシュボード）を段階的に実施する。

## 2. 目的
- FSRS の本来の性能を引き出す 4段階評価 UI の導入（操作性を損なわない設計）。
- 学習統計（安定性、難易度、保持率）を可視化し、学習者が自身の進捗を実感できるようにする。
- 既存の Daily Session 24:6 配分を維持しつつ、より精度の高いスケジュール管理を実現する。

## 3. UI 設計案 (案D: 2ボタン + 詳細評価オプション)
宅建学習のテンポを重視し、以下の「段階的評価 UI」を採用する。

- **ActiveRecall (過去問演習)**:
  - 従来通り「正しい/誤り」の 2ボタンで回答。
  - 回答後の「正解！/不正解...」画面の隅に、小さく「簡単だった」「難しかった」を選択できる補助ボタンを追加（任意）。
  - 未選択時は従来通り `Good (3)` または `Again (1)` として処理。
- **MemoryRecall (暗記カード)**:
  - 「答えを見る」の後の評価ボタンを 4つに拡張。
  - 日本語ラベル:
    - **Again (1)**: 「まだ（忘れた）」
    - **Hard (2)**: 「ギリギリ（苦戦）」
    - **Good (3)**: 「覚えた（普通）」
    - **Easy (4)**: 「簡単（瞬殺）」

## 4. 分析ダッシュボード設計
まずは管理用の `db-audit.html` を強化し、将来的に App 内ダッシュボードへ統合する。

- **主要指標**:
  - **FSRS 総数**: FSRS 状態を持つカードの総数。
  - **期限切れ (Due)**: 本日復習が必要なカード数。
  - **平均安定性 (Avg Stability)**: 知識の定着度合い。
  - **平均難易度 (Avg Difficulty)**: 苦手論点の集中度。
  - **評価分布 (Rating Dist)**: Again〜Easy の選択比率。
  - **保持率推定 (Estimated Retention)**: 予測される正答率。

## 5. 変更対象ファイル
- `src/utils/fsrsAdapter.ts`: `scheduleWithFSRS` を 4段階 Rating に完全対応させる。
- `src/components/learning/ActiveRecallView.tsx`: 詳細評価オプション UI の追加。
- `src/components/learning/MemoryRecallView.tsx`: 評価ボタンの 4段階化。
- `public/db-audit.html`: FSRS 分析セクションの追加とグラフ化（Chart.js 等の利用検討）。

## 6. Acceptance Criteria (AC)
- **AC-001**: `MemoryRecall` で 4つの評価ボタンが表示され、それぞれ異なる間隔が計算される。
- **AC-002**: `ActiveRecall` で 2ボタン回答後、詳細評価を任意で選択できる（デフォルト動作は維持）。
- **AC-003**: `db-audit.html` で FSRS の安定性・難易度の分布が数値またはグラフで確認できる。
- **AC-004**: 評価結果が `study_events` に `rating` フィールド（1-4）として正確に保存される。
- **AC-005**: Build PASS / Schema v24 / 24:6 配分維持。

## 7. ロールバック方針
- UI の変更が複雑すぎる場合は、CSS の `display: none` またはフラグ管理により即座に 2ボタン UI に戻せるように実装する。

## 8. スケジュール
- 今回は設計・計画のみ。次回 Directive で実装を開始する。
