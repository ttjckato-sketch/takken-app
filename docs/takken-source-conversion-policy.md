# 宅建側source_questions/source_choices化の方針

## 現状分析

### データ構造
- **ULTIMATE_STUDY_DECK.json**: 3875カード
- **correct_patternsあり**: 1173カード
- **correct_patternsなし**: 2702カード（flashcardsのみ）
- **安全に〇×化可能**: 1168カード
- **選択肢数・組合せ系**: 5カード

### Flashcardsデータ構造
```json
{
  "card_id": "KC_...",
  "question_type": "correct|incorrect",
  "qa": {
    "q": "問題文",
    "a": "解答"
  }
}
```

## 分類方針

### A. 安全に〇×化できるカード（1168件）
**条件:**
- correct_patternsが存在
- 選択肢数・組合せ系ではない
- 問題文が10文字以上

**source_questions化:**
- id: 元カードID
- exam_type: "takken"
- year: correct_patterns[0].year
- question_no: correct_patterns[0].question_no
- question_text: correct_patterns[0].question_text
- correct_option: correct_patterns[0].correct_option
- question_type: 問題文から判定
- polarity: 問題文から判定
- source_card_id: 元カードID

**source_choices化:**
- correct_patterns[0]の情報から選択肢を復元
- is_statement_true: polarityとcorrect_optionから計算

### B. 選択肢数・組合せ系（5件）
**条件:**
- 問題文に「組合せ」「すべて」を含む

**処理:**
- source_choicesは作成するが、is_statement_trueはnull
- ActiveRecall対象外

### C. Flashcardsのみカード（2702件）
**課題:**
- 元問題の構造（選択肢数・正解肢番号）が不明
- question_type: correct/incorrectのみ

**方針:**
1. **暫定対応:** flashcardsから仮source_choicesを作成
   - 各flashcardを1つのsource_choiceとして扱う
   - is_statement_true: question_type === "correct" ? true : false
   - 元問題IDは付与できない（別途対応）

2. **本対応:** 元問題データ（LIMBデータ）から復元
   - LIMBデータにはparent_id、year、question_noが存在
   - parent_idから元問題を再構築可能

## 実装優先順

### Phase 1: Aグループ（1168件）のsource化
1. extractSourceQuestionsFromCorrectPatterns()実装
2. buildTakkenSourceData()実装
3. saveTakkenSourceData()実装

### Phase 2: Cグループ（2702件）の暫定対応
1. extractSourceChoicesFromFlashcards()実装
2. flashcard単位でsource_choiceを作成
3. is_statement_trueをquestion_typeから設定

### Phase 3: 元問題データ（LIMB）からの復元
1. LIMBデータのparent_id解析
2. 元問題構造の再構築
3. 正解肢番号の特定

## ActiveRecall対象判定

### 対象外
1. 選択肢数・組合せ系
2. 問題文が10文字未満
3. is_statement_trueがnull

### 対象
1. is_statement_trueがtrueまたはfalse
2. 問題文が10文字以上

## 品質基準

### 変換時のバリデーション
- 問題文が空でない
- 選択肢テキストが5文字以上
- is_statement_trueがnullでない（Aグループ）
- 正解肢番号が1-4の範囲内

### ログ出力
- 変換成功件数
- 変換失敗件数と理由
- 警告件数（短文、重複など）
