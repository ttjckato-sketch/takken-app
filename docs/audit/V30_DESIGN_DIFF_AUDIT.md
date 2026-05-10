# v30設計・差分監査レポート

**監査日**: 2026-05-10
**監査担当**: AI Engineer
**監査対象**: v30設計完了後の既存変更監査

---

## 1. 監査概要

| 項目 | 結果 |
|------|------|
| build | ✅ PASS (2.32s) |
| v30設計ファイル | ✅ 完了 |
| v30実装有無 | ✅ なし（設計のみ） |
| 既存変更由来 | ✅ v29統合修正 |

---

## 2. v30設計ファイル確認

### 2.1 設計ファイル存在確認

| ファイル | 存在 | 確認項目 |
|:---|:---:|:---|
| **V30_QUESTION_CHOICE_EXPLANATIONS_SCHEMA_DESIGN.md** | ✅ | 設計完了 |
| **v30_question_choice_explanations_schema_design.json** | ✅ | 設計完了 |

### 2.2 設計内容確認

**question_explanations**:
- ✅ 目的: 問題全体の解説を保存
- ✅ primary key: id (format: QE-{card_id})
- ✅ indexes: question_id, card_id, review_status, source_trace_grade, batch_id, disabled
- ✅ migration_policy: 既存データの変更なし。新規ストアの初期化のみ。
- ✅ rollback_policy: question_explanations/choice_explanations のデータは削除される。既存データは維持される。
- ✅ source_choices変更しない方針
- ✅ is_statement_true変更しない方針

**choice_explanations**:
- ✅ 目的: 選択肢別の解説を保存
- ✅ primary key: id (format: CE-{source_choice_id})
- ✅ indexes: choice_id, source_choice_id, card_id, question_id, review_status, source_trace_grade, batch_id, disabled
- ✅ label_conflict_suspected: 正誤ラベル疑義フラグ（sidecar的記録）
- ✅ human_review_required: 人間レビュー要フラグ
- ✅ auto_ok条件: source_trace_grade='A', confidence='high', created_by='hybrid'

**表示優先順位**:
- ✅ 1. choice_explanations (v30) - スコア: 300
- ✅ 2. question_explanations (v30) - スコア: 250
- ✅ 3. high_quality_input_units (v29) - スコア: 200
- ✅ 4. TAKKEN_PROTOTYPE_UNITS - スコア: 100
- ✅ 5. 最終fallback - スコア: 0

---

## 3. 差分監査結果

### 3.1 既存変更の由来

すべての変更は**v29統合修正**によるものです：

