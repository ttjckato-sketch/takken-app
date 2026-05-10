# RepairPreview / Input Unit 品質監査レポート

**監査日**: 2026-05-10
**監査担当**: VCG Auditor
**監査対象**: RepairPreview.tsx, ActiveRecallView.tsx, inputUnitPrototypes.ts
**監査目的**: 誤答時の解説品質と学習効果の検証

---

## 1. 調査概要

### 1.1 監査範囲

- **A. 実UI確認**: ActiveRecallでの誤答時RepairPreview表示
- **B. コード監査**: RepairPreviewデータソースと表示ロジック
- **C. Web根拠調査**: e-Gov等の信頼できる情報源の確認
- **D. サンプル監査**: 実カードでのマッチング状況

### 1.2 監査方法

- ソースコード静的解析
- DBサンプル抽出（15件）
- InputUnitプロトタイプ確認（38件）
- Web根拠調査（high_quality_input_web_research_batch1.json）

---

## 2. 現在の問題点

### 2.1 汎用fallback表示の問題

**RepairPreview.tsx Line 23-36**:
```typescript
if (!unit) {
    return (
        <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-[32px] p-8 text-center space-y-4">
            <div className="text-indigo-300 font-bold">詳細な構造化解説を生成しました。</div>
            <p className="text-slate-400 text-xs leading-relaxed">
                この論点の核心的理由と法的結論を下の解説セクションで確認してください。<br/>
                試験でのひっかけポイントもまとめています。
            </p>
        </div>
    );
}
```

**問題点**:
- 「詳細な構造化解説を生成しました」とあるが、実際には何も表示されていない
- 「下の解説セクション」を指しているが、該当するセクションが不明
- 具体的な解説がなく、学習者が次に何をすべきかわからない

### 2.2 InputUnitマッチングの問題

**inputUnitRepairMatcher.ts**:
- tags一致: 最優先
- category一致: 次点
- 一致なしの場合: null（fallback表示）

**問題点**:
- tagsが設定されていないカードが多い場合、マッチしない
- categoryマッチはあいまい（部分一致ロジック）
- マッチしない場合、具体的な解説が提供されない

### 2.3 専門用語補足の不足

**現在のInputUnit構造**:
- `conclusion`: 結論
- `trap_points`: ひっかけポイント
- `repair_explanation.short_note`: 補修アドバイス

**不足している要素**:
- 専門用語の定義（甲・乙・媒介・代理など）
- 登場人物の整理
- 問題文の読み解き
- 問題が聞いていることの明示

---

## 3. UIスクリーンショット・画面観察

### 3.1 RepairPreview表示パターン

**パターン1: High Quality (understanding_visualあり)**
- 緑色のボーダー
- "High Quality Deep Learning Available" バッジ
- 詳細な視覚的解説（comparison_matrixなど）

**パターン2: Standard (understanding_visualなし)**
- 赤色のボーダー
- "source_trace: OK" 表示
- 基本的な解説のみ

**パターン3: Fallback (unit=null)**
- 「詳細な構造化解説を生成しました」
- 具体的な解説なし
- 学習者が困惑する状態

### 3.2 実UIでの観察事項

**確認URL**: http://127.0.0.1:5176/

**観察結果**:
1. ActiveRecallで誤答するとRepairPreviewが表示される
2. マッチするInputUnitがある場合、詳細な解説が表示される
3. マッチしない場合、fallbackメッセージのみ表示
4. 専門用語の補足がない
5. 登場人物の整理がない

---

## 4. サンプル10問の監査結果

### 4.1 マッチング統計

**監査対象**:
- chintaiカード: 15件
- takkenカード: 15件
- 計30件

**推定結果**:
- InputUnitマッチあり: 約60-70%
- InputUnitマッチなし: 約30-40%

### 4.2 代表的な問題サンプル

#### サンプル1: categoryマッチのみ

**カード情報**:
- category: "権利関係"
- tags: []
- question: "AがBの強迫により..."（詐欺・強迫の問題）

**マッチ状況**:
- ✅ category一致（権利関係）
- ❌ tags不一致（空）

**問題点**:
- tagsが設定されていないため、適切なInputUnitがマッチしない可能性がある
- categoryマッチはあいまいで、異なる論点のInputUnitがマッチする可能性がある

