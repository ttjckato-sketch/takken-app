# v30 初回解説データ Dry-run 設計

**設計日**: 2026-05-10
**設計担当**: AI Engineer
**対象**: v30 question_explanations / choice_explanations 初回データ生成
**実行タイプ**: dry-run (本投入なし)

---

## 1. 設計目的

v30スキーマ実装完了後、初回の問題別・選択肢別解説データを生成するためのdry-run設計。

- **目標**: question_explanations 10〜20件、choice_explanations 30〜50件
- **方法**: source_questions / source_choices から対象を抽出し、解説データを生成
- **投入**: DBへ書き込まず、JSONファイルとして出力
- **検証**: 品質判定、重複チェック、正誤疑義検出

---

## 2. 初回対象カテゴリ

### 2.1 優先対象

| 優先 | カテゴリ | 件数 | 理由 |
|:---:|:---|:---:|:---|
| 1 | 農地法 3条・4条・5条 | 10 | 誤答が多い、用語が似ている、条文の当てはめが重要 |
| 2 | 35条書面 / 37条書面 | 10 | 出題頻度が高い、タイミングの違い、記載事項の違い |
| 3 | 媒介契約 | 5 | 専任・専属専任の違い、報告義務 |
| 4 | クーリング・オフ | 5 | 適用対象、期間 |
| 5 | 詐欺・強迫 | 5 | 第三者保護の違い、対抗関係 |
| 6 | 借地借家法 | 5 | 更新、対抗要件 |
| 7 | 賃貸住宅管理業法 | 5 | 管理義務、重要事項説明 |

**合計**: question_explanations 15件、choice_explanations 45件（目標）

### 2.2 chintai / takken バランス

- **takken**: 宅建士試験メイン（70%）
- **chintai**: 賃貸管理士試験（30%）

---

## 3. 抽出条件

### 3.1 source_questions 抽出

```javascript
// 農地法
const agriculturalQuestions = await db.source_questions
  .where('category')
  .startsWithIgnoreCase('農地法')
  .or('category').startsWithIgnoreCase('農地')
  .toArray();

// 35条/37条
const article35Questions = await db.source_questions
  .where('category')
  .startsWithIgnoreCase('35条')
  .or('question_text').contains('35条書面')
  .toArray();

// 媒介契約
const brokerageQuestions = await db.source_questions
  .where('category')
  .contains('媒介')
  .toArray();

// クーリング・オフ
const coolingOffQuestions = await db.source_questions
  .where('category')
  .contains('クーリング')
  .or('category').contains('クーリングオフ')
  .toArray();
```

### 3.2 source_choices 抽出

```javascript
// 対象question_idの選択肢を取得
const targetQuestionIds = targetQuestions.map(q => q.id);
const targetChoices = await db.source_choices
  .where('question_id')
  .anyOf(targetQuestionIds)
  .toArray();
```

### 3.3 既存HQIとの関連付け

```javascript
// high_quality_input_units にある場合は関連付け
const relatedHQI = await db.high_quality_input_units
  .where('category')
  .anyOf(categories)
  .toArray();

questionExplanation.related_input_unit_id = relatedHQI[0]?.id || null;
questionExplanation.related_input_unit_batch = relatedHQI[0]?.batch_id || null;
```

---

## 4. ID設計

### 4.1 question_explanations

**format**: `QE-{card_id}`

例:
- `QE-CH-001` (chintai card)
- `QE-TAKKEN-SQ-001` (takken source question)

**重複防止**:
```javascript
const existingQE = await db.question_explanations
  .where('id')
  .equals(`QE-${card_id}`)
  .first();

if (existingQE) {
  // 重複エラー
  throw new Error(`Duplicate question_explanation id: QE-${card_id}`);
}
```

### 4.2 choice_explanations

**format**: `CE-{source_choice_id}`

例:
- `CE-TAKKEN-SC-001`
- `CE-CH-SC-001`

**重複防止**:
```javascript
const existingCE = await db.choice_explanations
  .where('id')
  .equals(`CE-${source_choice_id}`)
  .first();

if (existingCE) {
  // 重複エラー
  throw new Error(`Duplicate choice_explanation id: CE-${source_choice_id}`);
}
```

