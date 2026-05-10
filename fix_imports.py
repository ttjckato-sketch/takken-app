"""
Fix dataIntegration.ts to import UnderstandingCard from db.ts instead of non-existent types.ts.
Also update autoDataLoader.ts to properly type the exam_type assignment.
"""
# Fix dataIntegration.ts import
with open('src/utils/dataIntegration.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old_import = """import {
  db,
  type KnowledgeCard,
  type Flashcard
} from '../db';
import type {
  UnderstandingCard,
  SRSParams,
  Analogy,
  StepDecomposition,
  ActiveRecallQuestion
} from '../types';"""

new_import = """import {
  db,
  type KnowledgeCard,
  type Flashcard,
  type UnderstandingCard
} from '../db';"""

if old_import in content:
    content = content.replace(old_import, new_import)
    print("Fixed dataIntegration.ts import")
else:
    print("WARNING: Could not find old import in dataIntegration.ts")
    # Check what's actually there
    idx = content.find('from \'../types\'')
    if idx > -1:
        print(content[max(0,idx-200):idx+100])

with open('src/utils/dataIntegration.ts', 'w', encoding='utf-8') as f:
    f.write(content)

# Now check if types SRSParams, Analogy etc are still used
# and if they exist in db.ts
with open('src/db.ts', 'r', encoding='utf-8') as f:
    db_content = f.read()

missing_types = []
for t in ['SRSParams', 'Analogy', 'StepDecomposition', 'ActiveRecallQuestion']:
    if t not in db_content:
        missing_types.append(t)

print(f"Types missing from db.ts: {missing_types}")

# Check dataIntegration.ts for remaining type references that might break
with open('src/utils/dataIntegration.ts', 'r', encoding='utf-8') as f:
    di_content = f.read()

for t in ['SRSParams', 'Analogy', 'StepDecomposition', 'ActiveRecallQuestion']:
    count = di_content.count(t)
    if count > 0:
        print(f"  {t} used {count} times in dataIntegration.ts")
