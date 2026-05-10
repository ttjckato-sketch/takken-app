# 解説品質・データ量・正誤ラベル監査レポート

**監査日**: 2026-05-10
**監査担当**: AI Auditor
**監査対象**: v29 解説システム、high_quality_input_units統合状況

---

## 1. 監査概要

| 項目 | 結果 |
|------|------|
| build | ✅ PASS |
| high_quality_input_units DB存在 | ✅ 20件（Batch 1） |
| 解説システム統合 | ❌ FAIL - 統合ギャップあり |
| マッチングロジック | ❌ TAKKEN_PROTOTYPE_UNITSのみ使用 |

---

## 2. 重大な発見：統合ギャップ（CRITICAL）

### 2.1 問題の概要

Batch 1正式投入でインポートされた**20件のhigh_quality_input_units**が、解説システムで**完全に使用されていない**ことが判明しました。

### 2.2 根本原因

**File**: `src/utils/inputUnitRepairMatcher.ts`

```typescript
// Line 31: TAKKEN_PROTOTYPE_UNITSのみを使用
for (const unit of TAKKEN_PROTOTYPE_UNITS) {
    const validation = validateInputUnit(unit);
    if (!validation.isValid) continue;
    // ... matching logic
}
```

**問題点**:
- `findRepairInputUnit`関数が`TAKKEN_PROTOTYPE_UNITS`（ハードコードデータ）のみを検索
- `high_quality_input_units`テーブルへのクエリが存在しない
- Batch 1で投入した20件の高品質データが見えていない

### 2.3 影響範囲

**呼び出し元**: `src/components/learning/ActiveRecallView.tsx`

```typescript
// Line 71-76: 誤答後の補修インプット特定
const match = findRepairInputUnit({
    cardId: card.card_id,
    tags: card.tags,
    category: card.category
});
setRepairUnit(match.unit);
```

**影響**:
- 誤答後の解説が、DBの高品質データではなくハードコードされたプロトタイプのみに依存
- Batch 1の20件（詐欺・強迫、制限行為、借地借家法等）が表示されない
- 最新の正確な解説が提供されない

---

## 3. データ量監査

### 3.1 TAKKEN_PROTOTYPE_UNITS（現行）

| 項目 | 値 |
|------|-----|
| ソース | `src/utils/inputUnitPrototypes.ts` |
| 格納方式 | ハードコード（TypeScript配列） |
| 更新方法 | コード変更必要 |
| カテゴリ正規化 | 2026-05-03実施済み |
| 推定件数 | 要確認（ファイル未完了） |

### 3.2 high_quality_input_units（v29）

| 項目 | 値 |
|------|-----|
| テーブル | `high_quality_input_units` |
| Batch 1 | 20件（正式投入済み） |
| データソース | `public/batch1-formal-import.html` |
| 更新方法 | DB操作可能 |
| スキーマ | HighQualityInputUnit (v29) |

### 3.3 ギャップ分析

```
TAKKEN_PROTOTYPE_UNITS（ハードコード）
    ↓ findRepairInputUnit()
ActiveRecallView（解説表示）

high_quality_input_units（DB、20件存在）
    ↓ 無視されている ❌
```

---

## 4. 正誤ラベル監査

### 4.1 ラベル整合性

| 項目 | 結果 |
|------|------|
| is_statement_true | ✅ 正常に動作 |
| is_exam_correct_option | ✅ 正常に動作 |
| 誤答判定ロジック | ✅ 正常に動作 |

**確認**: `src/components/learning/ActiveRecallView.tsx` Line 88-94

```typescript
const handleAnswer = (selected: boolean | number, rating?: number) => {
    const isCorrect = selected === correctAnswer;
    // ... 誤答診断生成
    const updatedContract = buildLearningContentContract(card, sourceChoices, selected);
};
```

### 4.2 問題なし

正誤ラベルシステムに問題はありません。

---

## 5. 解説品質評価

### 5.1 現行解説の品質

**TAKKEN_PROTOTYPE_UNITS サンプル**（Line 12-50）:

