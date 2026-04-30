# DASH Development Workflow

This is the single source of truth for how changes are made, verified, and committed.

## Principle
No changes get committed unless they pass:
- Typecheck gate
- Boot gate
- Targeted regression gate

## Directory for Evidence
All test evidence goes here:
- `docs/test-runs/YYYY-MM-DD/`

Include:
- terminal logs (copy into .txt files)
- screenshots
- short notes

## Standard Gates
### Gate 1: Install
- `npm install`

### Gate 2: Typecheck
- `npm run typecheck`

If you do not have it, add:
- `"typecheck": "tsc -p tsconfig.json --noEmit"`

### Gate 3: Expo Doctor
- `npx expo-doctor`

### Gate 4: Boot Smoke Test
- `npx expo start`
- Launch simulator/emulator
- App opens without red screen
- Navigate to the first actionable screen

## Fix First, Test Second
1) Run `docs/archive/test-guides/fix_issues_runbook.md` until gates pass.
2) Run `docs/archive/test-guides/runtime_test_runbook.md` end-to-end.

## Historical Docs
- Archived runbooks and historical testing notes live in `docs/archive/`.
- Dated runtime evidence remains in `docs/test-runs/`.

## How to Handle Failures
### Minor issue
Definition:
- small, localized change
- low risk of side effects
Action:
- Fix immediately
- Re-run the specific failing step
- Re-run Gate 2 and Gate 4

### Major issue
Definition:
- requires refactor, redesign, or touches many files
Action:
- Add to backlog section in the test report
- Do not hack a partial fix
- Schedule a dedicated fix pass

## Git Hygiene
Before committing:
- `git status` must not show `node_modules/` or build outputs

Recommended:
- commit small and frequent
- one functional change per commit

## Commit Template
Use messages like:
- "Fix sqlite wrapper and migrations"
- "Fix Task Card Done/Skip/Snooze logging"
- "Implement ChatGPT import parser and validation"
- "Fix notification rescheduling and quiet hours"

## Minimum Definition of Done for MVP
- App boots without red screen
- Onboarding works for 1 and 3 domains
- Playbook edit persists after restart
- Task Card Done/Skip/Snooze logs correctly
- Notifications schedule and respect quiet hours
- Weekly review matches logs
- ChatGPT import works for valid payload and fails safely for invalid payload
