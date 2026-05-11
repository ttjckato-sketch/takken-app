# v30 20件Pilot生成設計書

**作成日**: 2026-05-11
**担当**: AI Architect
**フェーズ**: Phase 3 - 20 Pilot Expansion
**前回コミット**: 3098783

---

## 1. 設計概要

### 1.1 目的

Phase2-005（5件Pilot）の成功を受け、20件Pilot生成のための設計を行う。本設計は、カテゴリ配分、品質基準、停止条件、出力ファイル設計を含む。

### 1.2 前提条件

- Phase2-005安定点commit完了（commit: 3098783）
- 5件Pilot quality_A達成
- クーリング・オフ条文番号修正完了（35条の2 → 37条の2）
- DB投入なし
- source_choices/is_statement_true変更なし

### 1.3 今回やること

- 20件Pilotのカテゴリ配分設計
- takken/chintaiの件数配分設計
- source_refs方針設計
- 品質判定方針設計
- 停止条件設計
- 出力ファイル設計

### 1.4 今回やらないこと

- 20件Pilot生成（実装は次フェーズ）
- question_explanations/choice_explanationsへの本投入
- formal import実装
- explanationMatcher.ts実装
- RepairPreview v30連携
- commit/push/deploy

---

## 2. 生成目標

### 2.1 件数目標

| 項目 | 目標値 |
|:---|:---:|
| **合計Pilot数** | **20件** |
| takken Pilot | 14件 |
| chintai Pilot | 6件 |
| question_explanations | 20件 |
| choice_explanations（最小） | 40件 |
| choice_explanations（最大） | 60件 |
| source_refs（最小） | 40件 |
| source_refs（最大） | 120件 |

### 2.2 成功基準

| 項目 | 基準値 |
|:---|:---:|
| quality_A最小件数 | 16件 |
| quality_A最小比率 | 80% |
| quality_C最大件数 | 2件 |
| quality_C最大比率 | 10% |
| 全件auto_ok妥当 | 100% |
| label_conflict無視 | 0件 |
| source_refs整合 | 100% |
| 条文番号誤り | 0件 |

---

## 3. カテゴリ配分

### 3.1 配分概要

| カテゴリ | 件数 | takken/chintai | 重点分野 |
|:---|:---:|:---:|:---|
| **農地法** | 3件 | takken | 3条許可、4条/5条届出特例 |
| **35条/37条** | 3件 | takken | 契約前説明、契約後交付 |
| **媒介契約** | 3件 | takken | 一般/専任/専属専任、報告頻度 |
| **クーリング・オフ** | 2件 | takken | 37条の2、告知/申出、期間 |
| **賃貸住宅管理業法** | 3件 | chintai | 67条1項/2項、業務管理者 |
| **借地借家法** | 2件 | takken | 普通/定期借家、正当事由 |
| **民法系** | 2件 | takken | 詐欺/強迫、代理、時効 |
| **税・その他** | 2件 | takken | 登録免許税、不動産取得税 |
| **合計** | **20件** | takken 14 / chintai 6 | |

### 3.2 カテゴリ別詳細

#### 3.2.1 農地法（3件）

**条文整理**:

| 条文 | 場面 | 要件 | 市街化区域内 |
|:---|:---|:---|:---:|
| **3条** | 権利移転 | **許可** | **許可**（届出で足りない） |
| **4条** | 自己所有農地転用 | 許可 | 届出 |
| **5条** | 転用目的の権利移転 | 許可 | 届出 |

**Trapパターン**:
- "3条 + 届出" = trap（3条は許可が必要）
- "権利移転 + 届出" = trap（市街化区域でも許可）
- "市街化区域 = 届出" = trap（4条・5条の転用場面のみ）

**生成重点**:
1. 3条権利移転許可
2. 4条転用届出
3. 市街化区域内届出特例の範囲

#### 3.2.2 35条/37条（3件）

**条文整理**:

| 条文 | タイミング | 内容 | 相手方 |
|:---|:---|:---|:---|
| **35条** | 契約成立**前** | 重要事項**説明** | 相手方 |
| **37条** | 契約成立**後** | 契約内容記載書面**交付** | 当事者 |

**Trapパターン**:
- "35条/37条条文混同"
- "契約前後区別なし"

**生成重点**:
1. 35条重要事項説明（契約前）
2. 37条契約内容書面交付（契約後）
3. 契約前/契約後、説明/交付の区別

#### 3.2.3 媒介契約（3件）

**種類整理**:

