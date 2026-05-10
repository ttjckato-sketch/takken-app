# TakkenOS Browser Audit Testing Guide

## Overview
This guide provides step-by-step instructions for manually verifying the TakkenOS database state using the browser-based audit pages.

## Prerequisites
- Dev server running on `http://127.0.0.1:5176`
- Modern browser with IndexedDB support
- Three audit pages opened (auto-launched by `scripts/open-audit-pages.ps1`)

## Audit Pages

### 1. v29-audit.html
**Purpose**: Verify v29 schema upgrade and initial data state

**Key Checks**:
- `dexie_version`: Should be 29
- `version_upgrade_success`: Should be true
- `high_quality_input_units_exists`: Should be true (new table created)
- `high_quality_input_units_count`: Should be 0 (empty initially)
- `source_questions_chintai`: Should be 500
- `source_choices_chintai`: Should be 2000
- `source_questions_takken`: Should be 0 (not yet populated)
- `source_choices_takken`: Should be 0 (not yet populated)
- `study_events`: Should be 0 or current count
- `study_events_readable`: Should be true

**Expected Outcome**: All checks pass with green checkmarks

### 2. db-audit.html
**Purpose**: Verify existing database preservation and restoration candidates

**Key Checks**:
- `understanding_cards_total`: Total number of understanding cards
- `understanding_cards_chintai`: Chintai-specific cards
- `understanding_cards_takken`: Takken-specific cards
- `null_statement_count`: Should be 0 (no null statements in ActiveRecall pool)
- `restoration_candidates_total`: Number of cards pending restoration
- `restoration_candidates_auto_ok`: Number of auto-approved candidates
- `restoration_candidates_candidate`: Number requiring manual review

**Safety Notes**:
- `restoration_candidates` is a Sidecar table - adding/removing candidates is safe
- Source population tables (`source_questions`, `source_choices`) must NEVER be deleted
- All operations in this page are read-only unless you click batch operation buttons

### 3. activerecall-test.html
**Purpose**: Test study_events tracking during ActiveRecall usage

## Test Procedure

### Step 1: Initial State Check
1. Open `activerecall-test.html`
2. Click "回答前のstudy_events件数を確認" (Check study_events count before)
3. Note the count (e.g., N)
4. Copy the displayed count

### Step 2: Perform ActiveRecall
1. Open main app: `http://127.0.0.1:5176/`
2. Navigate to ActiveRecall mode
3. Answer ONE question
4. Verify the answer was submitted successfully

### Step 3: Verify State Change
1. Return to `activerecall-test.html`
2. Click "回答後のstudy_events件数を確認" (Check study_events count after)
3. Verify the count increased: N → N+1
4. Click "最新のstudy_eventを表示" (Show latest study_event)

### Step 4: Verify Event Data
Check the latest study_event JSON contains:
- `event_id`: Unique event identifier
- `card_id`: The actual card ID that was answered
- `exam_type`: Should match the card's exam type
- `category`: Should match the card's category
- `mode`: Should be "active_recall"
- `answered_correct`: Should be true or false (not null/undefined)
- `selected_answer`: The user's answer
- `correct_answer`: The correct answer
- `created_at`: Timestamp of the event

## Expected Test Results

### v29 Execution Check
```
dexie_version: 29
high_quality_input_units_exists: true
high_quality_input_units_count: 0
source_questions_chintai: 500
source_choices_chintai: 2000
study_events_readable: true
```

### ActiveRecall Safety
```
null_statement_excluded: true
restoration_candidates_total: (varies)
restoration_candidates_auto_ok: (varies)
repair_possible_not_mixed: true
restoration_candidates_not_mixed: true
```

### study_events UI Test
```
Before study_events: N
After study_events: N+1
Increase confirmed: OK
latest_event_sample:
{
  "event_id": "...",
  "card_id": "...",
  "mode": "active_recall",
  "answered_correct": true/false,
  "selected_answer": "...",
  "correct_answer": "...",
  "created_at": "..."
}
```

## Common Issues and Solutions

### Issue: DB version not 29
**Solution**: The migration hasn't run. Check browser console for migration errors.

### Issue: high_quality_input_units table missing
**Solution**: Schema update failed. Check `src/db.ts` version matches migration.

### Issue: study_events not incrementing
**Solution**: Check that ActiveRecall is properly calling `study_events.add()` in the code.

### Issue: null_statement_count > 0
**Solution**: Cards with null `is_statement_true` are leaking into ActiveRecall pool. Check filtering logic.

### Issue: restoration_candidates mixed with main data
**Solution**: This should NOT happen. restoration_candidates is a Sidecar table.

## Report Format

After testing, report results in this format:

```
[v29 Execution Check]
dexie_version: [value]
high_quality_input_units_exists: [true/false]
high_quality_input_units_count: [number]
source_questions_chintai: [number]
source_choices_chintai: [number]
study_events_readable: [true/false]

[ActiveRecall Safety]
null_statement_excluded: [true/false]
restoration_candidates_total: [number]
restoration_candidates_auto_ok: [number]

[study_events UI Test]
Before study_events: [number]
After study_events: [number]
Increase confirmed: [OK/NG]

Risks: [list any risks found]
DB Safety: [Safe/Concerns]
UI Test Status: [Pass/Fail/Partial]
```

## Automated Testing
For automated testing without browser, use:
```bash
node scripts/run-audits.js
```

This will generate `audit-results.json` with programmatic checks.

## Safety Reminders
- NEVER delete source population data
- NEVER manually modify IndexedDB unless instructed
- restoration_candidates table is safe to modify
- Always backup before batch operations
- Use the built-in backup export feature in db-audit.html

## Next Steps After Testing
1. If all tests pass: System is ready for production use
2. If tests fail: Review specific failure points and fix
3. If partial success: Document what works and what needs attention
4. Save audit results as evidence for code review

## Contact
For issues or questions, refer to:
- VCG documentation: `docs/vcg_v12_FINAL.md`
- Testing strategy: `docs/test_strategy.md`
- Architecture: `docs/canon/model-routing-canon.md`
