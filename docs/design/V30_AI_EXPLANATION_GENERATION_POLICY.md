# v30 AI解説生成方針設計

**バージョン**: 1.0.0
**作成日**: 2026-05-10
**担当**: AI Engineer
**対象**: v30 question_explanations / choice_explanations AI生成仕様

---

## 1. 目的

v30解説データのAI生成において、生成仕様・根拠仕様・レビュー仕様を固定し、品質の一貫性を担保する。

---

## 2. 生成対象

### 2.1 初回対象カテゴリ

| カテゴリ | 説明 | 優先度 |
|:---|:---|:---:|
| 農地法 3条・4条・5条 | 農地権利移動の許可・届出 | 高 |
| 35条書面 / 37条書面 | 重要事項説明・契約書面 | 高 |
| 媒介契約 | 専任媒介・一般媒介等 | 中 |
| クーリング・オフ | 訪問販売・通信販売等 | 中 |
| 詐欺・強迫 | 取消原因 | 中 |
| 借地借家法 | 賃貸借契約 | 中 |
| 賃貸住宅管理業法 | 管理業務適正化 | 低 |

### 2.2 初回件数

**注意**: 最初から大量生成しないこと。

| タイプ | 件数 | 理由 |
|:---|:---:|:---|
| question_explanations | 5〜10件 | 品質検証のため |
| choice_explanations | 15〜30件 | 1問あたり3選択肢 |

### 2.3 対象選定基準

1. **法令根拠が明確**: 条文・通達で根拠が特定できるもの
2. **正誤ラベル安定**: is_statement_trueの信頼性が高いもの
3. **解説の具体性**: 問題文固有の事実関係があるもの
4. **頻出分野**: 過去問での出題頻度が高いもの

---

## 3. 生成フィールド

### 3.1 question_explanations 必須フィールド

| フィールド | 説明 | 最低文字数 | 品質要件 |
|:---|:---|:---:|:---|
| question_focus | 問題の核心 | 10文字 | 問題文固有の語句を含む |
| key_phrases | 重要語句 | 3件 | 問題文から抽出した語句 |
| facts_summary | 事実関係 | 50文字 | 問題文の具体的事実を列挙 |
| issue_structure | 論点構造 | 30文字 | 法的争点を明示 |
| applicable_rule | 適用ルール | 40文字 | 条文番号・要件を明示 |
| application_to_question | 問題文への当てはめ | 80文字 | 具体的な事実と要件の対応 |
| correct_conclusion | 正解の結論 | 20文字 | 明確な結論 |
| why_this_answer | なぜ正解か | 60文字 | 法的根拠と当てはめ |
| common_misread | 誤読パターン | 40文字 | 典型的な誤解 |
| trap_points | ひっかけポイント | 2件 | 具体的なひっかけ内容 |
| memory_hook | 暗記フレーズ | 15文字 | 1行で覚える要点 |
| source_refs | 根拠ソース | 1件以上 | 一次法令を優先 |
| source_trace_grade | 根拠等級 | A/B/C/D | source_refsの質 |
| confidence | 確信度 | high/medium/low | 根拠の強さ |
| review_status | レビュー状態 | auto_ok/draft/human_review_required | 品質判定 |
| label_conflict_suspected | 正誤疑義 | boolean | is_statement_trueの矛盾検出 |
| human_review_required | 人的レビュー要 | boolean | 品質閾値 |

### 3.2 choice_explanations 必須フィールド

