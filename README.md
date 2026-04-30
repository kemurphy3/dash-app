# DASH

**Daily Actions, Stop Hesitating.**

DASH is a local-first iOS/Android app that turns your morning, exercise, and evening routines into a sequence of one-tap actions. You decide once during onboarding (or import a plan from ChatGPT), and after that DASH fires a notification at the right time, shows you the next task, and you tap **Done**, **Skip**, or **Snooze**.

> "You already know what you want to do. DASH removes the daily re-deciding."

## Status

MVP feature-complete and currently in internal testing/hardening. See `DASH_MVP_SPEC.md` for product and flow details.

## Tech stack

- **Expo SDK 54** + **expo-router** (file-based navigation)
- **React Native 0.81**, **React 19**, **TypeScript**
- **expo-sqlite** for local persistence (source of truth)
- **Zustand** for reactive UI state
- **expo-notifications** for local notifications
- **AsyncStorage** for simple flags
- **YAML** parser for ChatGPT plan imports

No backend. All data is local.

## Getting started

```bash
npm install
npm start
npm run ios
npm run android
npm run web
```

Other scripts:

```bash
npm run typecheck
npm run lint
```

Notes:
- iOS simulator requires macOS + Xcode.
- On Windows, use Expo Go on a physical iPhone/Android device for iOS/Android testing.
- Some notification behavior has limitations in Expo Go; use a development build for full parity.

## How it works

### Three domains, one active playbook per domain

Users pick 1-3 domains:
- Morning
- Exercise
- Evening

Each domain has one **active** playbook at a time (imports can define phased playbooks across weeks/days).

### Daily loop

1. At a domain trigger time, a local notification fires.
2. Tap notification -> app opens to TaskCard.
3. Tap **Done**, **Skip**, or **Snooze** (10m / 30m / 60m / Later Today).
4. Next task appears. When the playbook completes, remaining notifications for that domain are canceled until tomorrow.

Skip behavior: skipped tasks are logged and currently deferred using the app's skip timing rule.

## Notifications

- One notification per active domain per day, fired at trigger time.
- Snooze reschedules reminder:
  - 10m / 30m / 60m
  - Later Today: 5:00 PM local, or +60m if already past 5:00 PM.
- Quiet hours delay notifications until quiet hours end.
- Completing a playbook cancels remaining notifications for that domain for the day.
- Notifications are re-scheduled on app open and during daily refresh.

## ChatGPT import

Users can import plans from ChatGPT using DASH YAML:
- Fresh Start prompt (new plan)
- Export Existing prompt (convert an existing chat plan)

Import flow validates, previews, highlights warnings/auto-fixes, resolves conflicts, and then activates.

Multi-week plans are supported using:
- `duration_weeks`
- `week_start` / `week_end`
- `days` filtering

## Project structure

```text
app/               expo-router screens
src/               components, db, stores, import, notifications, utils, types
assets/            icons/splash assets
docs/              specs, integration notes, workflows, test runs
```

## Further reading

- `DASH_MVP_SPEC.md`
- `docs/CHATGPT_INTEGRATION.md`
- `docs/MVP_BUILD_CHECKLIST.md`
- `docs/dev_workflow.md`
- `assets/README.md`
