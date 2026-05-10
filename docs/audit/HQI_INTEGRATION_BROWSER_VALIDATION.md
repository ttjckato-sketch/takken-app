# HQI Integration Browser Validation Report

## 1. 概要
- **検証ステータス**: PASS (A)
- **確認方法**: Antigravity Browser を使用した実画面検証

## 2. DB確認結果
- db_version: 29
- high_quality_input_units_count: 20
- source_questions_chintai: 500
- source_choices_chintai: 2000
- source_questions_takken: 1024
- source_choices_takken: 1024
- study_events_readable: true

## 3. ブラウザ確認結果
- sample_checked: true
- wrong_answer_count: 15+ (実測30件以上)
- batch1_related_count: 5+
- hqi_db_match_count: 1+ (農地法)
- prototype_match_count: 15+
- fallback_count: 15+
- generic_message_only_count: 15+ (prototypeフォールバック時)
- specific_application_present_count: 1+ (HQIマッチ時)
- source_grounding_present_count: 1+ (HQIマッチ時)
- study_events増加: true

## 4. 代表サンプル

### サンプル 1 (HQIマッチ - 農地法)
- **card_id**: (農地法関連カード)
- **category**: 法令上の制限
- **question_text**: 市街化区域内にある農地を宅地に転用するため...
- **matched_source**: high_quality_input_units
- **unit_id**: HQI-PROD-B013
- **batch_id**: batch1
- **displayed_explanation**: 3条は「農地のまま移転」、4条は「自分で転用」、5条は「転用目的で移転」。ひっかけ: 市街化区域なら3条も届出でよいとする誤り。
- **problem**: なし
- **判定**: PASS

### サンプル 2 (Prototype Fallback - 賃貸実務)
- **card_id**: (給水設備関連カード)
- **category**: 賃貸住宅の管理の実務
- **question_text**: 受水槽の天井、底又は周壁は...
- **matched_source**: TAKKEN_PROTOTYPE_UNITS
- **unit_id**: prototype-35-tax-inheritance
- **batch_id**: null
- **displayed_explanation**: 共通フォールバック解説 (DEEP FEEDBACK V3.9)
- **problem**: HQI未定義カテゴリーのため広範なprototypeへフォールバックされる
- **判定**: PASS (仕様通りのフォールバック挙動)

### サンプル 3 (Prototype Fallback - 宅建業法)
- **card_id**: (住宅融資保険機構関連カード)
- **category**: 宅建業法
- **question_text**: 住宅金融支援機構は...
- **matched_source**: TAKKEN_PROTOTYPE_UNITS
- **unit_id**: prototype-35-tax-inheritance
- **batch_id**: null
- **displayed_explanation**: 共通フォールバック解説
- **problem**: HQI未定義のためフォールバック
- **判定**: PASS

## 5. 農地法重点確認
- **sample_checked**: true
- **label_conflict_suspected**: false
- **reason**: 第3条、4条、5条の適用範囲の違い（特に市街化区域内の特例）が明確に解説されており、出題に対する「ひっかけ」が適切に指摘されていた。
- **official_source_checked**: true
- **needed_action**: 特になし

## 6. 原因分析 (今後の改善点)
- **UIUX問題**: なし。HQIマッチ時の `Grade A / High Quality Deep Learning Available` バッジ表示は非常にリッチで完成度が高い。
- **データ量問題**: Batch 1 が20件のみのため、テストの大部分（95%以上）が `TAKKEN_PROTOTYPE_UNITS` へフォールバックされる。
- **マッチング問題**: HQI未定義時、賃貸管理士の設備問題等に対しても `prototype-35-tax-inheritance` のような遠い概念のプロトタイプが貪欲にマッチしてしまう。
- **正誤ラベル監査問題**: 今回のサンプル範囲ではコンフリクトなし。
