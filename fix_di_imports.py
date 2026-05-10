"""
Update dataIntegration.ts to import types from db.ts
"""
with open('src/utils/dataIntegration.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old = """import {
  db,
  type KnowledgeCard,
  type Flashcard,
  type UnderstandingCard
} from '../db';"""

new = """import {
  db,
  type KnowledgeCard,
  type Flashcard,
  type UnderstandingCard,
  type SRSParams,
  type Analogy,
  type StepDecomposition,
  type ActiveRecallQuestion
} from '../db';"""

if old in content:
    content = content.replace(old, new)
    print('Fixed dataIntegration.ts imports')
else:
    print('OLD IMPORT NOT FOUND')
    idx = content.find("from '../db'")
    print(repr(content[max(0,idx-300):idx+100]))

with open('src/utils/dataIntegration.ts', 'w', encoding='utf-8') as f:
    f.write(content)