---

## 5. Dry-run 生成方針

### 5.1 生成フロー

```
1. source_questions / source_choices 抽出
2. 各カードの解説データ生成
3. 品質判定 (A/B/C)
4. 正誤疑義検出
5. 必須フィールド検証
6. source_refs 検証
7. JSON出力 (DBへ書き込まない)
```

### 5.2 question_explanations 生成項目

| フィールド | 生成方針 | 必須 |
|:---|:---|:---:|
| id | QE-{card_id} | ✅ |
| question_id | source_questions.id | ✅ |
| source_question_id | source_questions.id | ✅ |
| card_id | understanding_cards.card_id | ✅ |
| batch_id | "v30-dry-run-batch1" | ✅ |
| category | source_questions.category | ✅ |
| question_focus | AI生成 | ✅ |
| key_phrases | AI生成 | ✅ |
| facts_summary | AI生成 | ✅ |
| issue_structure | AI生成 | |
| applicable_rule | AI生成 | ✅ |
| rule_source | AI生成 | ✅ |
| article_or_section | AI生成 | ✅ |
| application_to_question | AI生成 | ✅ |
| correct_conclusion | AI生成 | ✅ |
| why_this_answer | AI生成 | ✅ |
| common_misread | AI生成 | |
| trap_points | AI生成 | |
| memory_hook | AI生成 | |
| related_input_unit_id | HQI検索 | |
| source_refs | AI生成 | ✅ |
| source_trace_grade | 品質判定 | ✅ |
| confidence | 品質判定 | ✅ |
| review_status | 品質判定 | ✅ |
| label_conflict_suspected | 正誤疑義検出 | ✅ |
| human_review_required | 品質判定 | ✅ |
| disabled | false | ✅ |
| created_at | Date.now() | ✅ |
| updated_at | Date.now() | ✅ |

### 5.3 choice_explanations 生成項目

| フィールド | 生成方針 | 必須 |
|:---|:---|:---:|
| id | CE-{source_choice_id} | ✅ |
| choice_id | source_choices.id | ✅ |
| source_choice_id | source_choices.id | ✅ |
| question_id | source_choices.question_id | ✅ |
| source_question_id | source_questions.id | ✅ |
| card_id | understanding_cards.card_id | ✅ |
| batch_id | "v30-dry-run-batch1" | ✅ |
| category | source_questions.category | ✅ |
| statement_text | source_choices.text | ✅ |
| is_statement_true_snapshot | source_choices.is_statement_true | ✅ |
| correct_answer_reason | AI生成 | ✅ |
| why_true | AI生成 | |
| why_false | AI生成 | |
| why_user_wrong | AI生成 | |
| application_to_statement | AI生成 | ✅ |
| key_phrases | AI生成 | |
| rule | AI生成 | ✅ |
| exception | AI生成 | |
| trap | AI生成 | |
| one_line_memory | AI生成 | |
| source_refs | AI生成 | ✅ |
| source_trace_grade | 品質判定 | ✅ |
| confidence | 品質判定 | ✅ |
| review_status | 品質判定 | ✅ |
| label_conflict_suspected | 正誤疑義検出 | ✅ |
| human_review_required | 品質判定 | ✅ |
| disabled | false | ✅ |
| created_at | Date.now() | ✅ |
| updated_at | Date.now() | ✅ |

---

## 6. 品質判定基準

### 6.1 Quality A (auto_ok可能)

```javascript
function isQualityA(item) {
  return (
    item.source_trace_grade === 'A' &&
    item.confidence === 'high' &&
    item.source_refs && item.source_refs.length >= 1 &&
    item.source_refs.some(ref => ['e_gov', 'mlit', 'moj', 'maff'].includes(ref.source_type)) &&
    (item.application_to_question || item.application_to_statement) && (item.application_to_question?.length > 30 || item.application_to_statement?.length > 30) &&
    (item.why_this_answer || item.correct_answer_reason) && (item.why_this_answer?.length > 30 || item.correct_answer_reason?.length > 30) &&
    !item.label_conflict_suspected &&
    !item.human_review_required
  );
}
```

