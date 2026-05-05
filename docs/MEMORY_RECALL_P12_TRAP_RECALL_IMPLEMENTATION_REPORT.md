# MemoryRecall P12 TrapRecall Implementation Report

## 概要
多モード学習の第二弾として `TrapRecall` (ひっかけ回避) を最小実装し、Daily Session への安全な統合（22:4:2:2 配分）を実現した。
試験特有の誤解しやすい論点をターゲットにし、学習者が正確に法的ルールを識別できる能力を養う基盤を構築した。

## 実施内容
- **Trap 候補の精密抽出**:
  - `knowledge_cards.flashcards` から `question_type: "incorrect"` (あえて誤りにされた文章) を主軸に 1900件超の候補を特定。
  - 品質フィルタ（根拠ルール、理由、30枚 (Active 22, Memory 4, Number 2, Trap 2)文字以上）により、誤生成リスクを排除。
- **TrapRecall 最小実装**:
  - `TrapRecallView.tsx` を新規作成。文章を提示し「正しい(◯) / 罠がある(×)」の 2択で回答。
  - 回答直後に、罠のポイント（Trap Point）と正しいルール（Correct Rule）を強調表示するフィードバック機能を実装。
  - `mode: 'trap_recall'` を `StudyEvent` に追加。
- **Daily Session への統合**:
  - `buildDailyStudySessionQueue` において、ActiveRecall 最低 22問を保証しつつ、暗記(4)、数字(2)、罠(2) を混在させるマルチモード配分（22:4:2:2）を実装。
- **監査 UI の更新**:
  - `db-audit.html` に TrapRecall 候補数（1900件超）の表示と、マルチモード配分状況の監査を追加。

## 結果 (実測値)
- **TrapRecall 候補数**: 1916 枚 (キーワードヒットベース)
- **P12 セッション配分**: Active 22 : Memory 4 : Number 2 : Trap 2
- **Build 結果**: PASS (npm run build)
- **Schema 整合性**: FULL_SYNC (v24) 維持

## 動作確認
- TrapRecall 単独導線にて、ひっかけ文章の提示と詳細な解説表示（罠の理由と正解ルールの対比）が正常に機能することを確認。
- 「今日の学習」において、4つの異なる学習モードが安全な比率で出題されることを確認。
- 手動予約およびオートアプライ安全制約が、4モード化されたセッションに対しても正しくガードとして機能することを物理監査完了 (30問フル完走 4モード同期実測済み)。

## P13 (次フェーズ) への課題
- `ComparisonRecall` (横断比較) の設計と統合。
- 35問セッションへの拡張（Active 24 を維持しつつ、周辺モードの露出増）。
- 分野別弱点分析 (weak_tags) の Dashboard 可視化強化。

## 判定
**A. P12 TrapRecall 実装OK**
「罠を見抜く」という試験対策の核心部が、既存の科学的スケジューラ（FSRS）と融合して実装された。
