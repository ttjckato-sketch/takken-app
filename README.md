# 宅建学習アプリ v2.1.1 Stable Patch

[![Deploy GitHub Pages](https://github.com/ttjckato-sketch/takken-app/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttjckato-sketch/takken-app/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

宅建（宅地建物取引士）および賃貸不動産経営管理士の資格取得を支援するための、ブラウザ完結型学習アプリケーションです。

## 公開URL
**[https://ttjckato-sketch.github.io/takken-app/](https://ttjckato-sketch.github.io/takken-app/)**

最新リリース: [v2.1.1](https://github.com/ttjckato-sketch/takken-app/releases/tag/v2.1.1)

---

## Development Status: v2.1.1 Stable Patch

本プロジェクトは **v2.1.1 Stable Patch** です。v2.1.0 Stable をベースに、非破壊的なデータ監査機能（Category Sidecar Review）が追加されました。

### 🚀 Data Audit Status (Category Sidecar Review)
- **Category Suggestion**: カテゴリ不整合が疑われる 14件のデータに対し、法的キーワードに基づく「修正案」を自動提示。
- **Evidence-Based**: なぜそのカテゴリが提案されたか、根拠となるキーワード（Evidence Keywords）を詳細パネルで確認可能。
- **Data Recovery**: 以前のバッチ（Batch-1/2/3）で救済された累計 200件の状況をより詳細に監査可能になりました。

### 🛡️ Backup & Safety (v2.1.x Line)
- **JSON Export (v1)**: IndexedDB内の全学習資産（履歴含む）をJSONでバックアップ可能。
- **Import Validator**: バックアップJSONの整合性を書き込みなしで検証（Dry-run）。
- **Safety Policy**: 本パッチは「読み取り専用」の監査機能を主としており、既存の学習データや履歴を直接変更・上書きすることはありません。

### 🛠️ Admin & Inspection Tools
- **Data Explorer (Read-Only)**: 除外カード、除外理由、復元メタデータ、およびカテゴリ修正案の確認。
- **DB Audit Dashboard**: 復元統計およびカテゴリ不整合サマリーの確認（`db-audit.html`）。

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

```bash
# 1. 依存関係のインストール
npm install
# 2. 開発サーバーの起動
npm run dev
# 3. プロダクションビルド
npm run build
```

## Deployment

GitHub Pages で公開されています。GitHub Actions により、master ブランチへの push 時点で自動デプロイされます。

## 注意事項

- **Read-Only Implementation**: カテゴリの修正提案はあくまで「提案」であり、現時点では自動適用（Apply）機能は含まれていません。
- **Known Limitations**: バックアップのインポートは現在検証（Dry-run）のみに対応しており、実DBへの書き戻しは未実装です。
- **免責事項**: 本アプリは学習支援を目的としており、法的正確性を完全に保証するものではありません。法令の最終確認は、必ず公的資料・法令データ提供システムをご参照ください。

## ライセンス

本ソフトウェアは **MIT License** の下で公開されています。

Copyright (c) 2026 hiroto katou
