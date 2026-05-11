# V30 HQI Batch1 5173 Dry-run Context Root Cause Audit

Date: 2026-05-11

## Scope

This audit investigated why the v30 HQI Batch1 5173 dry-run runner saw an empty database on `127.0.0.1:5173`.

No HQI import, formal dry-run import, rollback dry-run, pilot generation, explanation import, source data modification, database clear/delete, commit, push, or deploy was executed.

## Current Repository State

- Work directory: `C:\Project vibe\main\VCG_INTEGRATED\宅建ツール\takken-app`
- Latest commit: `3098783 feat(takken): add v30 phase2 pilot explanation dataset`
- Initial `git status --short`: existing untracked audit/design/generated files and untracked runner HTML were already present.
- `npm run build`: PASS when run outside the sandbox. In-sandbox run failed with `spawn EPERM` from esbuild, then approved external run passed.
- `package.json`: not modified by this task.
- `package-lock.json`: not modified by this task.

## 5173 Server

- `127.0.0.1:5173` was already in use by PID `73632`.
- No indiscriminate kill was performed.
- A temporary verification Vite process attempted to start, fell back to `5174`, and was stopped after URL verification.
- Existing `5173` was left running.

## URL Findings

The app has `base: '/takken-app/'` in `vite.config.ts`.

Browser-level checks through the existing Antigravity-connected Chrome CDP context showed:

| URL | Browser HTTP status | Result |
|---|---:|---|
| `http://127.0.0.1:5173/` | 200 after redirect | Final URL `http://127.0.0.1:5173/takken-app/`, title `宅建OS` |
| `http://127.0.0.1:5173/tools/dev-pages/v30-hqi-batch1-5173-dryrun-runner.html` | 404 | Vite base guard page: use `/takken-app/` |
| `http://127.0.0.1:5173/takken-app/` | 200 | App shell, title `宅建OS` |
| `http://127.0.0.1:5173/takken-app/tools/dev-pages/v30-hqi-batch1-5173-dryrun-runner.html` | 200 | Runner displayed |

Canonical runner URL:

`http://127.0.0.1:5173/takken-app/tools/dev-pages/v30-hqi-batch1-5173-dryrun-runner.html`

Reason:

- It matches Vite `base: '/takken-app/'`.
- It loads the runner in a browser without triggering the base guard.
- It keeps the same origin as the app: `http://127.0.0.1:5173`.

Path alone does not change IndexedDB origin, but the root runner path is not the correct browser-served path under this Vite base configuration.

## Browser Context Evidence

The existing Antigravity-connected Chrome was reachable via CDP on `127.0.0.1:9222`.

`await indexedDB.databases()` in that context returned:

```json
[
  { "name": "AntigravityDB", "version": 30 },
  { "name": "TakkenAppDB", "version": 1 },
  { "name": "TakkenOS_DB", "version": 300 }
]
```

Important note: raw IndexedDB reports `TakkenOS_DB` as version `300`; Dexie `db.verno` reports `30`.

## DB Counts In The Antigravity Browser Context

Across app and canonical runner URL, the canonical `TakkenOS_DB` showed:

| Store/count | Value |
|---|---:|
| `source_questions_total` | 1524 |
| `source_choices_total` | 3024 |
| `source_questions_takken` | 1024 |
| `source_choices_takken` | 1024 |
| `source_questions_chintai` | 500 |
| `source_choices_chintai` | 2000 |
| `high_quality_input_units_count` | 0 |
| `question_explanations_count` | 0 |
| `choice_explanations_count` | 0 |

Visible Dexie DB name: `TakkenOS_DB`

Visible Dexie version: `30`

Visible stores included:

`source_questions`, `source_choices`, `high_quality_input_units`, `question_explanations`, `choice_explanations`, `memory_cards`, `memory_card_progress`, `memory_study_events`, `study_events`, and other existing v30 stores.

## Batch1 JSON

Checked file:

`docs/research/high_quality_input_web_research_batch1.json`

Fetch URL selected by the updated runner:

`/docs/research/high_quality_input_web_research_batch1.json`

HTTP status: `200`

Item count: `20`

`source_trace_grade = A`: `20`

`human_review_required = false`: `20`

The older runner fetched `/docs/generated/v30_pilot_question_choice_explanations_phase3_020.json`, which is not the requested Batch1 research JSON.

## Root Cause

Primary root cause:

The previous runner did not use the app's Dexie instance or the canonical app DB name. It defined:

```js
const DB_NAME = 'AntigravityDB';
const DB_VERSION = 30;
```

Then it called `indexedDB.open(DB_NAME, DB_VERSION)` and created object stores in `onupgradeneeded`.

That means the runner was reading or creating `AntigravityDB`, not `TakkenOS_DB`. In the same browser profile, `AntigravityDB` exists and can be empty while `TakkenOS_DB` correctly contains `1524 / 3024`.

Secondary issue:

The root runner URL is not canonical under Vite `base: '/takken-app/'`. The browser-visible canonical URL is the `/takken-app/tools/...` URL.

Not root cause:

- Browser profile/context was not the primary issue in the verified Antigravity-connected Chrome context. The expected `TakkenOS_DB` data was visible there.
- Same-origin path difference alone was not enough to explain the empty DB. The wrong DB name and direct `indexedDB.open` did.

## Runner Fix

Updated:

`tools/dev-pages/v30-hqi-batch1-5173-dryrun-runner.html`

Changes:

- Removed direct `indexedDB.open`.
- Removed `AntigravityDB`.
- Removed schema creation via `createObjectStore`.
- Removed Formal Import Dry-run execution UI.
- Removed Rollback Dry-run execution UI.
- Added `環境診断` button.
- Imports app DB via `/src/db.ts`.
- Uses canonical `TakkenOS_DB`.
- Refuses to open Dexie if `indexedDB.databases()` does not show `TakkenOS_DB`, preventing accidental empty DB creation.
- Displays `location.origin`, `location.href`, `navigator.userAgent`, `indexedDB.databases()`, DB name, Dexie version, stores, key counts, Batch1 fetch URL/status/item count.
- Uses `createElement`, `textContent`, and `appendChild`; no `innerHTML`, `insertAdjacentHTML`, or `document.write`.
- Contains no `put`, `bulkPut`, `clear`, `deleteDatabase`, or formal import/rollback write action.

## Safety Verification

Static runner safety check after patch:

`Static runner safety check passed`

Build after patch:

`npm run build`: PASS

Browser runner diagnostic after patch:

- URL: `http://127.0.0.1:5173/takken-app/tools/dev-pages/v30-hqi-batch1-5173-dryrun-runner.html`
- `source_questions`: `1524`
- `source_choices`: `3024`
- `high_quality_input_units`: `0`
- `question_explanations`: `0`
- `choice_explanations`: `0`
- Batch1 item count: `20`

## Judgment

A. dry-run実行前コンテキスト問題解消

The correct DB and canonical URL are identified, the runner now diagnoses the correct DB context, and the root cause is confirmed.

