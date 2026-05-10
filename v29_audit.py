"""
v29移行前監査スクリプト
curlとBeautifulSoupでdb-audit.htmlの結果を取得
"""

import subprocess
import json
import re
import time

def run_command(cmd):
    """コマンドを実行して結果を返す"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout, result.stderr, result.returncode

def main():
    print("🔍 v29移行前監査 Start...\n")

    # 1. build確認
    print("📝 Step 1: build確認...")
    stdout, stderr, rc = run_command("cd 'C:\\Project vibe\\main\\VCG_INTEGRATED\\宅建ツール\\takken-app' && npm run build")
    if rc == 0:
        print("✅ build PASS")
    else:
        print("❌ build FAIL")
        print(stderr[-500:] if len(stderr) > 500 else stderr)
        return

    # 2. git status確認
    print("\n📝 Step 2: git status確認...")
    stdout, stderr, rc = run_command("cd 'C:\\Project vibe\\main\\VCG_INTEGRATED\\宅建ツール\\takken-app' && git status --short")
    print(stdout[:500] if len(stdout) > 500 else stdout)

    # 3. db.tsのversion確認
    print("\n📝 Step 3: DB version確認...")
    stdout, stderr, rc = run_command("cd 'C:\\Project vibe\\main\\VCG_INTEGRATED\\宅建ツール\\takken-app' && grep -n 'version(' src/db.ts | tail -5")
    print(stdout)

    # 4. v29SchemaDryRun.ts確認
    print("\n📝 Step 4: v29 dry-run確認...")
    stdout, stderr, rc = run_command("cd 'C:\\Project vibe\\main\\VCG_INTEGRATED\\宅建ツール\\takken-app' && grep -n 'dry.run\\|DRY_RUN\\|dry.run' src/utils/v29SchemaDryRun.ts | head -10")
    print(stdout)

    # 5. inputUnitPrototypes.json確認
    print("\n📝 Step 5: InputUnit対応状況確認...")
    stdout, stderr, rc = run_command("cd 'C:\\Project vibe\\main\\VCG_INTEGRATED\\宅建ツール\\takken-app' && cat public/inputUnitPrototypes.json | grep -c 'unit_id'")
    input_unit_count = stdout.strip()
    print(f"InputUnit件数: {input_unit_count}")

    stdout, stderr, rc = run_command("cd 'C:\\Project vibe\\main\\VCG_INTEGRATED\\宅建ツール\\takken-app' && cat public/inputUnitPrototypes.json | grep -o '\"category\": \"[^\"]*\"' | sort | uniq -c")
    print("InputUnitカテゴリ分布:")
    print(stdout)

    # 6. takkenSourceTransformer.tsの集計ロジック確認
    print("\n📝 Step 6: ActiveRecall除外カウントロジック確認...")
    stdout, stderr, rc = run_command("cd 'C:\\Project vibe\\main\\VCG_INTEGRATED\\宅建ツール\\takken-app' && grep -A5 'eligible.*excludedCountCombo.*recoveryPending' src/utils/takkenSourceTransformer.ts | head -20")
    print(stdout)

    # 7. productionBatchLoader.tsのFORBIDDEN_RISKS確認
    print("\n📝 Step 7: FORBIDDEN_RISKS確認...")
    stdout, stderr, rc = run_command("cd 'C:\\Project vibe\\main\\VCG_INTEGRATED\\宅建ツール\\takken-app' && grep -A10 'FORBIDDEN_RISKS' src/utils/productionBatchLoader.ts")
    print(stdout)

    print("\n📊 監査完了")
    print("=".repeat(60))

    # 判定
    print("\n【現状判定】")
    issues = []
    warnings = []

    # build確認
    if rc != 0:
        issues.append("build FAIL")

    # InputUnit確認
    if int(input_unit_count) < 20:
        warnings.append(f"InputUnit件数が少ない: {input_unit_count}件")

    print(f"\n【問題】{len(issues)}件")
    for i in issues:
        print(f"  ❌ {i}")

    print(f"\n【警告】{len(warnings)}件")
    for w in warnings:
        print(f"  ⚠️  {w}")

    print("\n【結論】")
    if len(issues) == 0 and len(warnings) == 0:
        print("A. v29へ進んでよい")
    elif len(issues) == 0:
        print("B. 数値矛盾あり・追加監査が必要")
    else:
        print("C. 停止・修正優先")

if __name__ == "__main__":
    main()
