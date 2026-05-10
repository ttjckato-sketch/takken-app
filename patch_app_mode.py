"""
Patch App.tsx to:
1. Remove the studyMode toggle (宅建/賃貸管理 tab buttons)
2. Remove studyMode state and all studyMode-based filtering
3. Show ALL cards (takken + chintai) unified
4. Keep the optgroup dropdown but show all categories including 賃貸管理
"""
import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

original_length = len(content)
changes = []

# 1. Remove the studyMode state declaration
old_state = "  // 学習モード（宅建/賃貸）\n  const [studyMode, setStudyMode] = useState<'takken' | 'chintai'>('takken');\n"
new_state = "  // 試験種別フィルタ（null = 全て）\n  const [examTypeFilter, setExamTypeFilter] = useState<'takken' | 'chintai' | null>(null);\n"
if old_state in content:
    content = content.replace(old_state, new_state)
    changes.append("Replaced studyMode state with examTypeFilter")
else:
    print("WARNING: studyMode state not found!")

# 2. Remove the Toggle UI (the segmented control with 宅建/賃貸管理 buttons)
old_toggle = """              {/* 宅建/賃貸マスタータブ（Segmented Control） */}
              <div className="mt-6 inline-flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
                <button
                  onClick={() => setStudyMode('takken')}
                  className={`px-8 py-4 rounded-xl font-black text-base transition-all flex items-center gap-2 ${
                    studyMode === 'takken'
                      ? 'bg-white text-indigo-600 shadow-lg'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="text-xl">🏢</span>
                  宅建
                </button>
                <button
                  onClick={() => setStudyMode('chintai')}
                  className={`px-8 py-4 rounded-xl font-black text-base transition-all flex items-center gap-2 ${
                    studyMode === 'chintai'
                      ? 'bg-white text-rose-600 shadow-lg'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="text-xl">🏠</span>
                  賃貸管理
                </button>
              </div>"""

new_toggle = """              {/* 試験種別フィルタ（All / 宅建 / 賃貸管理士） */}
              <div className="mt-6 inline-flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
                <button
                  onClick={() => setExamTypeFilter(null)}
                  className={`px-5 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-1.5 ${
                    examTypeFilter === null
                      ? 'bg-white text-slate-800 shadow-lg'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  📚 全て
                </button>
                <button
                  onClick={() => setExamTypeFilter('takken')}
                  className={`px-5 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-1.5 ${
                    examTypeFilter === 'takken'
                      ? 'bg-white text-indigo-600 shadow-lg'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🏢 宅建
                </button>
                <button
                  onClick={() => setExamTypeFilter('chintai')}
                  className={`px-5 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-1.5 ${
                    examTypeFilter === 'chintai'
                      ? 'bg-white text-rose-600 shadow-lg'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🏠 賃貸管理士
                </button>
              </div>"""

if old_toggle in content:
    content = content.replace(old_toggle, new_toggle)
    changes.append("Replaced toggle with examTypeFilter buttons")
else:
    print("WARNING: Toggle UI not found exactly!")
    # Try to find a partial match
    idx = content.find('宅建/賃貸マスタータブ')
    if idx != -1:
        print(f"  Found toggle UI at char {idx}")
        print(repr(content[idx:idx+300]))
    else:
        print("  Not found at all!")

# 3. Replace studyMode-based filtering in refreshStats with examTypeFilter
# The issue: everywhere studyMode === 'takken' / 'chintai' is used to filter
old_filter1 = """    // studyModeによるフィルタリング（宅建/賃貸の分離）
    if (studyMode === 'takken') {
      allCards = allCards.filter(card => !card.card_id.startsWith('CHINTAI-'));
    } else if (studyMode === 'chintai') {
      allCards = allCards.filter(card => card.card_id.startsWith('CHINTAI-'));
    }"""

new_filter1 = """    // 試験種別フィルタリング（null = 全て）
    if (examTypeFilter === 'takken') {
      allCards = allCards.filter(card => !card.card_id.startsWith('CHINTAI-'));
    } else if (examTypeFilter === 'chintai') {
      allCards = allCards.filter(card => card.card_id.startsWith('CHINTAI-'));
    }"""

count1 = content.count(old_filter1)
if count1 > 0:
    content = content.replace(old_filter1, new_filter1)
    changes.append(f"Replaced studyMode filter with examTypeFilter ({count1} occurrences)")
else:
    print("WARNING: studyMode filter pattern not found!")
    # Try to find partial
    idx = content.find('studyModeによるフィルタリング')
    if idx != -1:
        print(f"  Found at char {idx}:")
        print(repr(content[idx:idx+400]))

# 4. Replace useEffect dependency on studyMode for categoryCounts
old_dep = "  }, [studyMode]);\n\n  // studyMode変更時にselectedCategoryをクリア\n  useEffect(() => {\n    setSelectedCategory(null);\n  }, [studyMode]);"
new_dep = "  }, [examTypeFilter]);\n\n  // 試験種別フィルタ変更時にselectedCategoryをクリア\n  useEffect(() => {\n    setSelectedCategory(null);\n  }, [examTypeFilter]);"

if old_dep in content:
    content = content.replace(old_dep, new_dep)
    changes.append("Replaced studyMode useEffect deps with examTypeFilter")
else:
    print("WARNING: studyMode useEffect deps not found!")

# 5. Replace refreshStats call dependency line
old_refresh_dep = "    refreshStats(); // studyMode変更時に統計も再計算"
new_refresh_dep = "    refreshStats(); // examTypeFilter変更時に統計も再計算"
if old_refresh_dep in content:
    content = content.replace(old_refresh_dep, new_refresh_dep)
    changes.append("Replaced refreshStats comment")

# 6. Replace getNormalizedCategories(studyMode) calls
old_norm = "    return getNormalizedCategories(studyMode);"
new_norm = "    return getNormalizedCategories(); // 全カテゴリ（examTypeFilterは別途適用）"
if old_norm in content:
    content = content.replace(old_norm, new_norm)
    changes.append("Replaced getNormalizedCategories(studyMode)")

# 7. Replace getNormalizedCategories(studyMode) in other places
old_norm2 = "getNormalizedCategories(studyMode)"
new_norm2 = "getNormalizedCategories()"
count7 = content.count(old_norm2)
if count7 > 0:
    content = content.replace(old_norm2, new_norm2)
    changes.append(f"Replaced {count7} occurrences of getNormalizedCategories(studyMode)")

# 8. In startFocusSession / knowledgeQueue building, filter by examTypeFilter
old_queue_start = "      let allCards = await db.understanding_cards.toArray();\n\n    // studyModeによるフィルタリング"
# Already handled by global replacement above

new_length = len(content)
print(f"\nOriginal length: {original_length}")
print(f"New length: {new_length}")
print(f"Difference: {new_length - original_length}")
print(f"\nChanges applied ({len(changes)}):")
for c in changes:
    print(f"  ✓ {c}")

# Also check for remaining studyMode references (not counting function parameter names)
remaining = [(i, l.strip()) for i, l in enumerate(content.split('\n'), 1) 
             if 'studyMode' in l and 'setStudyMode' not in l and 'useCallback' not in l]
print(f"\nRemaining studyMode references: {len(remaining)}")
for i, l in remaining[:15]:
    print(f"  Line {i}: {l[:100]}")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("\nDone!")