**条件**:
- source_trace_grade = A
- confidence = high
- source_refs >= 1件 (e_gov, mlit, moj, maff のいずれか)
- application_to_question / application_to_statement > 30文字
- why_this_answer / correct_answer_reason > 30文字
- label_conflict_suspected = false
- human_review_required = false

**review_status**: auto_ok

### 6.2 Quality B (draft or human_review_required)

```javascript
function isQualityB(item) {
  return (
    item.source_trace_grade === 'B' ||
    item.confidence === 'medium' ||
    (item.source_refs && item.source_refs.length >= 1 && item.source_refs[0].source_type === 'retio') ||
    ((item.application_to_question?.length > 20 || item.application_to_statement?.length > 20) &&
     (item.why_this_answer?.length > 20 || item.correct_answer_reason?.length > 20))
  );
}
```

**条件** (いずれか):
- source_trace_grade = B
- confidence = medium
- source_refsがあるがRETIOのみ
- application/whyが20〜30文字

**review_status**: draft or human_review_required

### 6.3 Quality C (human_review_required)

```javascript
function isQualityC(item) {
  return (
    item.source_trace_grade === 'C' || item.source_trace_grade === 'D' ||
    item.confidence === 'low' ||
    !item.source_refs || item.source_refs.length === 0 ||
    item.label_conflict_suspected ||
    item.human_review_required
  );
}
```

**条件** (いずれか):
- source_trace_grade = C or D
- confidence = low
- source_refsがない
- label_conflict_suspected = true
- human_review_required = true

**review_status**: human_review_required

---

## 7. 正誤疑義検出

### 7.1 is_statement_true_snapshotの扱い

```javascript
// is_statement_true_snapshot は記録のみ、変更しない
choiceExplanation.is_statement_true_snapshot = sourceChoice.is_statement_true;

// 疑義検出
if (sourceChoice.is_statement_true === null) {
  choiceExplanation.label_conflict_suspected = true;
  choiceExplanation.label_conflict_reason = 'is_statement_true is null';
  choiceExplanation.human_review_required = true;
}
```

### 7.2 禁止事項

- ❌ is_statement_true をAI推測で変更
- ❌ source_choices.is_statement_true を書き換え
- ❌ label_conflict_suspected を無視して投入

### 7.3 疑義がある場合の対応

```javascript
if (label_conflict_suspected) {
  review_status = 'human_review_required';
  human_review_required = true;
  // auto_ok禁止
}
```

---

## 8. 根拠ソース方針

### 8.1 優先ソース

| 優先 | source_type | URL | 説明 |
|:---:|:---|:---|:---|
| 1 | e_gov | https://elaws.e-gov.go.jp | 法令データ |
| 2 | mlit | https://www.mlit.go.jp | 国土交通省 |
| 3 | moj | https://www.moj.go.jp | 法務省 |
| 4 | maff | https://www.maff.go.jp | 農林水産省 |
| 5 | official_exam | 公式過去問 | 過去問 |
| 6 | retio | https://www.retio.jp | 主要予備校 |

### 8.2 source_refs 構造

```javascript
{
  source_type: 'e_gov' | 'mlit' | 'moj' | 'maff' | 'retio' | 'official_exam' | 'other',
  title: string,
  url?: string,
  law_name?: string,
  article?: string,
  checked_at?: number,
  note?: string
}
```

### 8.3 禁止

- ❌ 民間サイトだけで auto_ok
- ❌ AI推測だけで正誤確定
- ❌ 古い過去問解説だけで現行法判断

---

## 9. Dry-run 出力

### 9.1 出力ファイル

```
docs/generated/v30_dry_run_question_explanations.json
docs/generated/v30_dry_run_choice_explanations.json
docs/generated/v30_dry_run_summary.json
```

### 9.2 summary.json 構造