| フィールド | 説明 | 最低文字数 | 品質要件 |
|:---|:---|:---:|:---|
| statement_text | 選択肢文 | - | source_choicesから引用 |
| is_statement_true_snapshot | 正誤ラベル | - | 変更禁止 |
| correct_answer_reason | 正解の理由 | 40文字 | 〇/×の根拠 |
| why_true | なぜ正しいか | 30文字 | 条文適用 |
| why_false | なぜ誤りか | 30文字 | 条文不適合 |
| why_user_wrong | なぜ誤答するか | 40文字 | 典型的な誤解 |
| application_to_statement | 選択肢文への当てはめ | 60文字 | 具体的な対応関係 |
| key_phrases | 重要語句 | 2件 | 選択肢文から抽出 |
| rule | 適用ルール | 30文字 | 条文・要件 |
| exception | 例外 | 20文字 | 例外があれば記載 |
| trap | ひっかけ | 20文字 | 具体的なひっかけ |
| compare_with | 他選択肢との比較 | 30文字 | 混同しやすい点 |
| one_line_memory | 1行暗記 | 15文字 | 要点 |
| source_refs | 根拠ソース | 1件以上 | 一次法令を優先 |
| source_trace_grade | 根拠等級 | A/B/C/D | source_refsの質 |
| confidence | 確信度 | high/medium/low | 根拠の強さ |
| review_status | レビュー状態 | auto_ok/draft/human_review_required | 品質判定 |
| label_conflict_suspected | 正誤疑義 | boolean | is_statement_trueの矛盾検出 |
| human_review_required | 人的レビュー要 | boolean | 品質閾値 |

---

## 4. 生成品質ルール

### 4.1 禁止パターン

以下の生成を禁止する。

| 禁止事項 | 例 | 理由 |
|:---|:---|:---|
| 汎用テンプレートのみ | 「法令の規定に関する正誤判断です」 | 問題文に即していない |
| 抽象的指示のみ | 「基本ルールを確認しましょう」 | 具体的な当てはめがない |
| 事実列挙のみ | 「問題文の事実を整理しましょう」 | 法的評価がない |
| 問題文固有語句なし | カテゴリ名のみの解説 | 具体性に欠ける |
| 正誤理由なし | 「正解は〇です」のみ | 根拠が不明 |
| why_user_wrongなし | 誤答者の誤解を説明しない | 学習効果が低い |
| source_refsなしのauto_ok | 根拠なしで高品質判定 | 信頼性が低い |
| AI推測のみのauto_ok | 推論のみで確定 | 検証不可能 |
| 民間サイトのみのauto_ok | 信頼性が一次法令に劣る | 根拠が弱い |

### 4.2 必須要件

| 要件 | 説明 | 閾値 |
|:---|:---|:---|
| 問題文固有の語句 | 問題文・選択肢文から抽出した語句を含む | 3語以上 |
| 具体的な当てはめ | 事実と要件の具体的な対応 | 80文字以上 |
| 明確な正誤理由 | なぜ〇/×かの法的根拠 | 40文字以上 |
| 具体的な誤答理由 | 誤答者が陥る典型的な誤解 | 30文字以上 |
| 一次法令の根拠 | e-Gov等の一次法令を引用 | 1件以上 |

### 4.3 品質チェックリスト

生成時に以下を確認する。

- [ ] question_focusに問題文固有の語句が含まれる
- [ ] facts_summaryに問題文の具体的事実が列挙されている
- [ ] application_to_questionに事実と要件の対応が記述されている
- [ ] why_this_answerに法的根拠と当てはめが記述されている
- [ ] why_user_wrongに誤答者の典型的な誤解が記述されている
- [ ] source_refsに一次法令が含まれている
- [ ] source_refsのsupports_fieldで対応関係が明示されている
- [ ] trap_pointsに問題文固有のひっかけが含まれている

---

## 5. source_refs 設計

### 5.1 優先ソース

| 優先度 | source_type | 説明 | 例 |
|:---:|:---|:---|:---|
| **1** | e_gov | e-Gov法令データ | 農地法、宅建業法 |
| **1** | mlit | 国土交通省 | 宅建業法通達 |
| **1** | moj | 法務省 | 民法、借地借家法 |
| **1** | maff | 農林水産省 | 農地法通達 |
| **2** | official_exam | 過去問公式 | 宅建試験問題 |
| **2** | retio | 不動産適正取引推進機構 | 宅建業法解説 |
| **3** | tax_commission | 国税庁 | 贈与税・相続税 |
| **4** | local_gov | 自治体公式資料 | 東京都条例等 |
| **5** | other | その他 | 民間サイト等 |

**注意**: 一次法令（優先度1-2）がなければauto_okとしない。

### 5.2 必須フィールド

