# v4.0.0 Comprehension First

This release upgrades Takken App from a deep recall system into a comprehension-first legal learning system.

## Highlights

- Added natural Japanese answer feedback for true/false and MCQ questions.
- Added Question Breakdown Panel:
  - question type
  - what is being asked
  - parties
  - objects
  - conditions
  - relationship structure
  - conclusion
- Added inline legal glossary chips with plain-language explanations.
- Added Legal Context Panel:
  - why the system exists
  - who is protected
  - real-world use case
  - exam trap
- Added Similar Questions Panel for targeted practice.
- Added Category Progress Dashboard:
  - total questions
  - answered / unanswered
  - accuracy
  - weakness
  - estimated remaining work
  - category-specific study buttons
- Added old-law / current-law caution labels where relevant.
- Preserved the v3.9.1 FSRS advance fix.
- Preserved Deep Learning Loop UI, mistake diagnosis, Input Unit, and MCQ limb analysis.

## Verification

- Target Commit: d10e3f39cbced89607f3274c5f123ae5f9d0af23
- Runtime Gate: PASS (Verified on GitHub Pages)
- FSRS Q1-Q10 Progression: Preserved
- No critical runtime errors.

## Safety Notes

- Existing study_events were preserved.
- No public data JSON files were manually edited.
- This release supersedes v3.9.1 as the recommended stable learning build.