| 種類 | 業務処理状況報告 | 指定流通機構 | 自己発見取引 |
|:---|:---:|:---:|:---:|
| **一般媒介契約** | 義務なし | 義務なし | 可能 |
| **専任媒介契約** | **2週間**に1回以上 | 義務あり | 可能 |
| **専属専任媒介契約** | **4週間**に1回以上 | 義務あり | **不可** |

**Trapパターン**:
- "媒介契約種類区別なし"
- "報告頻度混同"

**生成重点**:
1. 一般媒介契約
2. 専任媒介契約（2週間1回）
3. 専属専任媒介契約（4週間1回、自己発見不可）

#### 3.2.4 クーリング・オフ（2件）

**条文整理**:

| 項目 | 内容 |
|:---|:---|
| **正しい条文** | **第37条の2** |
| **誤った条文** | 35条の2（存在しない） |
| **義務** | 書面による告知 |
| **権利** | 申込みの撤回、契約の解除 |

**Trapパターン**:
- "35条の2" = 誤り（必ず37条の2を使用）
- "告知/申出区別なし"

**生成重点**:
1. 37条の2書面告知義務
2. 申込み撤回・契約解除・期間制限

**Critical Rule**: 必ず37条の2を使用する。35条の2は誤り。

#### 3.2.5 賃貸住宅管理業法（3件）

**条文整理**:

| 条文 | 義務 | 内容 |
|:---|:---|:---|
| **67条1項** | 業者による書面交付 | 管理業者が書面を交付 |
| **67条2項** | 業務管理者本人記名押印 | 業務管理者が記名押印 |

**Trapパターン**:
- "67条1項/2項区別なし"
- "本人説明義務範囲誤り"

**生成重点**:
1. 管理受託契約重要事項説明
2. 管理受託契約締結時書面
3. 業務管理者・登録対象

#### 3.2.6 借地借家法（2件）

**種類整理**:

| 種類 | 更新 | 期間満了通知 | 書面要件 |
|:---|:---:|:---:|:---:|
| **普通借家** | あり | 6ヶ月〜1年前 | なし |
| **定期借家** | なし | 1〜6ヶ月前 | **あり** |

**Trapパターン**:
- "普通/定期借家区別なし"
- "正当事由不要と誤認"

**生成重点**:
1. 普通/定期借家の区別
2. 更新拒絶・正当事由

#### 3.2.7 民法系（2件）

**概念整理**:

| 概念 | 要点 |
|:---|:---|
| **詐欺（第三者）** | 取消可 |
| **強迫（第三者）** | 取消不可（本人が取消可） |
| **無権代理** | 無権限者が本人のために代理 |
| **表見代理** | 相手方の保護 |
| **時効** | 完成だけでは効力生じず、援用が必要 |

**Trapパターン**:
- "詐欺/強迫第三者対抗誤り"
- "無権代理/表見代理区別なし"

**生成重点**:
1. 詐欺/強迫の第三者対抗
2. 無権代理/表見代理

#### 3.2.8 税・その他（2件）

**税目整理**:
- 登録免許税
- 不動産取得税
- 消費税
- 固定資産税

**Trapパターン**:
- "税率誤り"
- "課税標準誤り"

---

## 4. 品質設計

### 4.1 quality_A 基準

| 要件 | 基準値 |
|:---|:---:|
| 問題文固有の語句 | 3語以上 |
| application_to_question | 80文字以上 |
| correct_answer_reason / why_this_answer | 80文字以上 |
| why_user_wrong | 40文字以上 |
| source_refs | 1件以上 |
| source_refs整合性 | 結論と直接対応 |
| generic_template_detected | false |
| label_conflict_suspected | false |
| human_review_required | false |

**review_status**: `auto_ok`
**ready_for_import**: `true`

### 4.2 quality_B 基準

| 要件 | 基準値 |
|:---|:---:|
| 大筋 | 正しい |
| 根拠・当てはめ・why_user_wrong | 一部が弱い |
| 問題文固有の語句 | 1〜2語 |
| application_to_question | 50〜79文字 |
| why_user_wrong | 20〜39文字 |

**review_status**: `draft` または `human_review_required`
**ready_for_import**: `false`
**アクション**: 修正または追加生成

### 4.3 quality_C 基準

| トリガー | 内容 |
|:---|:---|
| 汎用文中心 | 問題文固有の語句なし |
| 条文番号誤り | 条文番号が間違っている |
| 法令解釈誤り | 法令の解釈が間違っている |
| source_refs不一致 | source_refsと結論が不一致 |
| 正誤ラベル疑義 | 正誤ラベルに疑義がある |
| source_refsなし | source_refsなしでauto_ok |
| 民間サイトのみ | 民間サイトだけでauto_ok |