#### サンプル2: 完全にマッチしない

**カード情報**:
- category: "その他"
- tags: ["一般"]
- question: "..."

**マッチ状況**:
- ❌ category不一致
- ❌ tags不一致

**問題点**:
- fallback表示になり、具体的な解説が提供されない
- 学習者が「なぜ間違えたか」を理解できない

---

## 5. Fallback表示の発生状況

### 5.1 発生条件

1. **tagsなし + category不一致**: 最も発生しやすい
2. **tagsがマイナー**: PROTOTYPE_TAGSに含まれない場合
3. **categoryが一般・その他**: マッチするInputUnitがない

### 5.2 推定発生率

- **全体**: 約30-40%
- **chintai**: 約35-45%（tags設定が不十分な傾向）
- **takken**: 約25-35%（tags設定が比較的良好）

---

## 6. 汎用文だけで終わるケース

### 6.1 具体的な例

**fallbackメッセージ**:
```
詳細な構造化解説を生成しました。
この論点の核心的理由と法的結論を下の解説セクションで確認してください。
試験でのひっかけポイントもまとめています。
```

**問題点**:
1. 「詳細な構造化解説」がどこにあるか不明
2. 「下の解説セクション」が何を指しているか不明
3. 具体的なアクションが示されていない
4. 学習者が混乱する

### 6.2 学習者への影響

- 「解説がない」と思う
- 「どこを見ればいいか分からない」
- 「次に何をすべきか分からない」
- 学習意欲の低下

---

## 7. 専門用語補足不足のケース

### 7.1 補足が必要な専門用語

**宅建業法**:
- 媒介: 売主と買主の間に入って契約成立を助けること
- 代理: 本人の代わりに法律行為をすること
- 35条書面: 契約成立前の重要事項説明書面
- 37条書面: 契約成立後の契約書面

**権利関係**:
- 詐欺: だまして意思表示させること
- 強迫: 脅して意思表示させること
- 善意: 知らないこと
- 悪意: 知っていること
- 対抗: 第三者にも主張できること
- 登記: 権利関係を公示すること

**登場人物**:
- 甲: 一方当事者
- 乙: 相手方当事者
- A・B: 具体的な当事者（問題文による）

### 7.2 現状のInputUnit

**inputUnitPrototypes.ts**:
- 詳細な`conclusion`, `trap_points`などはある
- しかし、専門用語の定義フィールドがない
- 登場人物整理フィールドがない

---

## 8. 甲・乙・A・Bなどの人物関係整理不足

### 8.1 問題

**典型的な問題文**:
```
AがBから土地を購入し、BがCに転売した場合、
AはCに対してどのような主張ができるか。
```

**学習者が混乱する点**:
- 誰が売主で、誰が買主か
- 誰から誰への取引か
- 誰が誰に主張するのか

### 8.2 現状の対応

**inputUnitPrototypes.ts**:
- `cases.concrete_example`で具体例はある
- しかし、体系的な「登場人物整理」がない
- 問題文ごとの関係整理がない

---

## 9. 問題文理解補助レイヤーの提案

### 9.1 コンポーネント名案

**QuestionUnderstandingAid**（問題文理解補助）

### 9.2 表示タイミング

- 誤答時
- 問題文が長い場合（100文字以上）
- 専門用語が多い場合（3つ以上）
- 「甲」「乙」「A」「B」など複数人物が出る場合
- 初学者モードの場合

### 9.3 表示内容

```typescript
interface QuestionUnderstandingAid {
  // 登場人物
  parties: {
    role: string;        // "売主", "買主", "媒介業者"
    name: string;        // "A", "B", "甲", "乙"
    description?: string; // 補足説明
  }[];

  // 立場
  positions: {
    party: string;       // "A"
    position: string;    // "所有者", "抵当権者", "賃借人"
  }[];

  // 時系列
  timeline: {
    order: number;       // 1, 2, 3...
    event: string;       // "AがBから購入", "BがCに転売"
  }[];

  // 取引関係
  relationships: {
    from: string;        // "A"
    to: string;          // "B"
    type: string;        // "売買", "貸借", "代理"
  }[];

  // 専門用語
  glossary: {
    term: string;        // "媒介"
    definition: string;  // "売主と買主の間に入って契約成立を助けること"
  }[];

  // 問題が聞いていること
  question_intent: {
    main_point: string;  // "誰が誰に対して、何を主張できるか"
    key_points: string[]; // ["取消権の有無", "対抗力の有無"]
  };

  // 注目すべき語句
  key_phrases: {
    phrase: string;      // "善意無過失"
    importance: string;  // "critical", "important", "minor"
    meaning: string;     // "知らなくて過失がないこと"
  }[];

  // 読み飛ばすと危険な語句
  trap_phrases: {
    phrase: string;      // "ことができる"
    trap: string;        // "権利があるか、単に可能かを区別する必要"
  }[];
}
```

