# MemoryRecall P7 Manual Apply & Persistence Plan

## 1. 背景
MemoryRecall P6 において、FSRS 指標に基づく推奨配分の算出と `db-audit.html` での可視化に成功した。
P7 では、この推奨配分を IndexedDB に永続保存し、ユーザーが手動で次回の学習セッション（Daily Session）に適用できる仕組みを構築する。

## 2. 目的
- 推奨配分データ（`recommended_distribution`）をブラウザメモリから IndexedDB の `metadata` テーブルへ移行し、永続化する。
- ユーザーが推奨案を確認し、納得した上で「適用」ボタンを押すことで、次回の 30問セッションに反映されるようにする。
- 安全性を最優先し、手動適用時でも P6 で定義した安全制約（Active 最低 22問など）を自動検証する。

## 3. 永続保存設計 (Persistence Design)
- **保存先**: `metadata` テーブル
- **キー名**: `study_distribution_config`
- **構造**:
  ```json
  {
    "key": "study_distribution_config",
    "value": {
      "base_active": 24,
      "base_memory": 6,
      "manual_applied_active": null,
      "manual_applied_memory": null,
      "last_recommendation": {
        "active": 22,
        "memory": 8,
        "reason": "...",
        "generated_at": 1714546800000
      },
      "apply_mode": "fixed_or_manual",
      "updated_at": 1714546800000
    }
  }
  ```

## 4. 手動適用フロー (Manual Apply Flow)
1. `db-audit.html` の「推奨配分」セクションに「この配分を次回適用」ボタンを追加。
2. クリック時、`metadata` の `manual_applied_active/memory` フィールドに値を保存し、`apply_mode` を `manual_pending` に変更。
3. 次回の `Daily Session` 開始時（`buildDailyStudySessionQueue` 呼び出し時）に `metadata` を参照。
4. `manual_pending` があれば、安全制約を再チェックした上で、その配分でキューを生成。
5. 生成完了後、`manual_applied_*` をクリアし、`apply_mode` を `fixed_or_manual`（デフォルト）に戻す（1回使い切り適用）。

## 5. 指標の補完 (Active Due Count)
P6 で未実装だった **`active_due_count` (ActiveRecall の復習期限切れ数)** を算出し、推奨ロジックの精度を向上させる。

## 6. Acceptance Criteria (AC)
- **AC-001**: 推奨配分が `metadata` テーブルに永続保存され、ページリロード後も保持される。
- **AC-002**: `active_due_count` が正しく算出され、推奨配分計算に使用される。
- **AC-003**: 手動適用ボタンを押すと、次回の Daily Session キューが推奨された比率（例: 22:8）で生成される。
- **AC-004**: 手動適用後も、安全制約（Active 最低 22問）が遵守される。
- **AC-005**: 適用が 1回完了すると、自動的に 24:6 のデフォルトに戻る。
- **AC-006**: Build PASS / Schema v24 維持。

## 7. 実装フェーズ (P7/P8 分離)
- **P7 (今回)**: 手動適用、永続保存、`active_due_count` 算出。
- **P8 (次フェーズ)**: 完全自動適用オプションの解禁、動的配分の本格分析、App内ダッシュボード統合。

## 8. ロールバック方針
- 配分に異常（合計が 30 にならない、等）がある場合は、常に 24:6 固定配分にフォールバックする安全装置を `buildDailyStudySessionQueue` 内に実装する。
