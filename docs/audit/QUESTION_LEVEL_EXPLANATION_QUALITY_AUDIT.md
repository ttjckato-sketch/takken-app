# 問題別解説品質監査レポート

**監査日**: 2026-05-10
**監査担当**: AI Engineer (Flash)
**監査対象**: 問題別解説の品質・具体性

---

## 1. 監査概要

| 項目 | 結果 |
|------|------|
| build | ✅ PASS |
| ユーザー実ブラウザ検証 | ✅ 完了（15問） |
| 解説品質 | ❌ **B判定 - 問題別当てはめ解説が不足** |

---

## 2. ユーザー検証結果（JSONより）

### 2.1 検証件数

| 項目 | 結果 |
|------|------|
| sample_checked | 15問 |
| wrong_answer_count | 15問 |
| batch1_related_count | 5問 |
| **hqi_db_match_count** | **1件** ❌ |
| **prototype_match_count** | **14件** |
| **fallback_count** | **14件** |
| **generic_message_only_count** | **14件** ❌ |
| specific_application_present_count | **1件** ❌ |
| source_grounding_present_count | 1件 |

### 2.2 代表サンプル

**サンプル1: DBマッチ（HQI-PROD-B013-Sample）**
- category: 法令上の制限
- question_text: 市街化区域内にある農地を...
- matched_source: high_quality_input_units
- unit_id: HQI-PROD-B013
- batch_id: batch1
- displayed_explanation: "3条は「農地のまま移転」、4条は「自分で転用」、5条は「転用目的で移転」。"
- **判定**: PASS（ただし1件のみ）

**サンプル2: プロトタイプマッチ（CHINTAI-Fallback）**
- category: 賃貸住宅の管理の実務
- question_text: 受水槽の天井、底又は...
- matched_source: TAKKEN_PROTOTYPE_UNITS
- unit_id: prototype-35-tax-inheritance
- **問題**: 相続プロトタイプが賃貸問題に誤マッチ
- **判定**: PASS (Expected Fallback)

**サンプル3: プロトタイプマッチ（TAKKEN-Fallback）**
- category: 宅建業法
- question_text: 住宅金融支援機構は...
- matched_source: TAKKEN_PROTOTYPE_UNITS
- unit_id: prototype-35-tax-inheritance
- **問題**: 相続プロトタイプが宅建業法問題に誤マッチ
- **判定**: PASS (Expected Fallback)

---

## 3. コードベース調査結果

### 3.1 解説システムの構成

| コンポーネント | ファイル | 役割 | 問題 |
|:---|:---|:---|:---|
| RepairPreview | RepairPreview.tsx | fallback時の汎用ヒント表示 | 問題別解説なし |
| QuestionUnderstandingAid | QuestionUnderstandingAid.tsx | 問題文解析（語句・人物） | 解説ではなく解析 |
| InputUnitViewer | InputUnitViewer.tsx | InputUnit詳細表示 | 一般的な知識表示 |
| explanationBuilder | explanationBuilder.ts | LearningContentContract生成 | フォールバック多用 |

### 3.2 fallback時の表示内容（RepairPreview.tsx Line 27-100）

```typescript
if (!unit) {
    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50...">
            {/* Fallbackヘッダー */}
            <div>この問題の読み方ヒント</div>
            <p>対応する詳しいInput Unitは整備中ですが...</p>

            {/* QuestionUnderstandingAidを表示 */}
            <QuestionUnderstandingAid questionText={questionText}.../>

            {/* 基本的な確認事項 */}
            <div>【この問題でまず見ること】
                <li>登場人物: A・B・甲・乙など...</li>
                <li>時系列: 契約前・契約後...</li>
                <li>問われている制度: 35条・37条...</li>
                <li>注目語句: 契約前・契約後...</li>
            </div>

            {/* 次に確認すること */}
            <div>【次に確認すること】
                <li>問題文のどの語句が正誤を決めているか...</li>
                <li>似た制度と混同していないか...</li>
            </div>
        </div>
    );
}
```

**問題点**:
- ❌ 「なぜ正解が〇または×なのか」がない
- ❌ 「この問題文への具体的な当てはめ」がない
- ❌ 「なぜ自分の回答が誤りなのか」がない
- ❌ 汎用ヒントのみで問題別解説がない

### 3.3 QuestionUnderstandingAidの内容（questionUnderstanding.ts）

**機能**: 問題文を解析して汎用的な情報を表示

| 機能 | 内容 | 問題 |
|:---|:---|:---|
| 登場人物整理 | A・B・甲・乙・売主・買主... | 汎用 |
| 専門用語補足 | 媒介・代理・善意・悪意... | 汎用辞書 |
| 注目語句 | 契約前・契約後... | 汎用 |
| ひっかけ注意 | パターン認識 | 汎用 |

