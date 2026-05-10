import json

with open('public/chintai_raw.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Simulate the new extractTags logic
primary_keywords = [
    ('個人情報保護法', '個人情報保護法'),
    ('定期建物賃貸借', '定期借家契約'),
    ('定期借家', '定期借家契約'),
    ('管理受託契約', '管理受託契約'),
    ('賃貸住宅管理業者登録', '管理業者登録制度'),
    ('賃貸住宅管理業者', '管理業者登録制度'),
    ('重要事項説明', '重要事項説明'),
    ('原状回復', '原状回復・敷金'),
    ('敷金', '原状回復・敷金'),
    ('転貸借', '転貸借・サブリース'),
    ('サブリース', '転貸借・サブリース'),
    ('区分所有', '区分所有法'),
    ('借地借家法', '借地借家法'),
    ('契約の更新', '契約更新・解約'),
    ('更新拒絶', '契約更新・解約'),
    ('中途解約', '契約更新・解約'),
    ('修繕', '修繕・維持管理'),
    ('保証', '賃借人保護'),
    ('賃料', '賃料・費用'),
    ('管理費', '賃料・費用'),
]

tag0_counts = {}
for q in data:
    text = q['question_text'] + ' ' + (q.get('explanation_source') or '')
    primary_tag = '賃貸管理（一般）'
    for kw, label in primary_keywords:
        if kw in text:
            primary_tag = label
            break
    tag0_counts[primary_tag] = tag0_counts.get(primary_tag, 0) + 1

print("After fix - tags[0] distribution:")
for t, c in sorted(tag0_counts.items(), key=lambda x: -x[1]):
    print(f"  {t}: {c}")
print(f"\nTotal: {sum(tag0_counts.values())} / {len(data)}")
print(f"Unique sub-categories: {len(tag0_counts)}")