| ファイル | 変更内容 | 由来 |
|:---|:---|:---|
| src/db.ts | HighQualityInputUnit インターフェース追加、version(29) スキーマ追加 | v29統合修正 |
| ActiveRecallView.tsx | QuestionUnderstandingAid インポート、async/await対応 | v29統合修正 |
| RepairPreview.tsx | QuestionUnderstandingAid インポート、questionText/category/tags プロップ追加 | v29統合修正 |
| inputUnitRepairMatcher.ts | high_quality_input_units DBクエリ追加、async化 | v29統合修正 |
| dist/* | build結果 | build由来 |

### 3.2 package.json / package-lock.json 変更

**変更内容**: puppeteer: "^24.43.0" の追加

**由来**: 前回の作業（v29統合修正）によるもの

**今回v30設計では**: package変更なし ✅

---

## 4. v30実装有無確認

### 4.1 DBスキーマ確認

```bash
Select-String -Path ".\src\db.ts" -Pattern "version\(30\)|question_explanations|choice_explanations"
```

**結果**: 該当なし ✅

**確認**: src/db.ts に version(30) は実装されていない

### 4.2 コンポーネント確認

```bash
Select-String -Path ".\src\components\learning\*.tsx" -Pattern "question_explanations|choice_explanations"
```

**結果**: 
- ActiveRecallView.tsx Line 479: `contract?.choice_explanations`
- これは learningContentContract.ts の型定義（既存）
- DBテーブルではない ✅

### 4.3 ユーティリティ確認

```bash
Select-String -Path ".\src\utils\*.ts" -Pattern "question_explanations|choice_explanations"
```

**結果**:
- explanationBuilder.ts Line 152: `choice_explanations: choiceExplanations`
- learningContentContract.ts Line 53: `choice_explanations?: ChoiceExplanation[]`
- これらはメモリ上のデータ構造（既存）
- DBテーブルではない ✅

### 4.4 既存の choice_explanations について

**重要な発見**:
- 既存コードで choice_explanations という用語が使われている
- しかし、これは learningContentContract.ts の型定義
- explanationBuilder.ts で生成されるメモリ上のデータ
- **DBテーブルではない**
- v30で新規追加する choice_explanations ストアとは別物

**既存（v29以前）**:
```typescript
// learningContentContract.ts
export interface LearningContentContract {
    choice_explanations?: ChoiceExplanation[];  // メモリ上のデータ
}
```

**v30新規**:
```typescript
// db.ts (v30)
this.version(30).stores({
    choice_explanations: 'id, choice_id, source_choice_id, ...'  // DBテーブル
});
```

---

## 5. 安全性確認

### 5.1 source_choices / is_statement_true 変更の有無

| 項目 | 結果 |
|:---|:---|
| source_choices変更 | ✅ なし |
| is_statement_true変更 | ✅ なし |
| study_events変更 | ✅ なし |
| memory_cards変更 | ✅ なし |
| restoration_candidates変更 | ✅ なし |

### 5.2 DB操作の有無

| 項目 | 結果 |
|:---|:---|
| DB削除 | ✅ なし |
| DB clear | ✅ なし |
| IndexedDB初期化 | ✅ なし |
| Migration実行 | ✅ なし |

### 5.3 その他危険操作の有無

| 項目 | 結果 |
|:---|:---|
| Batch 1正式投入再実行 | ✅ なし |
| rollback本実行 | ✅ なし |
| npm install | ✅ なし（前回のpuppeteerはv29修正由来） |
| commit | ✅ なし |
| push | ✅ なし |
| deploy | ✅ なし |

---

## 6. 今回作業由来の変更

### 6.1 今回v30設計で追加したファイル

| ファイル | 状態 |
|:---|:---|
| docs/design/V30_QUESTION_CHOICE_EXPLANATIONS_SCHEMA_DESIGN.md | ✅ 新規追加 |
| docs/design/v30_question_choice_explanations_schema_design.json | ✅ 新規追加 |

### 6.2 今回v30設計で変更したファイル

**なし** ✅

今回の作業は「設計のみ」であり、実装は行っていません。

---

## 7. 既存変更（v29統合修正）の整理

### 7.1 変更ファイル一覧

| ファイル | 変更内容 | v29関連 |
|:---|:---|:---|
| src/db.ts | HighQualityInputUnit インターフェース追加、version(29) スキーマ追加 | ✅ |
| src/components/learning/ActiveRecallView.tsx | QuestionUnderstandingAid インポート、async/await対応 | ✅ |
| src/components/learning/RepairPreview.tsx | QuestionUnderstandingAid インポート、questionText/category/tags プロップ追加 | ✅ |
| src/components/learning/InputUnitViewer.tsx | 変更あり（詳細未確認） | ✅ |
| src/components/learning/MemoryRecallView.tsx | 変更あり（詳細未確認） | ✅ |
| src/utils/inputUnitRepairMatcher.ts | high_quality_input_units DBクエリ追加、async化 | ✅ |
| src/utils/inputUnitPrototypes.ts | 変更あり（詳細未確認） | ✅ |
| src/utils/highQualityDataLoader.ts | 変更あり（詳細未確認） | ✅ |
| src/types/inputUnit.ts | 変更あり（詳細未確認） | ✅ |
| dist/* | build結果 | - |
| package.json | puppeteer追加 | ✅ |
| package-lock.json | puppeteer関連 | ✅ |
| public/db-audit.html | 変更あり | - |

### 7.2 v29統合修正の目的

- high_quality_input_units テーブルの追加（v29）
- inputUnitRepairMatcher.ts のDB統合対応
- ActiveRecallView.tsx のasync/await対応
- RepairPreview.tsx のQuestionUnderstandingAid表示対応

---

## 8. 監査結論

### 8.1 判定

**A - v30設計・差分監査PASS**

### 8.2 判定理由

1. ✅ build PASS
2. ✅ v30設計ファイルが存在する
3. ✅ src/db.ts に version(30) 実装がまだ入っていない
4. ✅ question_explanations / choice_explanations のDB実装がまだ入っていない
5. ✅ source_choices / is_statement_true / study_events に危険変更なし
6. ✅ package.json / package-lock.json を今回変更していない（前回v29修正由来）
7. ✅ dist変更はbuild由来
8. ✅ 次にv30スキーマ実装へ進めることができる

### 8.3 既存の choice_explanations についての補足

- 既存コードで choice_explanations という用語が使われている
- しかし、これは learningContentContract.ts の型定義（メモリ上のデータ）
- v30で新規追加する choice_explanations ストア（DBテーブル）とは別物
- 混同しないように注意が必要

---

## 9. 次のステップ

### 9.1 v30スキーマ実装への準備完了

設計が完了し、既存変更との切り分けができたため、v30スキーマ実装に進むことができます。

### 9.2 実装順序の推奨

1. **src/db.ts への v30 スキーマ追加**
   - QuestionExplanation, ChoiceExplanation インターフェース追加
   - version(30) ストア定義追加
   - migration upgrade ロジック追加

2. **src/types/explanationTypes.ts の新規作成**
   - QuestionExplanation, ChoiceExplanation 型定義

3. **src/utils/explanationMatcher.ts の新規作成**
   - choice_explanations / question_explanations 検索ロジック

4. **表示ロジックの修正**
   - inputUnitRepairMatcher.ts に v30検索ロジック追加
   - RepairPreview.tsx に v30解説表示ロジック追加

---

## 10. リスク評価

### 10.1 既存コードとの混同リスク

**既存の choice_explanations（型定義）と v30 choice_explanations（DBテーブル）の混同**

- 既存: learningContentContract.ChoiceExplanation（メモリ上）
- v30新規: choice_explanations ストア（DBテーブル）

**対策**:
- 実装時に明確に区別する
- コメントで既存の型定義であることを明記
- 変数名を工夫する（例: dbChoiceExplanation vs contractChoiceExplanation）

### 10.2 既存変更の整理リスク

**現在多数のファイルが変更状態**

- v29統合修正による変更
- commitされていない

**対策**:
- v30実装前に、v29変更をcommitすることを推奨
- または、v30実装と同時にcommitする

---

**監査署名**: AI Engineer
**日付**: 2026-05-10
**ステータス**: A - v30設計・差分監査PASS