```json
{
  "dry_run_meta": {
    "dry_run_date": "2026-05-10",
    "dry_run_type": "V30_INITIAL_EXPLANATION_DRY_RUN",
    "db_write": false,
    "output_format": "JSON"
  },
  "generation_stats": {
    "generated_question_explanations_count": 15,
    "generated_choice_explanations_count": 45,
    "target_categories": ["農地法", "35条書面", "媒介契約", "クーリング・オフ"],
    "takken_count": 10,
    "chintai_count": 5
  },
  "quality_stats": {
    "quality_A_count": 5,
    "quality_B_count": 8,
    "quality_C_count": 2,
    "human_review_required_count": 10,
    "label_conflict_suspected_count": 2,
    "source_trace_grade_A_count": 5,
    "source_trace_grade_B_count": 8,
    "source_trace_grade_C_count": 2
  },
  "validation_stats": {
    "duplicate_id_count": 0,
    "missing_required_field_count": 0,
    "source_refs_missing_count": 2,
    "ready_for_formal_import_count": 5
  }
}
```

---

## 10. サンプル設計

### 10.1 農地法 3条 (Sample 1)

**question_text**:
「農地法3条の許可が必要な場合はどれか。」

**question_explanation**:
```json
{
  "id": "QE-TAKKEN-SQ-001",
  "question_id": "TAKKEN-SQ-001",
  "source_question_id": "TAKKEN-SQ-001",
  "card_id": "TAKKEN-SQ-001",
  "batch_id": "v30-dry-run-batch1",
  "category": "農地法 3条",
  "question_focus": "農地法3条の許可制度の適用対象",
  "key_phrases": [
    { "phrase": "所有権移転", "why_important": "3条の核心", "location_in_question": "選択肢" },
    { "phrase": "許可", "why_important": "3条の要件", "location_in_question": "問題文" }
  ],
  "facts_summary": "農地を農地以外にする場合、または農地以外の土地を農地にする場合",
  "issue_structure": "土地の権利移動 × 農地法3条許可",
  "applicable_rule": "農地法3条1項",
  "rule_source": "農地法",
  "article_or_section": "3条1項",
  "application_to_question": "この問題では、所有権移転の場合に3条許可が必要かを問うています。農地法3条1項により、農地について所有権を移転する場合は許可が必要です。",
  "correct_conclusion": "所有権移転の場合は3条許可が必要",
  "why_this_answer": "3条許可は権利移動全般に必要。所有権移転は典型的な権利移動。",
  "common_misread": "質権や賃借権の場合も混同",
  "trap_points": [
    { "trap": "質権設定は3条不要", "why_trap": "質権は担保権、使用権ではない", "how_to_avoid": "権利の種類を確認" }
  ],
  "memory_hook": "3条＝所有権等の移転、4条＝賃借権等の設定",
  "source_refs": [
    {
      "source_type": "e_gov",
      "title": "農地法",
      "url": "https://elaws.e-gov.go.jp/document?lawid=327AC0000000222",
      "law_name": "農地法",
      "article": "3条1項",
      "checked_at": 1715308800000
    }
  ],
  "source_trace_grade": "A",
  "confidence": "high",
  "review_status": "auto_ok",
  "label_conflict_suspected": false,
  "human_review_required": false,
  "disabled": false,
  "created_at": 1715308800000,
  "updated_at": 1715308800000
}
```

**choice_explanation** (選択肢1: 所有権移転):
```json
{
  "id": "CE-TAKKEN-SC-001",
  "choice_id": "TAKKEN-SC-001",
  "source_choice_id": "TAKKEN-SC-001",
  "question_id": "TAKKEN-SQ-001",
  "source_question_id": "TAKKEN-SQ-001",
  "card_id": "TAKKEN-SQ-001",
  "batch_id": "v30-dry-run-batch1",
  "category": "農地法 3条",
  "statement_text": "所有権の移転",
  "is_statement_true_snapshot": true,
  "correct_answer_reason": "3条1項により、農地について所有権を移転する場合は農業委員会の許可が必要。",
  "why_true": "所有権移転は3条の典型的な適用対象。",
  "application_to_statement": "この選択肢では所有権移転を示している。3条1項の「所有権」に該当する。",
  "rule": "農地法3条1項",
  "one_line_memory": "所有権＝3条",
  "source_refs": [
    {
      "source_type": "e_gov",
      "title": "農地法3条1項",
      "url": "https://elaws.e-gov.go.jp/document?lawid=327AC0000000222",
      "article": "3条1項"
    }
  ],
  "source_trace_grade": "A",
  "confidence": "high",
  "review_status": "auto_ok",
  "label_conflict_suspected": false,
  "human_review_required": false,
  "disabled": false,
  "created_at": 1715308800000,
  "updated_at": 1715308800000
}
```

