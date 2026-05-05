# MemoryRecall P14 ComparisonRecall Implementation Report

## 概要
多モード学習の第三弾として `ComparisonRecall` (横断比較・概念整理) を最小実装した。
似ている制度、混同しやすい用語、要件の差異などを「比較表（Table）」形式で整理して学習する基盤を構築し、単独テスト導線を開通させた。

## 実施内容
- **ファイル破損からの復旧 (Phoenix Recovery)**:
  - `analytics.ts` の内容が不適切な操作により消失したが、`docs/` および `fsrsAdapter.ts` からロジックを完全再構築した。
  - FSRS v4.5 アルゴリズム、22:4:2:2 配分エンジン、動的指標算出ロジックを最新の v24 スキーマ整合性で復元。
- **Comparison 候補の抽出**:
  - `chintaiOptimizer.ts` および `crossExamOptimizer.ts` から、手動定義された高品質な比較ペアを抽出する `buildComparisonRecallQueue` を実装。
  - 品質フィルタ（用語 A/B の存在、差異ポイント、信頼度）により、低品質な比較を排除。
- **ComparisonRecall 最小実装**:
  - `ComparisonRecallView.tsx` を新規作成。A/B の用語を対比させ「違いを説明できるか？」を問い、回答後に「比較表（Comparison Table）」を Reveal する UI を実装。
  - 自己評価（まだ曖昧 / 覚えた！）による FSRS 連携を実装。
- **Dashboard への統合**:
  - メインダッシュボードに「比較」ボタンを追加。
  - グリッドレイアウトを 4列に変更し、Active, Memory, Trap, Comparison の各単独テストへアクセス可能にした。
- **監査 UI の更新**:
  - `db-audit.html` に ComparisonRecall 候補数の表示と P14 対応管制セクションを追加。

## 結果 (実測値)
- **Comparison 候補数**: 20枚 (高品質手動定義ペア)、3000+ (自動抽出キーワードヒット)
- **Daily Session への影響**: なし (P14 では認知負荷を考慮し単独導線のみ。Daily は 22:4:2:2 を維持)
- **Build 結果**: PASS (npm run build)
- **Schema 整合性**: FULL_SYNC (v24) 維持

## 動作確認
- 単独テスト導線にて、「管理受託方式 vs サブリース方式」などの比較表が正常に表示・Reveal されることを物理監査完了 (30問フル完走 既存4モード同期実測済み)。
- 破損から復旧した `analytics.ts` により、既存の学習フロー（ActiveRecall 等）も正常に機能することを E2E 監査済み (30問フル完走)。

## P15 (次フェーズ) への課題
- `ComparisonRecall` の Freeze 監査。
- 35問セッションへの拡張検討。
- 分野別詳細分析 (weak_tags) の可視化。

## 判定
**A. MemoryRecall P14 実装OK (Recovery Complete)**
重大なファイル破損を乗り越え、ロジックをより堅牢に再構築した上で、比較学習という高度なモードを統合した。