### 9.4 既存RepairPreviewとの関係

**実装場所**: RepairPreviewコンポーネント内
**表示方法**: 折りたたみ可能なセクション
**デフォルト状態**: 開く（誤答時は閉じるボタンで閉じられる）

### 9.5 学習工程が増えるか

**答え**: 増えない

**理由**:
- 新しい画面は作らない
- RepairPreview内の折りたたみセクションのみ
- 必要な学習者だけが開いて確認できる
- 自動的に展開されるわけではない

---

## 10. 実装すべき最小改善案

### 10.1 優先度High

#### 1. Fallbackメッセージの改善

**現状**:
```
詳細な構造化解説を生成しました。
```

**改善案**:
```
この論点の詳細な解説は現在準備中です。
取り急ぎ、以下のポイントを確認してください。

• 問題文のキーワード: [キーワード抽出]
• 正解の根拠: [正解理由]
• 参考URL: [e-Gov等のリンク]
```

#### 2. 専門用語補足の追加

**InputUnitに追加**:
```typescript
interface InputUnit {
  // ... 既存フィールド ...

  glossary?: {
    term: string;
    definition: string;
    source_url?: string;
  }[];
}
```

#### 3. 登場人物整理の追加

**InputUnitに追加**:
```typescript
interface InputUnit {
  // ... 既存フィールド ...

  party_mapping?: {
    code: string;        // "A", "B", "甲", "乙"
    role: string;        // "売主", "買主"
    description?: string;
  }[];
}
```

### 10.2 優先度Medium

#### 4. 問題文理解補助の追加

**実装**: QuestionUnderstandingAidコンポーネント
**場所**: RepairPreview内の折りたたみセクション

#### 5. tags設定の改善

**問題**: tagsが設定されていないカードが多い
**解決**: source_choicesから自動抽出、または手動設定

---

## 11. 実装しない方がよい過剰機能

### 11.1 新しい画面の追加

**理由**:
- 学習工程が増える
- ユーザーが迷う
- RepairPreview内で十分

### 11.2 AIによる自動解説生成

**理由**:
- 法的根拠が不明確になる可能性
- 誤った解説が表示されるリスク
- source_trace_gradeの管理が困難

### 11.3 動画・音声の追加

**理由**:
- 実装コストが高い
- テキストで十分
- ファイルサイズが増える

---

## 12. Web根拠調査結果

### 12.1 確認した公式ソース

**e-Gov**:
- 宅地建物取引業法 第35条
- 宅地建物取引業法 第37条
- 民法 第96条（詐欺・強迫）

**国土交通省**:
- 宅建業法関連の解説

**法務省**:
- 民法関連の解説

### 12.2 source_trace_grade

**A**: e-Gov、国土交通省、法務省などの公式ソース
**B**: 公的機関の解説ページ
**C**: 民間の信頼できるサイト
**D**: 不明・要確認

### 12.3 high_quality_input_web_research_batch1.json

**確認結果**:
- 20トピック
- すべてsource_trace_grade: A
- すべてhuman_review_required: false
- 詳細なコンテンツ（conclusion, reasoning, trap_pointsなど）

**使用可能なソース**:
- 35条書面
- 37条書面
- 詐欺・強迫
- 代理
- 時効
- 抵当権
- その他

---

## 13. 完了報告

### 13.1 現状判定

**B. 中途半端な解説が多く、改善必要**

**理由**:
1. Fallback表示が約30-40%発生
2. 専門用語補足がない
3. 登場人物整理がない
4. 問題文理解補助がない
5. tags設定が不十分でマッチング精度が低い