### 10.2 35条書面 (Sample 2)

**question_text**:
「35条書面の記載事項として必要なものはどれか。」

**question_explanation**:
```json
{
  "id": "QE-TAKKEN-SQ-002",
  "question_id": "TAKKEN-SQ-002",
  "source_question_id": "TAKKEN-SQ-002",
  "card_id": "TAKKEN-SQ-002",
  "batch_id": "v30-dry-run-batch1",
  "category": "35条書面",
  "question_focus": "35条書面の記載事項",
  "key_phrases": [
    { "phrase": "35条書面", "why_important": "重要説明事項", "location_in_question": "問題文" },
    { "phrase": "記載事項", "why_important": "何を書くか", "location_in_question": "問題文" }
  ],
  "facts_summary": "宅建業法35条に基づく重要事項説明書",
  "issue_structure": "取引当事者 × 35条記載事項",
  "applicable_rule": "宅建業法35条1項",
  "rule_source": "宅建業法",
  "article_or_section": "35条1項",
  "application_to_question": "この問題では35条書面の記載事項を問うています。宅建業法35条1項各号に列挙された事項が記載事項です。",
  "correct_conclusion": "35条1項各号に列挙された事項が必要",
  "why_this_answer": "35条書面は法令で記載事項が法定されている。",
  "trap_points": [
    { "trap": "37条書面と混同", "why_trap": "両方とも書面だが内容が違う", "how_to_avoid": "35条＝取引前、37条＝契約時" }
  ],
  "source_refs": [
    {
      "source_type": "e_gov",
      "title": "宅建業法",
      "url": "https://elaws.e-gov.go.jp/document?lawid=327AC0000000522",
      "law_name": "宅地建物取引業法",
      "article": "35条1項"
    }
  ],
  "source_trace_grade": "A",
  "confidence": "high",
  "review_status": "auto_ok",
  "label_conflict_suspected": false,
  "human_review_required": false,
  "disabled": false,
  "created_at": 1715308800000,
  "updated_at": 1715308800000
}
```

### 10.3 媒介契約 (Sample 3)

**question_text**:
「専任媒介契約の報告義務について正しいものはどれか。」

**question_explanation**:
```json
{
  "id": "QE-TAKKEN-SQ-003",
  "question_id": "TAKKEN-SQ-003",
  "batch_id": "v30-dry-run-batch1",
  "category": "媒介契約",
  "question_focus": "専任媒介契約の報告義務",
  "key_phrases": [
    { "phrase": "専任媒介契約", "why_important": "媒介契約の種類", "location_in_question": "問題文" },
    { "phrase": "報告義務", "why_important": "業者の義務", "location_in_question": "問題文" }
  ],
  "facts_summary": "専任媒介契約は依頼者に対して2週間に1回以上の報告義務",
  "applicable_rule": "宅建業法34条の2",
  "application_to_question": "専任媒介契約では業者は2週間に1回以上業務の処理状況を報告する必要がある。",
  "correct_conclusion": "2週間に1回以上の報告義務",
  "why_this_answer": "専任媒介契約は他者排斥の対価として頻繁な報告が義務付けられている。",
  "source_refs": [
    { "source_type": "e_gov", "title": "宅建業法34条の2", "article": "34条の2" }
  ],
  "source_trace_grade": "B",
  "confidence": "medium",
  "review_status": "draft",
  "label_conflict_suspected": false,
  "human_review_required": false,
  "disabled": false,
  "created_at": 1715308800000,
  "updated_at": 1715308800000
}
```

