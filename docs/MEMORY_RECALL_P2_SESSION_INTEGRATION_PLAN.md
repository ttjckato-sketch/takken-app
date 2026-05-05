# MemoryRecall P2 Session Integration Plan

## 1. 背景
MemoryRecall P1 において、2642枚の高品質な暗記カード（`memory_cards`）の生成に成功した。
P2 では、これらの資産を「今日の学習（Daily Session）」に統合し、過去問演習（ActiveRecall）と暗記（MemoryRecall）を並行して行えるようにする。

## 2. 目的
- 1日30問の標準セッションに MemoryRecall を一定割合で混入させる。
- ActiveRecall の安定稼働を最優先とし、まずは保守的な配分から開始する。
- セッションの統計情報（`mode_distribution`）を正確に記録・集計できるようにする。

## 3. 採用配分 (Initial Distribution)
- **ActiveRecall**: 24問 (80%)
- **MemoryRecall**: 6問 (20%)
- **合計**: 30問

この配分により、既存の過去問演習のリズムを崩さず、1回のセッションで 6枚の重要論点を暗記することが可能になる。

## 4. 変更対象ファイル
- `src/utils/analytics.ts`:
  - `buildDailyStudySessionQueue` のスロット調整。
  - `buildMemoryRecallQueue` を `db.memory_cards` 参照に更新。
  - `completeStudySession` でのモード集計ロジックの確認。
- `src/App.tsx`:
  - セッション開始時のモード判定および View 切り替えの安定性確認。

## 5. 実装範囲 (P2 Scope)
- [ ] `buildDailyStudySessionQueue` の比率を 24:6 に固定。
- [ ] `buildMemoryRecallQueue` のデータ源を `db.memory_cards` に変更。
- [ ] `study_sessions` にセッション内のモード配分が保存されることを確認。
- [ ] セッション結果画面で「Active: 24, Memory: 6」のような内訳を表示可能にする（オプション）。

## 6. Acceptance Criteria (AC)
- **AC-001**: 「今日の学習」ボタンから 30問のキューが生成される。
- **AC-002**: キューの内訳が「ActiveRecall 24問 / MemoryRecall 6問」である。
- **AC-003**: プレースホルダや低品質カードが混入しない。
- **AC-004**: `study_events` に各問題のモード（`active_recall` または `memory_recall`）が正しく保存される。
- **AC-005**: セッション完了後に `study_sessions.mode_distribution` が更新される。
- **AC-006**: 既存の ActiveRecall 単独テストへの影響がない。
- **AC-007**: Build PASS / Schema v24 維持。

## 7. 検証手順
1. `npm run build:clean` でビルド整合性を確認。
2. アプリ上で「今日の学習」を開始。
3. デベロッパーコンソールで `knowledgeQueue` の `session_mode` 分布を確認。
4. 30問を完走（またはテスト用に短縮）し、`study_sessions` テーブルの内容を監査。

## 8. ロールバック方針
- 比率調整に不備がある場合は、`slots` 定義を `active_recall: 30` に戻すことで即座に従来動作へ復旧する。

## 9. P3 へ回すもの (Future Scope)
- SRS（復習間隔）アルゴリズムとの完全連動。
- 特化型カード（NumberRecall / TrapRecall）の本格導入。
- ユーザーの進捗に応じた動的な配分調整。
