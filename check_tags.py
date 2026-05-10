import json

with open('public/chintai_raw.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

keywords = [
    '個人情報保護法', '賃貸住宅管理業者', '管理業務', '委託',
    '賃料', '修繕', '契約', '法令', '届出', '登録',
    '重要事項説明', '管理受託契約', '損害賠償', '原状回復',
    '区分所有法', '敷金', '礼金', '保証金', '定期借家',
    '転貸借', '管理費'
]

tag_counts = {}
no_tag_count = 0
for q in data:
    raw_category = q.get('category_major', '賃貸管理士')
    tags = [raw_category]
    for kw in keywords:
        if kw in q['question_text'] and kw not in tags:
            tags.append(kw)
    tags = tags[:8]
    first_tag = tags[0] if tags else None
    if first_tag:
        tag_counts[first_tag] = tag_counts.get(first_tag, 0) + 1
    else:
        no_tag_count += 1

print(f"Total questions: {len(data)}")
print("\nTop tags (tags[0]) distribution:")
for t, c in sorted(tag_counts.items(), key=lambda x: -x[1])[:15]:
    print(f"  {t}: {c}")
print(f"No tag: {no_tag_count}")

# Also check what unique category_major values exist
categories = set(q.get('category_major', '') for q in data)
print(f"\nUnique category_major values: {categories}")
