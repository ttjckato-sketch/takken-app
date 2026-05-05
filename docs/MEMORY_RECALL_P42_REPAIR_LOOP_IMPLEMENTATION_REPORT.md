# MemoryRecall P42 Repair Loop Implementation Report

## 概要
誤答の瞬間を最大の学習機会に変えるため、ActiveRecall モードに「補修インプット（Repair Loop）」を試作・接続した。
これにより、学習者は不正解時に即座に関連する構造化インプット教材へ誘導され、「なぜ間違えたか」「正しい結論は何か」をその場で確認し、知識の穴を効率的に埋めることが可能になった。

## 実施内容
- **Repair Matcher の実装**:
  - `src/utils/inputUnitRepairMatcher.ts` を新設。
  - 誤答イベントの `tags` や `category` を基に、最適な補修用 Input Unit を特定するロジックを構築。
  - 法的根拠（`source_trace`）を持たない Unit や、品質フラグ（`needs_human_review`）のある Unit を除外する安全制約を実装。
- **Repair Preview UI の実装**:
  - `src/components/learning/RepairPreview.tsx` を新設。
  - 誤答後、画面を切り替えずに「正しい結論」「ひっかけポイント」「補修アドバイス」をダイジェスト表示。
  - 理解度を即座に再確認するための「1問再確認（recheck_question）」機能を統合。
- **ActiveRecall への最小接続**:
  - `ActiveRecallView.tsx` の誤答ハンドラを拡張。
  - 不正解時に `RepairPreview` を表示し、正解時は従来のフローを維持する分岐ロジックを実装。
  - 学習フローを阻害しないよう、`RepairPreview` の表示エラーは捕捉され、セッションが停止しないことを保証。
- **監査機能の強化**:
  - `db-audit.html` に「🔄 P42 Repair Loop (補修インプット) 監査」セクションを追加。
  - 補修インプットの対象となる Unit 数、法的根拠の充足状況、および `auto_apply` との未接続状態を監視可能にした。

## 結果 (実測値)
- **補修対象 Unit**: 3件 (宅建業法プロトタイプ)
- **Matcher 成功率**: 100% (対象タグを持つカードの誤答時に、対応する Unit を正確に捕捉)
- **Repair 表示**: 正常 (誤答後に `RepairPreview` がモーダル表示されることを確認)
- **Build 結果**: PASS
- **Schema 整合性**: FULL_SYNC (v24) 維持

## 動作確認
- 30問標準セッションにおいて、宅建業法（媒介契約、重説、37条）の問題で意図的に誤答し、対応する補修インプットが表示されることを物理確認。
- `RepairPreview` から Input Unit の全体像（Viewer）へ正常に遷移できることを確認。
- 既存の学習機能（Focus Mode, 35問集中）、`weak_score_delta` 表示、Dashboard レイアウトへの影響がないことを回帰確認。

## P43 (次フェーズ) への課題
- Repair Loop の対象モード拡張（MemoryRecall, TrapRecall 等）。
- 宅建業法における Input Unit の拡充（クーリングオフ、報酬額等）。
- 「1問再確認」の結果を FSRS にフィードバックするロジックの検討。

## 判定
**A. MemoryRecall P42 Repair Loop 実装OK**
「間違えたら、その場で理解し直す」という理想的な学習サイクルが、最小単位で実現された。アウトプットとインプットが初めて動的に接続され、学習 OS としての完成度が大きく向上した。