**review_status**: `human_review_required`
**ready_for_import**: `false`
**アクション**: 要修正・再生成

---

## 5. review_status 設計

### 5.1 auto_ok

**条件**:
- quality_A
- source_refsが1件以上で一次法令
- label_conflict_suspected = false
- human_review_required = false

### 5.2 human_review_required

**条件**:
- quality_C
- label_conflict_suspected = true
- source_refsなし
- 条文番号誤り疑い
- 法令解釈誤り疑い

### 5.3 draft

**条件**:
- quality_B
- 根拠不十分
- 当てはめ不足

---

## 6. フィールド設計

### 6.1 trap_detected

**定義**: 選択肢にtrapキーワードが含まれているか（正誤とは無関係）

**例**:
- "農地法3条 + 届出"
- "媒介契約種類混同"
- "35条/37条混同"

**注意**: trap_detected = true は必ずしも誤りを意味しない。正しい選択肢でもtrapキーワードを含む場合がある。

### 6.2 label_conflict_suspected

**定義**: is_statement_trueと法的結論が矛盾している可能性

**トリガー条件**: is_statement_true = true だが、法令解釈上は誤りである、またはその逆

**重要度**: HIGH

**アクション**: label_conflict_suspected = true の場合、human_review_required = true にする

---

## 7. source_refs 設計

### 7.1 ソースタイプ優先順位

| 優先度 | タイプ | 説明 |
|:---:|:---|:---|
| **PRIMARY** | `e_gov` | 一次法令（電子政府の窓口、e-Gov） |
| **SECONDARY** | `official` | 省庁・公的機関公式サイト |
| **SUPPLEMENTARY** | `private` | 民間サイト・学習サイト（補足のみ） |

### 7.2 整合性ルール

**source_refs[].article と結論が直接対応している必要がある**:

- applicable_rule に条文番号が含まれている
- source_refs[].article と applicable_rule の条文番号が一致している
- supports_field でどのフィールドを支えるか明示

### 7.3 必須条件

- **一次法令必須**: official_source_required = true
- **民間サイトのみでauto_ok禁止**: private_site_auto_ok_allowed = false

---

## 8. 停止条件

### 8.1 Hard Stop（即時停止・再設計）

以下が1件でも出たら、即時停止・再設計:

1. 条文番号誤り
2. 法令解釈誤り
3. source_refsと結論の不一致
4. source_refsなしでauto_ok
5. 民間サイトだけでauto_ok
6. label_conflict_suspectedを無視してauto_ok
7. is_statement_trueを変更した
8. source_choicesを変更した
9. DBへ投入した
10. build FAIL

**アクション**: 即時停止・原因分析・再設計

### 8.2 Soft Warning（警告・修正推奨）

以下が3件以上連続した場合、警告:

1. quality_B が3件以上連続
2. generic_template_detected が3件以上連続
3. 問題文固有の語句が1〜2語のみが3件以上連続

**アクション**: 生成プロンプト調整・再生成

---

## 9. 出力ファイル設計

### 9.1 メイン出力

| ファイル | パス | フォーマット | 内容 |
|:---|:---|:---:|:---|
| メイン出力 | `docs/generated/v30_pilot_question_choice_explanations_phase3_020.json` | JSON | 20 pilots with question_explanations and choice_explanations |
| 監査レポート | `docs/audit/V30_PILOT_EXPLANATION_PHASE3_020_QUALITY_AUDIT.md` | Markdown | 品質監査レポート |
| 監査JSON | `docs/audit/v30_pilot_explanation_generation_phase3_020_report.json` | JSON | 監査結果JSON |

---

## 10. 安全性制約

### 10.1 禁止事項

以下はPhase3設計時点では禁止:

1. question_explanations への本投入
2. choice_explanations への本投入
3. db.add / db.bulkAdd / db.put / db.bulkPut
4. formal import実装
5. explanationMatcher.ts実装
6. RepairPreview v30連携
7. source_choices変更
8. is_statement_true変更
9. study_events変更
10. DB削除
11. DB clear
12. IndexedDB初期化
13. npm install
14. package.json変更
15. package-lock.json変更
16. commit
17. push
18. deploy

---

## 11. 次フェーズ準備

### 11.1 20件Pilot成功後

1. 全問題・全選択肢の解説生成計画
2. 本格生成パイプライン設計
3. formal import実装設計
4. explanationMatcher.ts設計

---

**設計署名**: AI Architect
**日付**: 2026-05-11
**ステータス**: 設計完了（実装待ち）
