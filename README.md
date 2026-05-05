# 宅建学習アプリ v2.1.0 Stable

[![Deploy GitHub Pages](https://github.com/ttjckato-sketch/takken-app/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttjckato-sketch/takken-app/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

宅建（宅地建物取引士）および賃貸不動産経営管理士の資格取得を支援するための、ブラウザ完結型学習アプリケーションです。

## 公開URL
**[https://ttjckato-sketch.github.io/takken-app/](https://ttjckato-sketch.github.io/takken-app/)**

最新リリース: [v2.1.0](https://github.com/ttjckato-sketch/takken-app/releases/tag/v2.1.0)

---

## Development Status: v2.1.0 Stable

本プロジェクトは **v2.1.0 Stable** リリースです。alpha/beta フェーズを経て、データ復元パイプライン、データ保護基盤、およびデータ透明性が強化されました。

### 🚀 Data Recovery Status (累計 200件復元済)
- **Batch-1 (Deterministic)**: 100件の高品質規定を復元
- **Batch-2 (Explanation Signal)**: 50件の解説文解析による救済
- **Batch-3 (Placeholder v2)**: 50件の境界値救済（合計 200件）
- **Safety**: 既存カードの上書きなし、学習履歴の完全保持、サイドカーID方式を採用

### 🛡️ Backup & Safety
- **JSON Export (v1)**: IndexedDB内の全データをJSONでバックアップ可能
- **Import Validator**: バックアップJSONの整合性を書き込みなしで検証（Dry-run）
- **Read-Only**: 全ての管理ツールは安全のため読み取り専用または非破壊操作に限定されています

### 🛠️ Admin & Inspection Tools
- **Data Explorer (Read-Only)**: 除外カード、除外理由、復元メタデータの詳細確認
- **DB Audit Dashboard**: 復元パイプラインの実行と統計確認（`db-audit.html`）

---

## 主な機能

- **ActiveRecall**: 定期的な復習を促すメインの学習モード。FSRS (Free Spaced Repetition Scheduler) アルゴリズムをベースとした間隔反復学習を提供します。
- **RepairPreview**: 誤答した問題に対し、構造化された解説（Input Unit）を動的に提示し、弱点補強を行います。
- **MemoryRecall**: 重要数値を記憶するための専用ドリル機能です。
- **Weakness (弱点克服)**: 過去の正答率や最新の学習イベントから、重点的に学習すべき論点を抽出して出題します。
- **Comparison (比較学習)**: 似て非なる論点（例: 開発許可と建築確認、35条書面と37条書面など）を並べて比較・記憶するためのモードです。

## 技術スタック

- **Frontend**: React + TypeScript + Vite
- **Storage**: IndexedDB (Dexie.js)
- **Styling**: Tailwind CSS

## 特徴：プライバシーと速度

- **サーバー不要**: すべての処理はブラウザ内で完結します。
- **データはローカル保存**: 学習履歴や設定はブラウザの IndexedDB に保存され、外部サーバーに送信されることはありません。
- **高速動作**: ローカルDBを活用しているため、オフラインに近い感覚で高速に動作します。

## セットアップ手順（開発者向け）

本アプリケーションはNode.js環境（v18以上推奨）で動作します。

```bash
# 1. 依存関係のインストール
npm install

# 2. 開発サーバーの起動
npm run dev

# 3. プロダクションビルド
npm run build

# 4. プロダクションビルドのローカルプレビュー
npm run preview
```

## Deployment

GitHub Pages で公開されています。GitHub Actions により、master ブランチへの push 時点で自動デプロイされます。

## 注意事項

- **Known Limitations**: 本バージョンでは一部のカテゴリ不整合が疑われるデータ（14件）を意図的に学習対象から除外しています。また、バックアップのインポートは現在検証（Dry-run）のみに対応しています。
- **APIキーは不要**: 本アプリケーションはコア機能において外部のAPI（OpenAI, Gemini等のLLM）キーを要求しません。
- **免責事項**: 本アプリはあくまで「学習支援」を目的としたツールです。収録されている法令データや解説内容の正確性については万全を期しておりますが、法改正等により内容が古くなる場合があります。実務における法令の最終確認は、必ず国土交通省等の公的資料・法令データ提供システムをご参照ください。

## ライセンス

本ソフトウェアは **MIT License** の下で公開されています。詳細は [LICENSE](./LICENSE) ファイルを参照してください。

Copyright (c) 2026 hiroto katou
