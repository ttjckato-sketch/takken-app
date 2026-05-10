# HQI統合ブラウザ検証ガイド

**検証日**: 2026-05-10
**担当**: AI Engineer (Flash)
**目的**: high_quality_input_units 統合修正後のブラウザ検証

---

## 1. 検証環境

- **URL**: http://127.0.0.1:5176
- **Origin**: 127.0.0.1:5176（localhost、5179、本番URLは使用禁止）
- **理由**: IndexedDBはorigin単位で分離されるため

---

## 2. 事前DB確認手順

### Step 1: v29-audit.html を開く

```
http://127.0.0.1:5176/v29-audit.html
```

### Step 2: 以下の値を確認して記録

| 項目 | 期待値 | 実測値 | 判定 |
|------|--------|--------|------|
| db_version | 29 | | |
| high_quality_input_units_count | 20 | | |
| source_questions_chintai | 500 | | |
| source_choices_chintai | 2000 | | |
| source_questions_takken | 1024 | | |
| source_choices_takken | 1024 | | |
| study_events_readable | true | | |

---

## 3. ActiveRecall ブラウザ検証手順

### Step 1: アプリ本体を開く

```
http://127.0.0.1:5176/
または
http://127.0.0.1:5176/takken-app/
```

### Step 2: 学習モードを選択

- 宅建業法 または 権利関係 を推奨（Batch 1論点多め）

### Step 3: 最低15問確認

**内訳**:
- Batch 1論点に近い問題: 最低5問
- 農地法: 最低2問
- 35条/37条: 最低2問
- 媒介契約またはクーリング・オフ: 最低2問
- 賃貸管理士: 最低3問
- **誤答: 最低10問**

### Step 4: 各カードで記録

以下の情報を記録してください：

| 項目 | 記録内容 |
|------|----------|
| card_id | |
| exam_type | |
| category | |
| question_text | （一部） |
| answered_correct | true/false |
| RepairPreview表示 | 有/無 |
| QuestionUnderstandingAid表示 | 有/無 |
| high_quality_input_units参照 | 有/無 |
| 表示されたunit_id | |
| batch_id | |
| origin | |
| source_trace_grade | |
| review_status | |
| fallbackか | 是/否 |
| TAKKEN_PROTOTYPE_UNITS由来か | 是/否 |
| DB high_quality_input_units由来か | 是/否 |
| 「この問題への当てはめ」有無 | 有/無 |
| 「なぜ〇/×か」有無 | 有/無 |
| 根拠URL表示 | 有/無 |
| 汎用文だけで終わっていない | 是/否 |

---

## 4. Batch 1 対象論点リスト

**Batch 1の20件（参考）**:

1. HQI-PROD-B001: 詐欺・強迫（民法96条）
2. HQI-PROD-B002: 制限行為能力
3. HQI-PROD-B003: 意思表示
4. HQI-PROD-B004: 代理
5. HQI-PROD-B005: 無効・取消し
6. HQI-PROD-B006: 条件・期限
7. HQI-PROD-B007: 時効
8. HQI-PROD-B008: 物権変動
9. HQI-PROD-B009: 不動産登記
10. HQI-PROD-B010: 共有
11. HQI-PROD-B011: 借地権
12. HQI-PROD-B012: 借家権
13. HQI-PROD-B013: 建物区分所有
14. HQI-PROD-B014: 契約総合
15. HQI-PROD-B015: 賃貸借
16. HQI-PROD-B016: 請負
17. HQI-PROD-B017: 委任
18. HQI-PROD-B018: 不当利得
19. HQI-PROD-B019: 不法行為
20. HQI-PROD-B020: 親族・相続

**カテゴリ対応**:
- 権利関係: 詐欺・強迫、制限行為、代理、無効・取消し、時効、物権変動、借地権、借家権
- 宅建業法: 媒介契約、重要事項説明
- 民法: 契約総合、賃貸借、委任、不法行為

---

## 5. 農地法カード重点確認

### 確認すべき論点

- 市街化区域外
- 農地
- 競売
- 所有権取得
- 農地法3条
- 農地法5条
- 買受適格証明

### 確認項目

- 問題文全文
- 現在の正誤ラベル
- 表示される解説
- 根拠URL
- label_conflict_suspected の有無

**注意**: 正誤ラベルは変更しないでください。疑義がある場合は候補として記録のみ。

---

## 6. 合格基準

### A判定（PASS）

- ✅ build PASS
- ✅ high_quality_input_units_count = 20
- ✅ Batch 1近似論点で DB由来HQI が表示される
- ✅ HQI表示に batch_id = batch1 が確認できる
- ✅ source_trace_grade = A が確認できる
- ✅ fallbackだけで終わらない
- ✅ study_eventsが増加する
- ✅ source_choices / is_statement_true に変更なし

### B判定（PARTIAL）

- ⚠️ DB由来HQIは表示されるが、対象カードが少ない
- ⚠️ fallbackが多い
- ⚠️ 汎用文が残る
- ⚠️ 当てはめ解説が薄い
- ⚠️ 農地法など一部で正誤ラベル疑義が残る

### C判定（FAIL）

- ❌ DB由来HQIが表示されない
- ❌ build FAIL
- ❌ study_eventsが壊れた
- ❌ source_choices / is_statement_true を変更した
- ❌ 正誤ラベル疑義が強いのに出題継続している

---

## 7. 禁止事項

以下は禁止です：

- ❌ 新規実装
- ❌ DB削除
- ❌ DB clear
- ❌ IndexedDB初期化
- ❌ Batch 1正式投入の再実行
- ❌ rollback本実行
- ❌ source_choices変更
- ❌ is_statement_true変更
- ❌ study_events変更
- ❌ memory_cards変更
- ❌ restoration_candidates変更
- ❌ npm install
- ❌ package.json変更
- ❌ package-lock.json変更
- ❌ commit
- ❌ push
- ❌ deploy
- ❌ 本番URL操作

---

## 8. 出力ファイル

検証完了後、以下を作成してください：

1. `docs/audit/HQI_INTEGRATION_BROWSER_VALIDATION.md`
2. `docs/audit/hqi_integration_browser_validation.json`

---

**検証開始前チェックリスト**:

- [ ] DevServer起動確認（npm run dev）
- [ ] URL確認（http://127.0.0.1:5176）
- [ ] 事前DB確認完了
- [ ] 記録シート準備完了
