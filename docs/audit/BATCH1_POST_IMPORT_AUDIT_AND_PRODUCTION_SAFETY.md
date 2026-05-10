# Batch 1 投入後監査および本番公開前安全化レポート

## 1. 投入後DB監査結果
- **db_version**: 29
- **high_quality_input_units_count**: 20 (期待: 20)
- **source_questions_chintai**: 500
- **source_choices_chintai**: 2000
- **source_questions_takken**: 1024
- **source_choices_takken**: 1024
- **study_events_readable**: true

## 2. 投入データサンプル確認
Batch 1 の high_quality_input_units データについて以下を確認しました。
- `batch_id`: "batch1"
- `source_trace_grade`: "A"
- `review_status`: "auto_ok"
- `disabled`: false
- `source_url`, `source_title`, `comparison`, 用語補助 (glossary/why/trap等) : 漏れなく登録されています

## 3. UI連携確認
- アプリおよび ActiveRecall が正常に起動することを確認
- 誤答時に RepairPreview / QuestionUnderstandingAid が表示され、Batch 1 論点に紐づく補修 Input が参照されることを確認
- 回答後に `study_events` が正しく増加することを確認

## 4. Rollback Dry-run 投入後確認
- **rollback_dry_run_executed**: true
- **rollback_target_count_after_import**: 20件 (Batch 1分)
- **rollback_executed**: false (本実行は行わず、dry-runのみで安全を確認)

## 5. 本番公開前安全化方針

以下のファイルは本番環境 (GitHub Pages 等) へデプロイされると、第三者からのアクセスやDB改変（正式投入等）を引き起こすリスクがある、あるいは内部スキーマを漏洩する懸念があります。

### 危険HTML一覧
1. `batch1-formal-import.html` (DB書込権限あり・非常に危険)
2. `v29-audit.html` (DBスキーマ漏洩)
3. `db-audit.html` (DBスキーマ漏洩)
4. `v28-audit.html` (DBスキーマ漏洩)
5. `activerecall-test.html` (開発用テストツール)
6. `real-browser-check.html` (開発用テストツール)
7. `question-understanding-test.html` (開発用テストツール)

### 推奨アクション (未実行)
次回デプロイ作業を実施する前に、上記の全ファイルを `public/` ディレクトリから、ビルド対象外である `tools/dev-pages/` などのディレクトリへ退避することを推奨します。本レポート提出時点では、ユーザーの明示的な許可前のためファイルの移動は行っていません。
