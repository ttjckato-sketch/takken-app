# 宅建・賃貸管理士学習アプリ 知識加工本番監査レポート (v2.5)

## 1. 総合判定
- **本番加工**: A / 確定保存完了
- **MemoryRecall教材資産**: A / 運用可能 (2297枚)
- **全3024肢加工**: まだ禁止 (適格プール 2093 件の内 781 件を KU 化完了)
- **教材復元**: 次フェーズ候補 (除外理由の分析完了)

## 2. 確定資産 (run_id: KNOWLEDGE_OPT_PROD_ELIGIBLE_20260503_114959)
| 項目 | 件数 | 備考 |
| :--- | :--- | :--- |
| **Knowledge Units (KU)** | 781 | 適格プール 2093 件から厳選 |
| **Memory Cards (MC)** | 2,297 | 高品質な法的シグナル抽出済み |
| **Displayable MC** | 1,535 | Confidence High のみを表示対象 |
| **Low Confidence MC** | 762 | 母集団維持のため保存、表示からは除外 |
| **Confusion Pairs** | 300 | 制度の横断整理ペア |

## 3. 品質指標
- **矛盾の疑い (Contradiction)**: 0
- **プレースホルダー混入**: 0
- **重複 ID**: 0
- **ハードストップ発動**: なし (NONE)

## 4. DB状態分離の健全性 (V27 アーキテクチャ)
- **Content (不変)**: `memory_cards` に教材データ本体を保持。教材再生成による上書きを許容。
- **State (保護)**: `memory_card_progress` に FSRS/記憶状態を分離。教材が再生成されても ID が不変であれば学習進捗は維持される。
- **History (分離)**: `memory_study_events` に履歴を独立保存。既存の ActiveRecall 統計（`study_events`）への混入を物理的に遮断。

## 5. 現在アプリで可能な学習
- **ActiveRecall**: 従来どおりの演習フロー（10Q Focus 等）を継続利用可能。
- **MemoryRecall**: 1,535 枚の高品質カードによる 10Q 暗記特訓が利用可能。
- **データ管理**: `db-audit.html` にて、物理バックアップ(JSON)、ドライラン、リアルタイム統計の確認が可能。

## 6. 次フェーズへの提言
- **推奨アクション 1: MemoryRecall 運用実証**: 実際の学習セッションを通じて `memory_card_progress` の増加と SRS の効きを検証。
- **推奨アクション 2: 50件教材復元 PoC**: 今回「null_statement」や「解説不足」で除外された 2621 件に対し、外部ソースを用いたパッチングの有効性を検証。

---
**Audit Date**: 2026-05-03  
**Auditor**: Gemini CLI (Senior Auditor / Engineer)
**Status**: STABLE / READY FOR NEXT PHASE