```typescript
{
    unit_id: 'unit_rights_fraud_coercion_001',
    title: '詐欺・強迫（民法96条）',
    category: '権利関係',
    conclusion: '詐欺も強迫も取り消せるが、第三者保護は詐欺だけ問題になる...',
    purpose: '本人の意思決定の自由を保護しつつ...',
    requirements: [...],
    legal_effect: '瑕疵ある意思表示として...',
    // ... 詳細な法的根拠
}
```

**評価**: 構造化された高品質データ

### 5.2 Batch 1データの品質

**確認**: `public/batch1-formal-import.html`

- 20件の高品質InputUnit
- source_trace_grade: 'A'
- review_status: 'auto_ok'
- 詳細な法的根拠付き

**問題**: これらが表示されない

---

## 6. Fallback頻度分析

### 6.1 RepairPreview.tsx

**File**: `src/components/learning/RepairPreview.tsx`

```typescript
// Line 27-100: unitがnullの場合のfallback
if (!unit) {
    return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3>補修インプット準備中</h3>
            <p>該当する補修インプットが見つかりませんでした。</p>
        </div>
    );
}
```

### 6.2 Fallback発生条件

1. `findRepairInputUnit`が`unit: null`を返す
2. TAKKEN_PROTOTYPE_UNITSに一致するデータがない
3. **high_quality_input_unitsは検索されない**

### 6.3 推定Fallback率

- TAKKEN_PROTOTYPE_UNITSの件数 < 全カード数
- 多くのカードでfallbackが発生している可能性
- **正確な統計にはDBアクセスが必要**

---

## 7. 監査結論

### 7.1 総合評価

| 項目 | 評価 |
|------|------|
| 正誤ラベル | A - PASS |
| 解説データ構造 | A - PASS |
| **データ統合** | **D - FAIL** |
| **マッチングロジック** | **D - FAIL** |

### 7.2 CRITICAL ISSUE

**統合ギャップにより、Batch 1の20件の高品質データが完全に無視されている**

### 7.3 影響

- ユーザーに最新の正確な解説が提供されない
- DB投入のコストが無駄になっている
- システムの拡張性が損なわれている

---

## 8. 推奨事項

### 8.1 緊急対応（HIGH PRIORITY）

1. **inputUnitRepairMatcher.ts修正**
   - `high_quality_input_units`テーブルをクエリするロジック追加
   - TAKKEN_PROTOTYPE_UNITSとDBデータの統合検索

2. **マッチング順序の再設計**
   ```
   1. high_quality_input_units（DB、最新）
   2. TAKKEN_PROTOTYPE_UNITS（フォールバック）
   3. null（最終fallback）
   ```

### 8.2 中期対応（MEDIUM PRIORITY）

1. **データ移行**
   - TAKKEN_PROTOTYPE_UNITS → high_quality_input_units
   - ハードコード廃止、DB一元化

2. **統計監視**
   - fallback頻度の計測
   - マッチ成功率の可視化

### 8.3 長期対応（LOW PRIORITY）

1. **マッチングアルゴリズム改善**
   - タグ重み付けの最適化
   - カテゴリマッチングの精度向上

---

## 9. 次のアクション

1. **緊急**: `inputUnitRepairMatcher.ts`の修正実装
2. **検証**: 修正後のマッチング動作確認
3. **計測**: fallback頻度の定量評価
4. **移行**: TAKKEN_PROTOTYPE_UNITSのDB化

---

## 10. エビデンス

1. **監査対象ファイル**:
   - `src/utils/inputUnitRepairMatcher.ts`
   - `src/components/learning/ActiveRecallView.tsx`
   - `src/utils/inputUnitPrototypes.ts`
   - `src/components/learning/RepairPreview.tsx`

2. **関連レポート**:
   - `docs/audit/BATCH1_FORMAL_IMPORT_RESULT_REPORT.md`
   - `docs/audit/batch1_formal_import_implementation_audit.json`

---

**監査署名**: AI Auditor (Claude Code)
**日付**: 2026-05-10
**ステータス**: CRITICAL ISSUE IDENTIFIED
