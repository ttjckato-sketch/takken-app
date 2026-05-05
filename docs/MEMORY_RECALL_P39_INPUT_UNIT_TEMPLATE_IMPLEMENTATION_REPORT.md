# MemoryRecall P39 Input Unit Template Implementation Report

## 概要
「質の良いインプット」を実現するための基盤として、Input Unit Template の型定義、バリデータ、および既存データからの変換ビルダーを実装した。
これにより、法的根拠（source_trace）が保証され、かつ原則・例外・罠・図解・補修説明が構造化された「知識単元」をシステム的に管理・監査する準備が整った。

## 実施内容
- **Input Unit 型定義の追加**:
  - `src/types/inputUnit.ts` を新設。
  - 結論、趣旨、要件、効果、原則、例外、罠、1問確認、補修説明、法的根拠を含む構造を定義。
- **バリデータ（InputUnitValidator）の実装**:
  - `src/utils/inputUnitValidator.ts` を新設。
  - 必須フィールドの欠損、法的根拠の有無、品質フラグ（プレースホルダ、要人的レビュー）を自動判定する仕組みを構築。
- **変換ビルダー（InputUnitBuilder）の最小実装**:
  - `src/utils/inputUnitBuilder.ts` を新設。
  - 既存の `understanding_cards` 等から、法的根拠や紐付けタグを保持したまま Input Unit のスケルトン（骨組み）を生成する機能を実装。
- **Dynamic Property による保存方針の確立**:
  - 新テーブルを作成せず、既存の Card オブジェクトに `input_unit` プロパティを動的に付与する方針を採用。
  - これにより DB Schema v24 を維持したまま、リッチな教材構造の永続化を実現。
- **監査 UI の追加**:
  - `db-audit.html` に「📖 P39 Input Quality Layer 資産監査」セクションを追加。
  - 教材の構造適合率（Valid/Invalid）や、法的根拠の充足状況をリアルタイムで監視可能にした。

## 結果 (実測値)
- **監査対象数**: 50件 (understanding_cards スキャン)
- **構造適合率 (初期値)**: 0% (スケルトン段階のため、法的記述が未補完であることを正確に検知)
- **法的根拠欠損検知**: 正常 (source_trace がない場合に Invalid 判定されることを実測)
- **Build 結果**: PASS
- **Schema 整合性**: FULL_SYNC (v24) 維持

## 動作確認
- ババリデータが、必須項目（結論、原則等）の不足を正確にエラーとして報告することを物理監査。
- 既存の 30問標準・35問集中・Focus Mode・改善スコア表示への干渉がないことを回帰確認。
- 法律内容の推測生成を一切行わず、人間によるデータ投入を待機する「安全な器」としての動作を確認。

## P40 (次フェーズ) への課題
- 宅建業法（媒介契約、重説、37条書面等）の代表論点に対する、構造化データのプロトタイプ投入。
- 構造化されたインプット情報の Dashboard 表示（まずは Top 1 弱点に関連するものから）。
- 誤答時の「Repair Loop」の実装開始。

## 判定
**A. MemoryRecall P39 Input Unit Template 実装OK**
法的誠実性を守りつつ、単なる暗記アプリから「理解と定着を科学的に繋ぐ学習 OS」への進化に向けた、構造的土台が完成した。
