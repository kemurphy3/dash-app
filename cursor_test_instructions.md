
---

```md
# cursor_test_instructions.md
# DASH MVP: Real Testing Instructions (After Bug Fixes)

Goal: Run real, repeatable tests on the working build. Capture evidence for failures. Fix minor issues immediately. Add major issues to backlog.

## Rules (Evidence-Based Testing)
You must not claim a test passed unless you executed it and observed the result.

For every failure, capture:
- Screenshot (UI + red screen if present)
- Terminal output
- Reproduction steps
Store in: `docs/test-runs/YYYY-MM-DD/`

## Stop Conditions
Stop and fix immediately if:
- App crashes or shows a red screen
- Onboarding cannot complete
- Task completion does not persist after restart
- Notifications duplicate or ignore quiet hours
- Import crashes or creates corrupted data

## Commands to Run (Record Output)
From repo root:
1) `node -v`
2) `npm -v`
3) `npm install`
4) `npm run typecheck`
5) `npx expo doctor`
6) `npx expo start`

If you have a lint script:
- `npm run lint`

If you have tests:
- `npm test`

---

# Phase 0: Sanity Boot
## 0.1 Boot the app
- Launch iOS simulator or Android emulator.
- Open the app.
Expected:
- No red screen.
- App reaches first screen reliably.

Artifacts:
- Screenshot of first screen.

---

# Phase 1: Onboarding
## 1.1 Onboarding with 1 domain
Steps:
1) Start fresh install (clear app data).
2) Select Morning only.
3) Choose a template playbook.
4) Set trigger time (use a time 2 minutes ahead if possible).
5) Activate.

Expected:
- Onboarding completes.
- Domain created.
- Playbook created.
- Tasks visible.

Artifacts:
- Screenshot of confirmation and the resulting playbook/task list.

## 1.2 Onboarding with 3 domains
Repeat with Morning + Exercise + Evening.
Expected:
- All three domains active.
- Each has a playbook and tasks.
- Trigger times saved correctly.

Edge cases:
- Back navigation mid-onboarding.
- Kill app mid-onboarding and relaunch.

Expected:
- No corrupted partial state.
- Either resumes or restarts cleanly.

---

# Phase 2: Playbooks and Tasks
## 2.1 Edit a playbook
Steps:
1) Rename playbook.
2) Add a task with duration.
3) Edit a task title and duration.
4) Reorder tasks.
5) Delete a task.

Expected:
- UI updates immediately.
- Changes persist after app restart.

Verify:
- Force close the app and relaunch.
- Confirm playbook reflects changes.

---

# Phase 3: Execution Loop
Assumption: There is a "Now" feed or equivalent entry to start the active playbook.

## 3.1 Task Card: Done advances
Steps:
1) Start a playbook.
2) On Task Card, press Done.
3) Repeat through all tasks.

Expected:
- Advances to next task in order.
- At end, playbook completes for the day.
- Completion creates logs.

## 3.2 Skip behavior
Define the expected rule (must match implementation):
- Skip marks the task as skipped and defers it to the next eligible slot.
- Default deterministic rule:
  - If current time is before 20:00 local, defer to +60 minutes.
  - If after 20:00, defer to next day at domain trigger_time.

Steps:
1) Skip the first task.
2) Confirm it reschedules per rule.
3) Confirm no duplicate logs are created.

Expected:
- Single log entry with skipped = true and deferred_to set.
- Task reappears at deferred time.

## 3.3 Snooze options
Snooze options: 10m, 30m, 60m, Later Today.
Later Today rule:
- Defer to 17:00 local. If past 17:00, defer to +60 minutes.

Expected:
- Exactly one pending reschedule.
- No duplicates.

---

# Phase 4: Notifications and Quiet Hours
## 4.1 Notification scheduling
Steps:
1) Set a domain trigger time 2 minutes ahead.
2) Confirm notification fires.

Expected:
- Notification appears.
- Tapping opens the correct Task Card.

## 4.2 Edit triggers reschedules notifications
Steps:
1) Change trigger time.
2) Confirm old notification does not fire.
3) Confirm new one does.

## 4.3 Quiet hours suppress notifications
Steps:
1) Set quiet hours to include the next trigger time.
2) Confirm no notification fires during quiet hours.
3) Confirm next eligible notification fires after quiet hours.

Expected:
- No duplicates.
- No silent failures.

---

# Phase 5: Weekly Review
## 5.1 Generate activity
Complete and skip tasks over multiple days (or manipulate device date if you are comfortable, but do not corrupt local data).

Expected weekly review:
- Completed task count matches logs.
- Skipped task count matches logs.
- Completion rate per domain is correct.
- Most skipped domain and most skipped task are correct.

Artifacts:
- Screenshot of weekly review.
- If mismatch, paste relevant log rows from SQLite (query output).

---

# Phase 6: ChatGPT Import
This phase assumes DASH supports pasting a structured export (YAML or JSON).

## 6.1 Valid import
Steps:
1) Copy a valid export payload.
2) Import via paste.
3) Activate.

Expected:
- Domains created.
- Playbooks created.
- Tasks created with correct ordering and durations.
- Trigger times applied.

Artifacts:
- Screenshot of imported domains and one playbook.

## 6.2 Malformed import
Use:
- Missing required keys
- Invalid YAML/JSON
Expected:
- User-friendly error message.
- No partial import persisted.

## 6.3 Missing durations and times
Expected deterministic defaults:
- duration_minutes default: 5
- trigger_time default per domain:
  - Morning 07:00
  - Exercise 07:30
  - Evening 21:30

Confirm:
- Defaults applied correctly.

## 6.4 Multi-week (12-week) plan handling
Pick one deterministic MVP rule and test it. Choose one:

Option A (simpler MVP):
- Import stores all weeks as separate playbooks.
- App defaults active_playbook to Week 1 playbook.
- User manually switches weeks.

Option B (more advanced MVP):
- Import stores plan_start_date (default = import date).
- Active playbook auto-switches based on weeks since start.

If Option A is implemented, do not test Option B.

---

# Reporting Format (Cursor Must Produce After Testing)
## Test Run Log
- Date
- Device (iOS or Android)
- Commands run and results
- Each phase: Pass or Fail

## Fixed Issues (Minor)
For each:
- Repro steps
- Root cause
- Patch (files changed)
- Verification steps

## Major Issues Backlog
For each:
- Severity (Blocker, High, Medium, Low)
- Repro steps
- Expected vs actual
- Evidence links (file paths in docs/test-runs)
- Proposed approach

## Go or No-Go
State whether the build is ready for a public beta.
If no-go, list the minimum blockers that must be resolved.