| フィールド | 型 | 必須 | 説明 |
|:---|:---:|:---:|:---|
| source_type | string | ✅ | ソース種別 |
| title | string | ✅ | 法令名・資料名 |
| url | string | ✅ | URL |
| law_name | string | ✅ | 法令名（法令の場合） |
| article | string | ✅ | 条番号・節等 |
| supports_field | string[] | ✅ | 支えるフィールド |
| checked_at | number | - | 確認日時 |
| note | string | - | 備考 |

### 5.3 supports_field 設計

supports_fieldには、その根拠が何を支えるかを明示する。

**値の例**:

| supports_field | 適用フィールド | 説明 |
|:---|:---|:---|
| applicable_rule | question_explanations | 適用されるルール |
| correct_answer_reason | choice_explanations | 正解の理由 |
| application_to_question | question_explanations | 問題文への当てはめ |
| application_to_statement | choice_explanations | 選択肢文への当てはめ |
| exception | question/choice | 例外規定 |
| trap_points | question/choice | ひっかけポイント |

**実装例**:

```typescript
const sourceRefs: SourceRef[] = [
  {
    source_type: 'e_gov',
    title: '農地法',
    url: 'https://elaws.e-gov.go.jp/document?lawid=327AC0000000222',
    law_name: '農地法',
    article: '3条1項',
    supports_field: ['applicable_rule', 'correct_answer_reason'],
    checked_at: Date.now()
  }
];
```

### 5.4 alignment_check

source_refsの内容と解説フィールドの対応関係を検証する。

**検証ロジック**:

1. source_refsに含まれるlaw_nameが解説文に言及されている
2. source_refsに含まれるarticleが解説文に引用されている
3. supports_fieldで指定されたフィールドに根拠が反映されている

**合格条件**:

- source_refsのlaw_nameが解説文に1回以上言及されている
- source_refsのarticleが解説文に引用されている
- supports_fieldで指定されたフィールドに根拠が反映されている

---

## 6. review_status 設計

### 6.1 auto_ok 条件

**すべての条件を満たす必要がある**。

| 条件 | 説明 | 閾値 |
|:---|:---|:---|
| source_trace_grade | 根拠等級 | A |
| source_refs_count | 一次法令の件数 | 1件以上 |
| source_refs_alignment | 根拠と解説の対応 | すべてのsupports_fieldで対応確認 |
| problem_specificity | 問題文固有の当てはめ | application_to_questionに具体的事実 |
| why_user_wrong_concrete | 誤答理由の具体性 | 30文字以上で具体的な誤解 |
| label_conflict_suspected | 正誤ラベル疑義 | false |
| human_review_required | 人的レビュー要 | false |
| confidence | 確信度 | high |

### 6.2 human_review_required 条件

**いずれかの条件を満たす場合**。

| 条件 | 説明 |
|:---|:---|
| 正誤ラベル疑義 | label_conflict_suspected = true |
| 根拠が弱い | source_trace_grade = C/D |
| 条文だけでは判断が難しい | 判例・通達・実務運用が絡む |
| 古い過去問 | 現行法とのズレがあり得る |
| AI生成の確信度が低い | confidence = medium/low |
| source_refs_alignmentが弱い | supports_fieldで指定されたフィールドに対応がない |

### 6.3 draft 条件

**auto_okとhuman_review_requiredの中間**。

| 条件 | 説明 |
|:---|:---|
| source_trace_grade | B |
| 一部のフィールドが弱い | why_user_wrongが短い等 |
| source_refs_alignmentが一部弱い | 一部のsupports_fieldに対応がない |

### 6.4 rejected 条件

**以下の場合**。

| 条件 | 説明 |
|:---|:---|
| 明らかな誤り | 法令の解釈が誤っている |
| 品質基準を満たさない | 汎用テンプレートのみ等 |

---

## 7. label_conflict_suspected 設計

### 7.1 疑義検出パターン

以下のパターンを検出した場合、label_conflict_suspected = trueとする。

