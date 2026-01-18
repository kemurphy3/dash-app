# DASH MVP End-to-End Testing Instructions

## Context
DASH is an Expo React Native app for habit execution. After fixing TypeScript errors, perform comprehensive testing.

**Repo:** https://github.com/kemurphy3/dash-app.git

## Pre-Testing Checklist
Before testing, verify:
```bash
npm run typecheck  # Must show 0 errors
npx expo start     # Must boot without red screens
```

Press `i` for iOS simulator or `a` for Android emulator.

---

## Phase 0: Environment Sanity

| Test | Steps | Expected |
|------|-------|----------|
| App boots | Launch simulator | No red screen, Welcome screen shows |
| Navigation works | Tap around | No crashes |

---

## Phase 1: Onboarding Flow

### Test 1A: Single Domain
1. Tap "Get Started"
2. Select only "Morning Routine"
3. Tap Continue
4. Select any playbook template
5. Tap Continue
6. Adjust trigger time if desired
7. Tap Continue
8. On confirm screen, tap "Activate DASH"
9. **Expected:** App navigates to Today screen, shows Morning domain card

### Test 1B: All Three Domains
1. Reset app (Settings → Reset App Data, or reinstall)
2. Select all three: Morning, Exercise, Evening
3. Complete onboarding for each
4. **Expected:** Today screen shows all 3 domain cards with correct times

### Test 1C: Back Navigation
1. Start fresh onboarding
2. Go forward 2 screens, then tap Back
3. **Expected:** Previous selections preserved, no crash

---

## Phase 2: Playbooks

### Test 2A: View Playbook
1. Tap Playbooks tab
2. Tap on a playbook
3. **Expected:** Shows playbook name, task list with durations

### Test 2B: Edit Task
1. In playbook detail, tap a task
2. Change title, description, or duration
3. Save
4. **Expected:** Changes persist, shown in list

### Test 2C: Reorder Tasks
1. Long-press a task, drag to new position
2. **Expected:** Order changes and persists after leaving screen

### Test 2D: Add/Remove Task
1. Tap "Add Task"
2. Fill in details, save
3. Delete another task
4. **Expected:** Both actions persist after app restart

### Test 2E: Persistence Check
1. Make edits to playbook
2. Force close app completely
3. Reopen app
4. **Expected:** All edits still there

---

## Phase 3: Execution Loop (Done/Skip/Snooze)

### Test 3A: Complete Task
1. Go to Today screen
2. Tap "Start" on a domain
3. Tap "Done ✓"
4. **Expected:** Advances to next task, progress updates

### Test 3B: Complete All Tasks
1. Mark all tasks as Done
2. **Expected:** Shows "Playbook Complete!" celebration screen

### Test 3C: Skip Task
1. Start a domain
2. Tap "Skip"
3. **Expected:** Advances to next task, task marked as skipped

### Test 3D: Snooze
1. Start a domain
2. Tap "Snooze 30m"
3. **Expected:** Alert confirms, returns to Today, notification scheduled for 30 min

### Test 3E: Resume Progress
1. Complete 2 of 5 tasks
2. Leave the task screen (tap X)
3. Return by tapping Start again
4. **Expected:** Resumes at task 3, not task 1

---

## Phase 4: Notifications

### Test 4A: Permission Request
1. Fresh install
2. Complete onboarding
3. **Expected:** iOS prompts for notification permission

### Test 4B: Scheduled Notification
1. Set a domain trigger time to 2 minutes from now
2. Close app (don't force quit)
3. Wait
4. **Expected:** Notification appears at trigger time

### Test 4C: Notification Opens Task
1. Tap on the notification
2. **Expected:** App opens directly to that domain's task screen

### Test 4D: Quiet Hours
1. Go to Settings
2. Enable quiet hours (e.g., 10 PM - 7 AM)
3. Set a domain trigger inside quiet hours
4. **Expected:** Notification delayed until quiet hours end

### Test 4E: Toggle Domain Notifications
1. Go to Settings
2. Toggle off notifications for one domain
3. **Expected:** That domain stops getting notifications

---

## Phase 5: Weekly Review

### Test 5A: Stats Display
1. Complete and skip various tasks over Today screen
2. Go to Review tab
3. **Expected:** Shows correct counts for completed/skipped

### Test 5B: Domain Breakdown
1. Complete tasks in different domains
2. Check Review
3. **Expected:** Per-domain stats match actual activity

### Test 5C: Empty State
1. Fresh install, no task activity
2. Go to Review
3. **Expected:** Shows friendly empty state message

---

## Phase 6: ChatGPT Import

### Test 6A: Valid Import
1. Go to Playbooks tab
2. Tap "Import from ChatGPT" or similar button
3. Paste this valid YAML:
```yaml
dash_version: 1
plan:
  name: "Test Plan"
  description: "A simple test"
  
domains:
  - type: morning
    trigger_time: "07:30"
    playbooks:
      - name: "Morning Test"
        tasks:
          - title: "Drink water"
            duration: 2
          - title: "Stretch"
            duration: 5
```
4. **Expected:** Preview screen shows plan, import succeeds, playbook appears

### Test 6B: Invalid YAML
1. Paste garbage text: `not valid yaml {{{{`
2. **Expected:** User-friendly error, not crash

### Test 6C: Missing Durations
1. Paste YAML with tasks missing `duration`:
```yaml
dash_version: 1
plan:
  name: "No Durations"
domains:
  - type: exercise
    playbooks:
      - name: "Quick Workout"
        tasks:
          - title: "Push-ups"
          - title: "Sit-ups"
```
2. **Expected:** Uses default duration (5 min), import succeeds

### Test 6D: Multi-Week Plan
1. Paste a 12-week plan:
```yaml
dash_version: 1
plan:
  name: "12 Week Program"
  duration_weeks: 12
domains:
  - type: exercise
    trigger_time: "18:00"
    playbooks:
      - name: "Week 1-4 Base"
        week_start: 1
        week_end: 4
        tasks:
          - title: "Easy run"
            duration: 20
      - name: "Week 5-8 Build"
        week_start: 5
        week_end: 8
        tasks:
          - title: "Tempo run"
            duration: 30
      - name: "Week 9-12 Peak"
        week_start: 9
        week_end: 12
        tasks:
          - title: "Long run"
            duration: 45
```
2. **Expected:** Import succeeds, currently shows Week 1-4 playbook

---

## Issue Reporting Format

For any bug found, record:
```markdown
### BUG-XXX: [Short title]
**Severity:** P0/P1/P2
**Screen:** [Where it happened]
**Steps:**
1. Step one
2. Step two
**Expected:** What should happen
**Actual:** What actually happened
**Error:** [Paste any error message or stack trace]
```

---

## Test Results Summary Template

| Phase | Test | Pass/Fail | Notes |
|-------|------|-----------|-------|
| 0 | App boots | | |
| 1A | Single domain onboard | | |
| 1B | All domains onboard | | |
| ... | ... | | |

---

## Fix Loop

For each bug:
1. Record with format above
2. Classify: MINOR (fix immediately) or MAJOR (backlog with plan)
3. After fix, re-run the specific test
4. Mark pass/fail in summary