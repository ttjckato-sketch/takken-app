# Release Snapshot: Golden Build v24

**Build Timestamp**: 2026-05-01
**Commit Hash**: a077ed407
**Branch**: master
**Node Version**: v24.12.0
**NPM Version**: 11.6.2

## Build Status

| 項目 | 結果 |
|-----|------|
| build_clean_result | PASS |
| dist_exists | YES |
| dist_db_audit_version | 24 |
| dist_activerecall_test_version | 24 |
| dist_schema_sync_status | FULL_SYNC (22 tables) |
| DB schema version | 24 |
| enhanced_explanation_version | EE-V2 Grounded |
| PWA status | DISABLED |

## VersionError / Console / Network

| 項目 | 結果 |
|-----|------|
| VersionError (4173) | 0 |
| VersionError (4180) | 0 |
| Console error (4173) | 0 |
| Console error (4180) | 0 |
| Network 404 (4173) | 0 |
| Network 404 (4180) | 0 |
| Network failed (4173) | 0 |
| Network failed (4180) | 0 |
| assets_loaded | YES |

## Fresh DB 実測値

| 項目 | 結果 |
|-----|------|
| fresh_profile_used | YES (シークレット) |
| fresh_metadata_import_status | success |
| fresh_knowledge_cards | 4269 |
| fresh_understanding_cards | 4269 |
| fresh_source_questions_chintai | 500 |
| fresh_source_choices_chintai | 2000 |
| fresh_source_questions_takken | 934 |
| fresh_source_choices_takken | 934 |
| fresh_enhanced_explanations | 3047 |
| fresh_memory_cards | 0 |
| fresh_recovered_learning_assets | 0 |
| fresh_study_events | 0 |
| fresh_study_sessions | 0 |
| fresh_console_error_count | 0 |
| fresh_version_error_count | 0 |
| fresh_network_404_count | 0 |
| fresh_network_failed_count | 0 |

## 10問以上操作実測値

| 項目 | 結果 |
|-----|------|
| activerecall_test_loaded | YES |
| before_study_events | 0 |
| after_study_events | 11 |
| inserted_events | 11 |
| minimum_required_inserted_events | 10 |
| operation_result | PASS |
| latest_study_event_mode | active_recall |
| latest_study_event_has_card_id | YES |
| latest_study_event_has_answered_correct | YES |
| latest_study_event_has_created_at | YES |
| grounded_explanation_visible | YES |
| supplemental_after_answer_only | YES |
| suspended_appeared | 0 |
| console_error_count | 0 |
| version_error_count | 0 |
| network_404_count | 0 |

## 判定

**A. Golden Build再判定OK**

## Known Caveats

### 1. fresh_source_questions_takken = 934
過去に 1026 / 1044 などの数値が出ていた可能性がある。現行v24の安全フィルタ条件で934に絞られているならOK。ただし、意図した値かは次フェーズで確認する。

### 2. fresh_memory_cards = 0 / fresh_recovered_learning_assets = 0
初回importでは生成されず、最適化エンジン実行後に生成される仕様ならOK。もしGolden Buildで多モード学習を初期状態から使う想定なら、次フェーズで確認が必要。

## Working Tree Status

- working_tree_clean: NO
- modified_files_count: 4096

未commitの変更があるが、Golden Buildのビルド成果物（dist）とDB schema v24同期は完了している。

## 次フェーズ

**PHASE_NEXT_ASSET_GENERATION_SPEC_CHECK**

目的:
- memory_cards / recovered_learning_assets が Fresh DBで0件なのは仕様か不具合かを判定する
- 初期importで生成すべきか、最適化エンジンボタン実行後に生成すべきかを明確化する

確認事項:
- memory_cards は初期import対象か
- recovered_learning_assets は初期import対象か
- processKnowledgeOptimization() 実行後に生成されるのか
- 多モード学習は memory_cards 0 の状態でも成立するのか
- ActiveRecall中心のGolden BuildとしてはOKか
- MemoryRecall / NumberRecall / TrapRecall / ComparisonRecall を本番投入するには追加生成が必要か
