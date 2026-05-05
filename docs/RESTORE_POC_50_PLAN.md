# 教材復元 PoC (50件) 実施計画書

## 1. 目的
本番加工フェーズで「データ品質不足」を理由に除外された肢（約 1,500 件）のうち、特定の 50 件を対象に外部ソースを用いたパッチングを行い、復元プロセスの有効性と安全性を検証する。

## 2. 背景と除外理由の現状 (実測値)
3,024 肢の母集団に対する分析結果：
- **テキスト不足 (Placeholder)**: 1,062 件 (35.1%) - 「テキスト不足」等のプレースホルダー
- **判定不能 (Null Statement)**: 464 件 (15.3%) - 正誤判定が `null`
- **その他 (未サンプリング等)**: 1,498 件 (49.5%)
※個数問題・組み合わせ問題は、現在の〇×判定エンジンでは正確な KU 化が困難なため、復元優先度を調整。

## 3. 50件 PoC 選定方針
復元難易度と学習価値のバランスを考慮し、以下の 50 件を選定する。
- **テキスト不足の解消 (25件)**: 
  - 年度・問番号・肢番号が判明している「業法」「権利」のプレースホルダーを優先。
- **正誤判定の確定 (15件)**: 
  - 解説文はあるが `is_statement_true` が欠落しているものを、解説文解析と外部照合で補完。
- **解説の肉付け (10件)**:
  - 15文字未満の短文解説肢に対し、法的根拠（条文等）をパッチ。

## 4. 3段階の復元戦略 (Restoration Levels)
### Level 1: 内部参照復元
- 同一年度の他肢や、`knowledge_cards` の類似項目から解説文・判定を補完。
### Level 2: 公的ソース・過去問照合
- 国交省「宅地建物取引業法」条文、e-Gov 法令検索、および公式過去問解答をソースとして引用。
- `source_refs` フィールドに根拠 URL または条文番号を明記。
### Level 3: 人間確認 (Expert Review)
- 改正法の影響を受ける旧問や、個数問題の正誤判定については `review_status: human_review_required` としてマーク。

## 5. データ設計 (Sidecar Table)
復元データは `source_choices` を直接汚染せず、以下の `restoration_candidates` テーブルで管理する。

| フィールド | 型 | 説明 |
| :--- | :--- | :--- |
| `restoration_id` | string (PK) | `RES-` 接頭辞 + ID |
| `source_choice_id` | string | 元データへの参照 |
| `restored_text` | string | 補完後の問題文 |
| `restored_explanation` | string | 補完後の解説文 |
| `restored_is_true` | boolean | 確定した正誤判定 |
| `source_refs` | string[] | 根拠ソース（URL/条文） |
| `confidence` | string | high / medium |
| `review_status` | string | auto_ok / human_required / rejected |

## 6. 成功基準 (Success Criteria)
- **復元完了率**: 50件中 40件以上 (80%)。
- **自動承認率 (auto_ok)**: 25件以上。
- **根拠明示率**: 復元成功分の 90% 以上で `source_refs` が存在すること。
- **整合性**: `restored_is_true` と `restored_explanation` の間に矛盾がないこと（矛盾疑い 0）。

## 7. 禁止事項
- 根拠のない AI 推測による `is_statement_true` の埋め込み。
- 既存の `memory_card_progress`（学習進捗）への破壊的変更。
- 3024 肢全件への一括適用（本 PoC 完了まで禁止）。

---
**Plan Date**: 2026-05-03  
**Owner**: Gemini CLI (Restoration PoC Lead)
