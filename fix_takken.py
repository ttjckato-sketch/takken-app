import sys
import re

def patch_app_tsx():
    filePath = "src/App.tsx"
    with open(filePath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Option groups inside KnowledgeSelectView
    # Wait, the dropdown is actually inside App.tsx (the `<select>` for learning module)
    target_select = """                    <option value="">全分野（オールマイティ）</option>
                    {Object.entries(categoryCounts).map(([cat, count]) => (
                      <option key={cat} value={cat}>
                        {cat}（{count}問）
                      </option>
                    ))}
                  </select>"""
    replacement_select = """                    <option value="">全分野（オールマイティ）</option>
                    {Object.entries(categoryCounts).map(([majorCat, majorCount]) => (
                      <optgroup key={majorCat} label={`■ ${majorCat}（全体: ${majorCount}問）`}>
                        <option value={majorCat}>{majorCat} を一気にやる</option>
                        {tagCounts[majorCat] && Object.entries(tagCounts[majorCat])
                          .sort((a, b) => b[1] - a[1])
                          .map(([tag, count]) => (
                            <option key={`tag:${tag}`} value={`tag:${tag}`}>
                              　▶ {tag} （{count}問）
                            </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>"""

    if target_select in content:
        content = content.replace(target_select, replacement_select)
        print("Patched App.tsx: Select tags")
    else:
        print("Could not find target_select in App.tsx")

    with open(filePath, "w", encoding="utf-8") as f:
        f.write(content)

def patch_data_integration():
    filePath = "src/utils/dataIntegration.ts"
    with open(filePath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # We already saw the builder HAS changed this! 
    # Let's verify by just looking at it
    pass

def patch_high_quality_data():
    # As checked previously, the high quality data was already edited by builder.
    pass

if __name__ == "__main__":
    patch_app_tsx()
