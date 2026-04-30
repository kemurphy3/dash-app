# DASH

**Daily Actions, Stop Hesitating.**

DASH is a local-first iOS/Android app that turns routines (`morning`, `exercise`, `evening`) into a simple execution loop:

**Get notified -> see the next task -> tap Done, Skip, or Snooze.**

The goal is to reduce daily decision fatigue. You decide once (during onboarding or import), then execute.

---

## Current Status

**Active development. Not production-ready.**

What works now:
- Onboarding flow (domain selection, template playbooks, trigger times, activation)
- Local-first persistence with SQLite
- Task execution loop (Done / Skip / Snooze)
- Daily state/progress tracking
- ChatGPT plan import (YAML parse, validation, normalization, preview, conflict handling)

What is still being hardened:
- Notification reliability across app states/devices
- Scheduling and rescheduling edge cases
- Runtime verification across iOS/Android environments
- Multi-week plan transitions and week/day activation paths

---

## Core Idea

Many habit tools still require frequent re-planning.

DASH separates:
- **Planning (once)**
- **Execution (daily, low-friction)**

The system is:
- Local-first
- Notification-driven
- Task-by-task (not infinite planning screens)

---

## Tech Stack

- Expo SDK 54 + expo-router
- React Native 0.81 + React 19 + TypeScript
- expo-sqlite (source of truth)
- Zustand (reactive app state)
- expo-notifications (local scheduling)
- YAML parser for ChatGPT imports

No backend. All data is stored locally.

---

## Getting Started

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
- On Windows, use Expo Go on a physical device for iOS/Android testing.
- Expo Go has notification limitations; use a dev build for fuller notification parity.

---

## How Execution Works

### Domains and playbooks

Users select 1-3 domains:
- Morning
- Exercise
- Evening

Each domain has one **active** playbook at a time (imports can include phased playbooks by week/day).

### Daily loop

1. Notification fires at domain trigger time.
2. Tap notification -> app opens TaskCard for that domain.
3. User taps **Done**, **Skip**, or **Snooze**.
4. Next task appears until the playbook is complete.

### Current Skip/Snooze behavior

- **Skip:** logs task as skipped and stores deferral timing (`task_logs.deferred_to`).
  - Before 20:00 -> defer about +60 minutes
  - After 20:00 -> defer to next day at domain trigger time
- **Snooze options:** 10m / 30m / 60m / Later Today
  - Later Today -> 5:00 PM local, or +60m if already past 5:00 PM

---

## Architecture Overview

High-level flow:
1. Plan input (onboarding templates or ChatGPT YAML)
2. Parse + validate + normalize (import flow)
3. Persist in SQLite (`domains`, `playbooks`, `tasks`, `task_logs`, `settings`)
4. Mirror active execution state in Zustand
5. Notifications re-enter the user into TaskCard and drive next actions

Key design choices:
- SQLite over AsyncStorage for structured data + queryable history
- Local-first by default (no auth/backend dependency in current scope)
- One active playbook per domain to simplify daily execution

---

## Project Structure

```text
app/              expo-router screens
src/
  components/     UI components
  db/             schema, migrations, queries, sqlite wrapper
  stores/         Zustand state
  notifications/  scheduling + handlers + permissions
  import/         YAML parsing + validation + prompts + storage
  utils/          time/date/helpers/week progression
  types/          shared TypeScript types
assets/
docs/
```

---

## ChatGPT Import Format (Example)

```yaml
dash_version: 1
plan:
  name: "Simple Routine"
domains:
  - type: morning
    trigger_time: "07:00"
    playbooks:
      - name: "Weekday Routine"
        tasks:
          - title: "Drink water"
            duration: 2
          - title: "Stretch"
            duration: 10
```

---

## Further Reading

- `docs/CHATGPT_INTEGRATION.md` (active import design)
- `docs/dev_workflow.md` (active development/testing workflow)
- `assets/README.md` (asset specs)
- `docs/archive/specs/DASH_MVP_SPEC.md` (legacy spec)
- `docs/archive/specs/MVP_BUILD_CHECKLIST.md` (legacy checklist)
