# v3.9.0 Deep Learning Loop

This release promotes Takken App from a functional quiz system to a deep-learning and memory-retention study system.

## Highlights

- Added visible mistake diagnosis after wrong answers.
- Added MCQ choice-by-choice explanations in the production Active Recall UI.
- Added answer-centric feedback:
  - Correct answer
  - User answer
  - Direct answer
  - Why correct
  - Why the user answer is wrong
  - Source trace / raw trace
- Added Input Unit pathway from wrong-answer feedback.
- Added structured Input Unit content:
  - Topic intro
  - Why it appears on the exam
  - Basic rule
  - Trap point
  - Memory hook
  - Related questions
- Added review modes:
  - Recent wrong answers
  - Unanswered questions
  - Weak topics
  - Takken-only
  - Chintai-only
  - Category-based review
- Added Deep Learning Metrics to db-audit.
- Added quality-level and improvement-reason visibility in Data Explorer.
- Preserved existing Takken data, Chintai data, and study_events.
- Confirmed no direct IndexedDB edit and no destructive restore.

## Verified Runtime Results

- MCQ choice explanations: visible
- Mistake diagnosis card: visible
- Input Unit link and content: visible
- Recent wrong / unanswered / weak topic modes: working
- db-audit Deep Learning Metrics: visible
- Data Explorer quality reasons: visible
- Active Recall 10+ question session: stable
- Two-question stop regression: not reproduced
- Preparing message count: 0
- Critical runtime errors: none

## Safety Notes

- Existing study_events were preserved.
- Existing Takken and Chintai cards were not destructively overwritten.
- No public data JSON files were manually edited.
- Previous releases remain unchanged.
- This release supersedes v3.8.0 as the recommended stable learning build.
