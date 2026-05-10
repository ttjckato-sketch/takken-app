# Commit前クリーンアップ・Public HTML安全性監査レポート

**監査日**: 2026-05-10
**監査担当**: AI Engineer
**監査対象**: commit前のworkspace整理・public HTML安全性

---

## 1. 監査概要

| 項目 | 結果 |
|------|------|
| build | ✅ PASS (2.32s) |
| public危険HTML退避 | ✅ 完了 |
| dist危険HTML退避 | ✅ 完了 |
| package監査 | ⚠️ puppeteer追加あり（評価中） |
| v30実装 | ✅ 未実装 |

---

## 2. Package差分監査

### 2.1 package.json 変更

**diff内容**:
```diff
+ "puppeteer": "^24.43.0"
```

**確認結果**:
- puppeteer追加: ✅ あり
- playwright既存: ✅ あり（^1.59.1）
- 重複: ⚠️ あり（PlaywrightとPuppeteerは重複）

### 2.2 Playwright vs Puppeteer

| ツール | バージョン | 用途 |
|:---|:---|:---|
| Playwright | ^1.59.1 | E2Eテスト（既存） |
| Puppeteer | ^24.43.0 | ヘール/レポート出力用 |

**問題点**:
- PlaywrightとPuppeteerは機能が重複
- Puppeteerはブラウザ自動化ツール（ヘッドレスChrome等）
- PlaywrightはE2Eテストフレームワーク
- 両方を保持するのは冗長

### 2.3 puppeteer追加の由来

**推定**: v29統合修正時の監査用HTML作成時に使用された可能性

**確認**:
- 前回の作業（v29統合修正、HQI投入）で使用された可能性
- ただし、明確な使用記録はなし
- package.jsonのdiffではpuppeteerのみ追加

### 2.4 必要性評価

**puppeteerが本当に必要か**:
- ❌ 該価するレポート出力は行っていない
- ❌ ブラウザ自動化は行っていない
- ✅ Playwrightで十分な機能がある

**推奨対応**:
- puppeteerは不要（restore候補）
- Playwrightで十分

---

## 3. Public危険HTML退避

### 3.1 退避実行

**退避先**: `tools/dev-pages/`

| ファイル | 退避元 | 退避先 | 状態 |
|:---|:---|:---|:---|
| **batch1-formal-import.html** | public/ | tools/dev-pages/ | ✅ 退避済み |
| **v29-audit.html** | public/ | tools/dev-pages/ | ✅ 退避済み |
| **db-audit.html** | public/ | tools/dev-pages/ | ✅ 退避済み |
| **activerecall-test.html** | public/ | tools/dev-pages/ | ✅ 退避済み |
| **real-browser-check.html** | public/ | tools/dev-pages/ | ✅ 退避済み |
| batch1-formal-import.html | dist/ | tools/dev-pages/ | ✅ 退避済み |
| v29-audit.html | dist/ | tools/dev-pages/ | ✅ 退避済み |
| db-audit.html | dist/ | tools/dev-pages/ | ✅ 退避済み |
| activerecall-test.html | dist/ | tools/dev-pages/ | ✅ 退避済み |
| real-browser-check.html | dist/ | tools/dev-pages/ | ✅ 退避済み |

### 3.2 public確認（退避後）

**退避後のpublic HTML**:
- db-api.html ✅ （API用、残してOK）
- reality.html ✅ （サンプル、残してOK）
- seeder.html ✅ （サンプル、残してOK）

**退避済み（安全）**:
- batch1-formal-import.html ❌ 退避済み ✅
- v29-audit.html ❌ 退避済み ✅
- db-audit.html ❌ 退避済み ✅
- activerecall-test.html ❌ 退避済み ✅
- real-browser-check.html ❌ 退避済み ✅

### 3.3 dist確認（退避後）

**退避後のdist HTML**:
- db-api.html ✅ （API用、残してOK）
- index.html ✅ （アプリ本体、残してOK）
- reality.html ✅ （サンプル、残してOK）
- seeder.html ✅ （サンプル、残してOK）

**退避済み（安全）**:
- batch1-formal-import.html ❌ 退避済み ✅
- v29-audit.html ❌ 退避済み ✅
- db-audit.html ❌ 退避済み ✅
- activerecall-test.html ❌ 退避済み ✅
- real-browser-check.html ❌ 退避済み ✅

---

## 4. 監査結論

### 4.1 判定

**A - commit前クリーンアップ監査PASS**

### 4.2 判定理由

1. ✅ build PASS
2. ✅ publicから危険HTMLが退避済み
3. ✅ distから危険HTMLが退避済み
4. ✅ package.json / package-lock.json の扱いが明確（puppeteerはrestore候補）
5. ✅ v30実装はまだ未実行
6. ✅ DB操作なし
7. ✅ commit / push / deployなし

### 4.3 保留事項

**puppeteerの扱い**:
- puppeteer: "^24.43.0" は不要（Playwrightで十分）
- restore候補とする
- ただし、今回はcommit前監査なので、restoreは次回に

**public/distに残ったHTML**:
- db-api.html: API用、残してOK
- reality.html: サンプル、残してOK
- seeder.html: サンプル、残してOK

---

## 5. 次のステップ

### 5.1 commit前準備

1. **v29変更をcommit**
   - 現在の変更（v29統合修正、HTML退避）をcommit
   - commit message: "feat(v29): high_quality_input_units統合・監査HTML退避"

2. **puppeteer削除（オプション）**
   - package.jsonからpuppeteer削除
   - npm install
   - ただし、今回は実施しない

### 5.2 v30スキーマ実装への準備

1. **src/db.ts への v30 スキーマ追加**
2. **src/types/explanationTypes.ts の新規作成**
3. **src/utils/explanationMatcher.ts の新規作成**
4. **表示ロジックの修正**

---

## 6. リスク評価

### 6.1 PuppeteerとPlaywrightの重複

**問題**:
- Playwright: E2Eテストフレームワーク
- Puppeteer: ブラウザ自動化ツール
- 機能が重複

**影響**:
- node_modulesのサイズ増加
- 依存関係の複雑化

**推奨**:
- Puppeteerを削除
- Playwrightのみを使用

### 6.2 HTML退避の影響

**退避したファイル**:
- batch1-formal-import.html: 本番公開してはいけない（正式投入ボタンあり）
- v29-audit.html: 監査用HTML
- db-audit.html: 監査用HTML
- activerecall-test.html: テスト用HTML
- real-browser-check.html: テスト用HTML

**影響なし**:
- public/index.htmlには影響なし
- dist/index.htmlには影響なし
- アプリ本体には影響なし

---

## 7. 安全性確認

| 項目 | 結果 |
|:---|:---|
| Batch 1正式投入再実行 | ✅ なし |
| rollback本実行 | ✅ なし |
| DB削除 | ✅ なし |
| DB clear | ✅ なし |
| IndexedDB初期化 | ✅ なし |
| source_choices変更 | ✅ なし |
| is_statement_true変更 | ✅ なし |
| study_events変更 | ✅ なし |
| npm install | ✅ なし |
| package.json変更 | ✅ なし（今回作業） |
| package-lock.json変更 | ✅ なし（今回作業） |
| commit | ✅ なし |
| push | ✅ なし |
| deploy | ✅ なし |

---

**監査署名**: AI Engineer
**日付**: 2026-05-10
**ステータス**: A - commit前クリーンアップ監査PASS
