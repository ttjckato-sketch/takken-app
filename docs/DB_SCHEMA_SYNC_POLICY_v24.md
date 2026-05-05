# DB Schema Sync Policy v24

**Effective Date**: 2026-05-01
**DB Schema Version**: 24
**Status**: ENFORCED

## SSOT Rule (Single Source of Truth)

**src/db.ts は DB schema の唯一の正本（SSOT）である。**

- TakkenDatabase class の version(X).stores({...}) が定義
- 全てのテーブル定義とindex定義は src/db.ts に集約
- DB version を変更する場合は、まず src/db.ts を修正する

## public HTML 同期ルール

以下のファイルは src/db.ts と同じ DB schema を定義しなければならない：

1. **public/db-audit.html**
   - `CURRENT_DB_VERSION` 定数を src/db.ts の version と同期
   - stores({...}) 定義を src/db.ts と完全に一致させる

2. **public/activerecall-test.html**
   - `CURRENT_DB_VERSION` 定数を src/db.ts の version と同期
   - stores({...}) 定義を src/db.ts と完全に一致させる

## 同期手順

src/db.ts の DB version を更新する場合：

1. src/db.ts の version(X) を更新
2. public/db-audit.html の CURRENT_DB_VERSION を更新
3. public/db-audit.html の stores({...}) を同期
4. public/activerecall-test.html の CURRENT_DB_VERSION を更新
5. public/activerecall-test.html の stores({...}) を同期
6. `npm run build:clean` 実行
7. dist/db-audit.html の version を確認
8. dist/activerecall-test.html の version を確認

## dist 同期確認

build:clean 後、必ず以下を確認する：

```bash
# dist/db-audit.html 確認
grep "CURRENT_DB_VERSION" dist/db-audit.html
grep "db.version(" dist/db-audit.html

# dist/activerecall-test.html 確認
grep "CURRENT_DB_VERSION" dist/activerecall-test.html
grep "db.version(" dist/activerecall-test.html
```

## 禁止事項

### ❌ public側の古いHTML放置
- publicDir は build時に dist へコピーされる
- public側の古い version を放置すると、dist に古いHTMLがコピーされる
- public/db-audit.html と public/activerecall-test.html は常に最新を維持する

### ❌ DB削除で成功扱い
- 既存DBを削除して VersionError を「解決」扱いにしない
- 既存DB v240 が残った状態で、新しい schema で開けることを確認する

### ❌ version だけ同期して stores を古いままにする
- version(X) を上げて、stores({...}) が古いままは禁止
- 必ず version と stores の両方を同期する

## VersionError 発生時の調査

VersionError が発生した場合、以下を記録する：

1. requested version（HTML側で要求したversion）
2. existing version（ブラウザDBの実際のversion）
3. エラーが発生したファイルパス
4. エラーが発生した行番号
5. stack trace

## 現行状態 (v24)

| 項目 | 値 |
|-----|---|
| src/db.ts version | 24 |
| public/db-audit.html CURRENT_DB_VERSION | 24 |
| public/activerecall-test.html CURRENT_DB_VERSION | 24 |
| dist/db-audit.html version | 24 |
| dist/activerecall-test.html version | 24 |
| tables count | 22 |
| schema_sync_status | FULL_SYNC |
| VersionError | 0 |

## drift_guard

public HTML には以下のコメントを追加済み：

```javascript
const CURRENT_DB_VERSION = 24; // SSOT: src/db.ts TakkenOS_DB schema version
// Must match src/db.ts version(X).stores
// If src/db.ts version changes, update this audit HTML schema too.
```

このコメントにより、次回 src/db.ts を更新する際に public 側も更新することを忘れないようにする。
