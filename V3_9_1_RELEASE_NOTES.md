# v3.9.1 FSRS Advance Hotfix

This release fixes the critical Active Recall progression bug found after v3.9.0.

## Critical Fix

- Fixed an issue where FSRS rating buttons wrote study_events successfully but did not advance from Q1 to Q2.
- Added automatic advancement after AGAIN / HARD / GOOD / EASY.
- Added a submit guard to prevent duplicate study_events from repeated clicks.
- Reset post-answer state when moving to the next card:
  - selected answer
  - feedback state
  - mistake diagnosis
  - Input Unit state
- Preserved the Deep Learning Loop UI introduced in v3.9.0.

## Verified Runtime Results

- Q1 → Q2 progression: fixed
- Q2 → Q3 progression: fixed
- 10+ question session: verified
- AGAIN / HARD / GOOD / EASY all advance correctly
- Recent wrong review mode: advances
- Unanswered mode: advances
- Weak topic mode: advances
- Takken-only mode: advances
- Chintai-only mode: advances
- study_events: preserved
- Duplicate submission guard: active
- Deep Learning UI regression: none observed

## Safety Notes

- No public data JSON files were modified.
- Existing study_events were not deleted or directly edited.
- No destructive restore/import operation was performed.
- Previous releases remain unchanged.
- This release supersedes v3.9.0 as the recommended stable learning build.