| パターン | 説明 | 検出ロジック |
|:---|:---|:---|
| 正誤と根拠条文の矛盾 | 問題文の正誤と根拠条文が矛盾する可能性 | 条文の要件と問題文の事実が対応しない |
| 農地法3条/4条/5条の取り違え | 届出と許可の取り違え | 市街化区域内外の判定ミス |
| 35条と37条の取り違え | タイミング・交付先の取り違え | 契約前/契約後の取り違え |
| 詐欺と強迫の取り違え | 第三者対抗の取り違え | 取消期間の取り違え |
| 借地借家法の取り違え | 普通借家・定期借家の取り違え | 更新の有無の取り違え |
| is_statement_true_snapshot | is_statement_trueがnull | 明示的に疑義あり |

### 7.2 疑義検出ロジック

```typescript
function detectLabelConflict(
  sq: SourceQuestion,
  sc: SourceChoice,
  explanation: QuestionExplanation | ChoiceExplanation
): boolean {
  // is_statement_trueがnullの場合
  if (sc.is_statement_true === null) {
    return true;
  }

  // 農地法の3条/4条/5条の取り違え
  if (sq.category?.includes('農地法')) {
    const hasCityPlanningKeyword = sq.question_text?.includes('市街化区域') ||
                                     sq.question_text?.includes('市街化調整区域');
    if (hasCityPlanningKeyword) {
      const mentionsNotification = explanation.application_to_question?.includes('届出');
      const mentionsPermission = explanation.application_to_question?.includes('許可');
      if (sc.is_statement_true && !(mentionsNotification || mentionsPermission)) {
        return true; // 市街化区域内で届出/許可の言及がない
      }
    }
  }

  // 35条と37条の取り違え
  if (sq.category?.includes('35条') || sq.category?.includes('37条')) {
    const has35 = explanation.application_to_question?.includes('35条');
    const has37 = explanation.application_to_question?.includes('37条');
    if (has35 && has37) {
      return true; // 35条と37条が混在
    }
  }

  return false;
}
```

### 7.3 疑義のある件の処理

**重要**: is_statement_trueは絶対に変更しない。

疑義がある場合は以下の処理を行う。

1. `label_conflict_suspected = true` とする
2. `human_review_required = true` とする
3. `review_status = 'label_conflict_suspected'` とする
4. `note` に疑義の内容を記録する

---

## 8. 実装上の注意

### 8.1 DBへの書き込み禁止

本設計の実装において、以下を禁止する。

- question_explanationsへの本投入
- choice_explanationsへの本投入
- source_choicesの変更
- is_statement_trueの変更
- study_eventsの変更

### 8.2 dry-runのみ

初回実装はdry-runのみとする。

- 出力形式: JSON
- 検証: ブラウザコンソール
- レビュー: 人的確認

### 8.3 段階的実装

1. **Phase 1**: 1件のみ生成して品質確認
2. **Phase 2**: 5件生成して品質確認
3. **Phase 3**: 10件生成して品質確認
4. **Phase 4**: 品質安定後、本投入検討

---

## 9. 品質メトリクス

### 9.1 初回目標

| メトリクス | 目標値 |
|:---|:---:|
| auto_ok率 | 0%（初回は人的レビュー優先） |
| human_review_required率 | 100% |
| generic_message_detected_count | 0 |
| source_refs_alignment_ok率 | 100% |
| problem_specificity_ok率 | 100% |

### 9.2 最終目標

| メトリクス | 目標値 |
|:---|:---:|
| auto_ok率 | 20〜30% |
| human_review_required率 | 70〜80% |
| generic_message_detected_count | 0 |
| source_refs_alignment_ok率 | 100% |
| problem_specificity_ok率 | 100% |

---

## 10. 参考資料

- v30スキーマ定義: src/db.ts
- 修正前監査レポート: docs/audit/V30_EXPLANATION_DRY_RUN_OUTPUT_QUALITY_AUDIT.md
- 修正後監査レポート: docs/audit/V30_DRY_RUN_FIX_VERIFICATION_AUDIT.md

---

**設計署名**: AI Engineer
**日付**: 2026-05-10
**バージョン**: 1.0.0
**ステータス**: A - v30 AI解説生成方針設計完了
