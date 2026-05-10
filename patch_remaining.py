"""
Fix remaining studyMode references in App.tsx
"""
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix remaining references 
replacements = {
    '// studyModeに応じた正規化カテゴリを返す': '// 全カテゴリを返す（試験種別フィルタは別途適用）',
    '// studyModeによるフィルタリング\n': '// 試験種別フィルタリング（null = 全て）\n',
    '// studyMode変更時にカテゴリカウントを再計算': '// examTypeFilter変更時にカテゴリカウントを再計算',
    "console.log('📊 Updated category counts for studyMode:', studyMode, counts);": "console.log('📊 Updated category counts for examTypeFilter:', examTypeFilter, counts);",
    "console.log('📊 Updated tag counts for studyMode:', studyMode, allTagCounts);": "console.log('📊 Updated tag counts for examTypeFilter:', examTypeFilter, allTagCounts);",
}

content = ''.join(lines)
for old, new in replacements.items():
    content = content.replace(old, new)

# Fix line 408-411 (getTagCountsByCategory studyMode filter)
old_block = """    // studyModeによるフィルタリング
    if (studyMode === 'takken') {
      allCards = allCards.filter(card => !card.card_id.startsWith('CHINTAI-'));
    } else if (studyMode === 'chintai') {
      allCards = allCards.filter(card => card.card_id.startsWith('CHINTAI-'));
    }"""
new_block = """    // 試験種別フィルタリング（null = 全て）
    if (examTypeFilter === 'takken') {
      allCards = allCards.filter(card => !card.card_id.startsWith('CHINTAI-'));
    } else if (examTypeFilter === 'chintai') {
      allCards = allCards.filter(card => card.card_id.startsWith('CHINTAI-'));
    }"""

# this may be one remaining block
content = content.replace(old_block, new_block)

# Fix line 727 area - startFocusSession 
old_start = "    if (studyMode === 'chintai') {"
new_start = "    if (examTypeFilter === 'chintai') {"
content = content.replace(old_start, new_start)

# Fix lines 976-979 area (in startFocusSession or similar)
old_filter = """// studyModeによるフィルタリング（宅建/賃貸の分離）
        if (studyMode === 'takken') {
          cards = cards.filter(card => !card.card_id.startsWith('CHINTAI-'));
        } else if (studyMode === 'chintai') {
          cards = cards.filter(card => card.card_id.startsWith('CHINTAI-'));
        }"""
new_filter = """// 試験種別フィルタリング（null = 全て表示）
        if (examTypeFilter === 'takken') {
          cards = cards.filter(card => !card.card_id.startsWith('CHINTAI-'));
        } else if (examTypeFilter === 'chintai') {
          cards = cards.filter(card => card.card_id.startsWith('CHINTAI-'));
        }"""
content = content.replace(old_filter, new_filter)

# Generic cleanup - replace any remaining studyMode === references
import re
content = re.sub(r"studyMode === '(takken|chintai)'", r"examTypeFilter === '\1'", content)
content = re.sub(r"studyMode !== '(takken|chintai)'", r"examTypeFilter !== '\1'", content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Check remaining
remaining = [(i, l.strip()) for i, l in enumerate(content.split('\n'), 1) 
             if 'studyMode' in l and '// ' not in l]
print(f"Remaining studyMode (non-comment) references: {len(remaining)}")
for i, l in remaining[:20]:
    print(f"  Line {i}: {l[:120]}")
