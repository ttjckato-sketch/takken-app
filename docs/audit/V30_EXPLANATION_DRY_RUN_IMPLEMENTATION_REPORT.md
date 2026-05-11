# v30 Explanation Dry-run Implementation Report

**実施日**: 2026-05-10
**担当**: AI Engineer
**対象**: v30初回解説データ生成dry-run実装

---

## 1. 実装概要

v30スキーマ実装完了後、初回の問題別・選択肢別解説データを生成するdry-runスクリプトを実装しました。

- **実装ファイル**: src/utils/v30ExplanationDryRunGenerator.ts
- **実行タイプ**: dry-run (DB writeなし)
- **出力形式**: JSON (console.log)

---

## 2. 実装機能

### 2.1 候補生成

- question_explanations候補: 最大15件
- choice_explanations候補: 最大45件
- 対象カテゴリ: 農地法、35条/37条、媒介契約、クーリング・オフ、詐欺・強迫、借地借家、賃貸住宅管理

### 2.2 品質判定

- Quality A: source_trace_grade=A, confidence=high, source_refs>=1, application>30文字
- Quality B: source_trace_grade=B, confidence=medium, または application/whyが20〜30文字
- Quality C: source_trace_grade=C/D, confidence=low, source_refsなし

### 2.3 正誤疑義検出

- is_statement_true_snapshotを記録のみ
- is_statement_true=nullの場合はlabel_conflict_suspected=true
- human_review_required=true

### 2.4 検証機能

- 重複ID検証
- 必須フィールド検証
- source_refs検証

---

## 3. 関数構成

### 3.1 主要関数

- `runV30ExplanationDryRun()`: dry-run実行メイン関数
- `generateQuestionExplanationCandidates()`: question_explanations候補生成
- `generateChoiceExplanationCandidates()`: choice_explanations候補生成
- `determineSourceTraceGrade()`: source_trace_grade判定
- `determineConfidence()`: confidence判定
- `determineQuality()`: quality判定
- `validateDuplicateIds()`: 重複ID検証
- `validateRequiredFields()`: 必須フィールド検証
- `validateSourceRefs()`: source_refs検証

### 3.2 出力関数

- `outputV30DryRunAsJSON()`: JSON出力

---

## 4. 使用方法

ブラウザコンソールから実行:

```javascript
// JSON出力
await outputV30DryRunAsJSON();

// またはオブジェクトクト取得
const result = await runV30ExplanationDryRun();
console.log(result.summary);
```

---

## 5. 安全性確認

| 項目 | 結果 |
|:---|:---:|
| DB write | ❌ なし |
| add / bulkAdd 呼び出し | ❌ なし |
| source_choices変更 | ❌ なし |
| is_statement_true変更 | ❌ なし |
| study_events変更 | ❌ なし |

---

## 6. Build結果

```
✓ built in 2.27s
```

---

## 7. 次のステップ

1. ブラウザ実行でdry-run結果確認
2. 生成データの品質レビュー
3. 必要に応じて生成ロジック調整
4. formal importスクリプト実装 (別タスク)

---

**実施署名**: AI Engineer
**日付**: 2026-05-10
**ステータス**: A - v30解説データdry-run実装完了