### 10.4 クーリング・オフ (Sample 4)

**question_text**:
「クーリング・オフの期間について正しいものはどれか。」

**question_explanation**:
```json
{
  "id": "QE-TAKKEN-SQ-004",
  "question_id": "TAKKEN-SQ-004",
  "batch_id": "v30-dry-run-batch1",
  "category": "クーリング・オフ",
  "question_focus": "クーリング・オフの期間",
  "key_phrases": [
    { "phrase": "クーリング・オフ", "why_important": "取消権", "location_in_question": "問題文" },
    { "phrase": "期間", "why_important": "8日ルール", "location_in_question": "問題文" }
  ],
  "facts_summary": "クーリング・オフは書面を受領した日から8日間",
  "applicable_rule": "特定商取引法9条",
  "application_to_question": "クーリング・オフの期間は書面を受領した日から8日間。",
  "correct_conclusion": "8日間",
  "why_this_answer": "法定期間は8日間。業者が申込みをした日からではない。",
  "trap_points": [
    { "trap": "申込み日から起算", "why_trap": "書面受領日から起算", "how_to_avoid": "書面受領日を確認" }
  ],
  "source_refs": [
    { "source_type": "e_gov", "title": "特定商取引法", "article": "9条1項" }
  ],
  "source_trace_grade": "A",
  "confidence": "high",
  "review_status": "auto_ok",
  "label_conflict_suspected": false,
  "human_review_required": false,
  "disabled": false,
  "created_at": 1715308800000,
  "updated_at": 1715308800000
}
```

### 10.5 賃貸住宅管理業法 (Sample 5)

**question_text**:
「賃貸住宅管理業者の管理業務について正しいものはどれか。」

**question_explanation**:
```json
{
  "id": "QE-CH-001",
  "question_id": "CH-001",
  "batch_id": "v30-dry-run-batch1",
  "category": "賃貸住宅管理業法",
  "question_focus": "賃貸住宅管理業者の管理業務",
  "key_phrases": [
    { "phrase": "賃貸住宅管理業者", "why_important": "業法の対象", "location_in_question": "問題文" },
    { "phrase": "管理業務", "why_important": "何を管理するか", "location_in_question": "問題文" }
  ],
  "facts_summary": "賃貸住宅管理業者は賃貸住宅の管理業務を行う",
  "applicable_rule": "賃貸住宅管理業法",
  "application_to_question": "賃貸住宅管理業者は賃貸住宅の維持保全、入居者募集等の管理業務を行う。",
  "correct_conclusion": "賃貸住宅の管理業務",
  "why_this_answer": "賃貸住宅管理業法は賃貸住宅の管理業務を規制している。",
  "source_refs": [
    { "source_type": "e_gov", "title": "賃貸住宅管理業法" }
  ],
  "source_trace_grade": "B",
  "confidence": "medium",
  "review_status": "draft",
  "label_conflict_suspected": false,
  "human_review_required": false,
  "disabled": false,
  "created_at": 1715308800000,
  "updated_at": 1715308800000
}
```

---

## 11. 本投入時の注意事項

### 11.1 DB操作

- **使用**: add() / bulkAdd() のみ
- **禁止**: put() / bulkPut() (上書きリスク)

```javascript
// 本投入時
await db.question_explanations.bulkAdd(generatedQuestionExplanations);
await db.choice_explanations.bulkAdd(generatedChoiceExplanations);
```

### 11.2 重複チェック

```javascript
// 投入前に重複確認
const existingIds = await db.question_explanations.toCollection().keys();
const duplicates = generatedQuestionExplanations.filter(qe => existingIds.has(qe.id));
if (duplicates.length > 0) {
  throw new Error(`Duplicate IDs found: ${duplicates.map(d => d.id).join(', ')}`);
}
```

---

## 12. 次のステップ

1. dry-runスクリプト実装 (別タスク)
2. 生成結果のレビュー
3. 品質調整
4. 本投入スクリプト実装 (別タスク)

---

**設計署名**: AI Engineer
**日付**: 2026-05-10
**ステータス**: A - v30初回解説データdry-run設計完了