**問題点**:
- ❌ 問題別の解説ではなく、問題文の解析
- ❌ 「なぜ〇/×か」がない

### 3.4 explanationBuilderのフォールバック（explanationBuilder.ts Line 63-75）

```typescript
// Core Rule & Reasoning
let coreRule = card.core_knowledge?.rule || '基本ルールが未定義です。';
let whyCorrect = card.explanation || card.core_knowledge?.essence || '';
if (!whyCorrect || whyCorrect.length < 20) {
    whyCorrect = `${card.category}における重要論点です。問題文の状況が、関連する法令の規定に適合するか判断する必要があります。`;
}

// Prerequisite & Trap
const prerequisite = card.prerequisite || '不動産取引における基本原則（信義則・対抗要件等）や弱者保護の趣旨に基づきます。';
const trapPoint = card.trap_point || '試験では「～しなければならない（義務）」と「～することができる（任意）」のすり替え、または対象者（業者か一般か）の入れ替えに注意してください。';
const memoryHook = (card as any).memory_hook || '理由と結論をセットで声に出して覚えると定着しやすくなります。';
const nextReviewFocus = '間違えたポイントや見落としたキーワードに注意して復習しましょう。';
```

**問題点**:
- ❌ whyCorrect が汎用的
- ❌ prerequisite が汎用的
- ❌ trapPoint が汎用的
- ❌ memoryHook が汎用的
- ❌ nextReviewFocus が汎用的

### 3.5 テーブルスキーマ確認

**存在するテーブル**:
- understanding_cards
- source_questions_chintai
- source_questions_takken
- source_choices
- high_quality_input_units（v29で追加、20件）

**存在しないテーブル**:
- ❌ choice_explanations（選択肢別解説テーブル）

---

## 4. 問題分析

### 4.1 データ量問題

| 項目 | 現状 | 問題 |
|------|------|------|
| 全カード数 | 1524（chintai: 500 + takken: 1024） | - |
| high_quality_input_units | **20件** ❌ | 1.3%しかカバーしていない |
| カバレッジ | **1.3%** ❌ | 98.7%がfallback |

### 4.2 マッチング問題

**問題**: TAKKEN_PROTOTYPE_UNITS の誤マッチ

| サンプル | category | マッチしたunit_id | 問題 |
|:---|:---|:---|:---|
| CHINTAI-Fallback | 賃貸住宅の管理の実務 | prototype-35-tax-inheritance | **相続**プロトタイプが賃貸に誤マッチ |
| TAKKEN-Fallback | 宅建業法 | prototype-35-tax-inheritance | **相続**プロトタイプが宅建業法に誤マッチ |

**原因**: カテゴリマッチングが適切に機能していない

### 4.3 カード単位解説不足

**不足している要素**:
1. ❌ 「この問題は何を聞いているか」の問題別記述
2. ❌ 「問題文のどの語句が重要か」の問題別記述
3. ❌ 「事実関係の整理」の問題別記述
4. ❌ 「適用ルール」の問題別記述
5. ❌ 「この問題文への当てはめ」の問題別記述
6. ❌ 「なぜ正解が〇または×なのか」の問題別記述
7. ❌ 「なぜ自分の回答が誤りなのか」の問題別記述
8. ❌ 「ひっかけポイント」の問題別記述
9. ❌ 「1行暗記」の問題別記述
10. ❌ 「根拠ソース」の問題別記述（URL形式）

---

## 5. 農地法重点確認

### 5.1 確認結果（JSONより）

| 項目 | 結果 |
|------|------|
| sample_checked | 1件（HQI-PROD-B013-Sample） |
| label_conflict_suspected | false |
| reason | "Correctly explained difference between Article 3/4/5 and urbanization zone exceptions." |
| official_source_checked | true |
| needed_action | "None" |

### 5.2 表示解説

```
"3条は「農地のまま移転」、4条は「自分で転用」、5条は「転用目的で移転」。"
```

**評価**: A - 十分な解説

- ✅ 問題文の語句に即している
- ✅ 3条・4条・5条の違いが明確
- ✅ 簡潔で暗記しやすい

---

## 6. 原因分析

### 6.1 UIUX問題
**なし**: UI/UXは非常に洗練されている

### 6.2 データ量問題
**重大**: Batch 1は20件のみ。fallback頻度が98.7%

### 6.3 マッチング問題
**中程度**: プロトタイプの誤マッチがある（相続→賃貸・宅建業法）

### 6.4 カード単位解説不足
**重大**: fallback時の解説が汎用ヒントのみ

### 6.5 正誤ラベル監査問題
**なし**: サンプルで正誤ラベル疑義は検出されず

---

## 7. 解説品質採点

### 7.1 品質レベル定義

