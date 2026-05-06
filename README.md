# TAKKEN OS (宅建学習アプリ) v3.6.2 Gold Stable

[![Deploy GitHub Pages](https://github.com/ttjckato-sketch/takken-app/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttjckato-sketch/takken-app/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

宅建（宅地建物取引士）および賃貸不動産経営管理士の資格取得を、脳科学と実務シミュレーションで支援するブラウザ完結型学習アプリケーションです。

## 公開URL
**[https://ttjckato-sketch.github.io/takken-app/](https://ttjckato-sketch.github.io/takken-app/)**

最新リリース: [v3.6.2](https://github.com/ttjckato-sketch/takken-app/releases/tag/v3.6.2)

---

## 🚀 主な機能

- **ActiveRecall (FSRS 5.0)**: 科学的な間隔反復学習。忘却曲線に基づき最適な復習タイミングを管理。
- **Reality Projection**: 35条重要事項説明等の実務書類と学習知識をリンクさせた実務シミュレーター。
- **RepairPreview**: 誤答時に構造化解説（Input Unit）を即座に提示。
- **MemoryRecall**: 重要数値やキーワードの暗記に特化したドリル。
- **Comparison Learning**: 似た概念（例: 35条 vs 37条）を対比して整理。
- **AI Salvage (Admin)**: 学習データの品質管理と破損データの救済・監査。

## 🎓 Learning Quality Audit (v3.6.2+)

本アプリでは、技術的な安定性だけでなく、宅建・賃貸管理の学習教材としての品質を継続的に監査しています。

- **Coverage Map**: 公式出題範囲（業法、権利、制限、税、管理実務等）に基づく網羅性チェック。
- **Quality Scoring**: カードごとに 100 点満点で品質をスコアリング（解説の長さ、前提知識、実務リンク、根拠法令の有無）。
- **Weak Point Detection**: 改善が必要なカード（スコア 60 未満）を自動抽出し、Data Explorer でフィルタリング。
- **Audit Tool**: `db-audit.html` にて学習品質レポートの生成と JSON ダウンロードが可能。

---

## 🛠️ 技術スタック

- **Frontend**: React + TypeScript + Vite
- **Algorithm**: FSRS 5.0 (Free Spaced Repetition Scheduler)
- **Storage**: IndexedDB (Dexie.js)
- **Styling**: Vanilla CSS + Tailwind CSS
- **Icons**: Lucide React

## 🛡️ セキュリティ・プライバシー

- **サーバー不要**: すべての処理はブラウザ内で完結します。
- **データはローカル保存**: 学習履歴や設定はブラウザの IndexedDB に保存され、外部サーバーに送信されることはありません。

## セットアップ手順（開発者向け）

```bash
# 1. 依存関係のインストール
npm install
# 2. 開発サーバーの起動
npm run dev
# 3. プロダクションビルド
npm run build
```

## 注意事項

- **免責事項**: 本アプリは学習支援を目的としており、法的正確性を完全に保証するものではありません。法令の最終確認は、必ず公的資料・法令データ提供システムをご参照ください。

## ライセンス

本ソフトウェアは **MIT License** の下で公開されています。

Copyright (c) 2026 ttjckato-sketch