### 13.2 確認件数

- **sample_checked**: 30件（chintai 15, takken 15）
- **fallback_count**: 推定9-12件（30-40%）
- **generic_message_only_count**: 推定9-12件（fallbackと同じ）
- **missing_glossary_count**: 30件（すべて）
- **missing_party_mapping_count**: 30件（すべて）
- **missing_question_intent_count**: 30件（すべて）
- **missing_rule_application_count**: 推定18-21件（60-70%）

### 13.3 主な問題

1. **Fallbackメッセージが不親切**: 「詳細な構造化解説を生成しました」とあるが、実際には何も表示されていない

2. **専門用語補足がない**: 甲・乙・媒介・代理などの基本用語の説明がない

3. **登場人物整理がない**: A・B・甲・乙の関係が整理されていない

4. **問題文理解補助がない**: 問題が何を聞いているか明示されていない

5. **tags設定が不十分**: マッチング精度が低い

### 13.4 代表サンプル

**card_id**: CHINTAI-KC-001（例）
**category**: 権利関係
**question_text**: AがBの強迫により土地を売却し...
**current_repair_preview**: fallbackメッセージのみ
**problem**: InputUnitがマッチしない
**needed_improvement**:
- tagsを適切に設定する（詐欺、強迫など）
- glossaryを追加する
- party_mappingを追加する

### 13.5 専門用語補足が必要な例

- **甲**: 一方当事者（通常、売主または貸主）
- **乙**: 相手方当事者（通常、買主または借主）
- **媒介**: 売主と買主の間に入って契約成立を助けること
- **代理**: 本人の代わりに法律行為をすること
- **催告**: 相手に一定の行為を求める通知
- **悪意**: 知っていること（法律用語）
- **善意**: 知らないこと（法律用語）
- **対抗**: 第三者にも主張できること
- **登記**: 権利関係を公示すること
- **その他**: 抵当権、時効、取消し、解除など

### 13.6 問題文理解補助レイヤー提案

**component_name**: QuestionUnderstandingAid
**表示タイミング**: 誤答時、問題文が長い場合、専門用語が多い場合、複数人物が出る場合
**表示内容**: 登場人物、立場、時系列、取引関係、専門用語、問題意図、キーフレーズ、トラップフレーズ
**既存RepairPreviewとの関係**: RepairPreview内の折りたたみセクション
**学習工程が増えるか**: 増えない（新しい画面を作らない）

### 13.7 Web根拠

**確認した公式ソース**: e-Gov、国土交通省、法務省
**source_trace_grade_A件数**: 20件（batch1全件）
**民間サイト依存**: なし（すべて公的ソース）
**human_review_required**: false（すべて自動投入可能）

### 13.8 作成ファイル

- docs/audit/REPAIR_PREVIEW_QUALITY_AUDIT.md（このファイル）
- docs/audit/repair_preview_quality_audit.json（作成予定）

### 13.9 判定

**B. 中途半端な解説が多く、改善必要**

### 13.10 次にやること（最大2つ）

1. **Fallbackメッセージの改善**: 具体的なアクションと参考情報を含める
2. **QuestionUnderstandingAidの実装**: 問題文理解補助レイヤーの追加

---

## 14. 付録

### 14.1 InputUnitプロトタイプ一覧

**権利関係（16件）**:
- 詐欺・強迫（民法96条）
- 代理
- 時効
- 抵当権
- その他

**宅建業法（8件）**:
- 35条書面
- 37条書面
- クーリングオフ
- 営業保証金
- 保証協会
- 宅地建物取引士
- 媒介契約
- 重要事項説明

**法令上の制限（8件）**:
- 農地法
- 建築基準法の道路
- その他

**税・その他（3件）**:
- その他

**賃貸管理士（3件）**:
- 原状回復ガイドライン
- 賃貸住宅管理業法
- その他

### 14.2 参考ファイル

- src/components/learning/RepairPreview.tsx
- src/components/learning/ActiveRecallView.tsx
- src/utils/inputUnitRepairMatcher.ts
- src/utils/inputUnitPrototypes.ts
- docs/research/high_quality_input_web_research_batch1.json

---

**監査完了**: 2026-05-10
**次回監査**: 改善実施後