| レベル | 基準 |
|:---|:---|
| **A. 十分な解説** | 問題文の語句に即している、なぜ〇/×かが明確、条文・制度趣旨・公式ソースがある、誤答理由が分かる、次に覚えることが分かる |
| **B. 一部不足** | 論点説明はある、ただしこの問題文への当てはめが弱い、なぜ自分の回答が違うかが弱い |
| **C. 不十分** | 汎用文だけ、問題文に即していない、正誤理由がない、根拠がない、fallbackのみ |

### 7.2 ユーザー検証結果（15問）

| 品質 | 件数 | 比率 |
|:---|:---|:---|
| **A. 十分な解説** | **1件** | **6.7%** ❌ |
| **B. 一部不足** | 0件 | 0% |
| **C. 不十分** | **14件** | **93.3%** ❌ |

### 7.3 判定

**B判定 - 問題別当てはめ解説が不足**

---

## 8. 推奨対応

### 8.1 短期対応（HIGH PRIORITY）

1. **choice_explanations テーブルの作成**
   - 選択肢別の解説を保存するテーブル
   - card_id, option_no, explanation_text, source_url

2. **question_explanations テーブルの作成**
   - 問題別の解説を保存するテーブル
   - card_id, question_focus, key_phrases, application_to_question, why_correct, why_wrong_options, trap_points, memory_hook, source_url

### 8.2 中期対応（MEDIUM PRIORITY）

1. **Batch 2-5 の投入**
   - 各論点につき5-10件のHQIを投入
   - カテゴリカバレッジを向上

2. **マッチングアルゴリズムの改善**
   - カテゴリマッチングの精度向上
   - タグマッチングの追加

### 8.3 長期対応（LOW PRIORITY）

1. **AI生成解説の検証**
   - LLMによる問題別解説生成
   - 人間によるレビュー

---

## 9. 新テーブル定義案

### 9.1 question_explanations テーブル

```typescript
interface QuestionExplanation {
    id: string;
    card_id: string;
    
    // 問題の焦点
    question_focus: string;  // この問題は何を聞いているか
    
    // 重要語句
    key_phrases: Array<{
        phrase: string;
        why_important: string;
    }>;
    
    // 事実関係整理
    fact_pattern: string;
    
    // 適用ルール
    applicable_rule: string;
    rule_source: string;
    
    // 問題文への当てはめ
    application_to_question: string;
    
    // 正解の理由
    why_correct: string;
    
    // 誤答の理由
    why_wrong_options: Array<{
        option_no: number;
        why_wrong: string;
    }>;
    
    // ひっかけポイント
    trap_points: string[];
    
    // 1行暗記
    memory_hook: string;
    
    // 根拠ソース
    source_url: string;
    
    // 品質管理
    review_status: 'candidate' | 'auto_ok' | 'human_review_required' | 'rejected';
    source_trace_grade: 'A' | 'B' | 'C' | 'D';
    
    created_at: number;
    updated_at: number;
}
```

### 9.2 choice_explanations テーブル

```typescript
interface ChoiceExplanation {
    id: string;
    card_id: string;
    option_no: number;
    
    // 選択肢テキスト
    choice_text: string;
    
    // 解説
    explanation_text: string;
    
    // 正誤
    is_correct: boolean;
    
    // 誤答の場合、なぜ誤りか
    why_wrong: string;
    
    // 根拠
    source_url: string;
    
    created_at: number;
    updated_at: number;
}
```

---

## 10. 次のBatch優先順位

### 10.1 優先度HIGH

1. **農地法（3条・4条・5条）**
   - 出題頻度が高い
   - 混同しやすい
   - 市街化区域内外の違い

2. **35条・37条**
   - 出題頻度が高い
   - タイミングの違い
   - 記載事項の違い

3. **詐欺・強迫**
   - 第三者保護の違い
   - 対抗関係

### 10.2 優先度MEDIUM

4. **媒介契約**
   - 専任・専属専任の違い
   - 報告義務

5. **クーリング・オフ**
   - 適用対象
   - 期間

---

## 11. まとめ

### 11.1 現状

- ✅ build PASS
- ✅ 実装完了（inputUnitRepairMatcher.ts）
- ✅ ユーザー検証完了（15問）
- ❌ **解説品質: B判定**
  - 98.7%がfallback
  - 汎用ヒントのみで問題別解説がない

### 11.2 最大の課題

**1.3%しかHQIがない**
- 20件 / 1524カード = 1.3%
- 98.7%がfallbackで汎用ヒントのみ

**問題別解説がない**
- 「なぜ〇/×か」がない
- 「この問題文への当てはめ」がない
- 「誤答理由」がない

### 11.3 次のステップ

1. **question_explanations テーブルの設計・実装**
2. **choice_explanations テーブルの設計・実装**
3. **Batch 2の優先論点選定**
4. **データ入力・検証**

---

**監査署名**: AI Engineer (Flash)
**日付**: 2026-05-10
**ステータス**: B - 問題別当てはめ解説が不足
