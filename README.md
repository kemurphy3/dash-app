# DASH

**Execute the plans you’ve already made.**

DASH is a local-first mobile app for following structured plans without having to continuously manage them yourself.

**You decide once. DASH carries the plan forward.**

DASH is not designed for static, identical-every-day habits. It is designed for **plans that evolve over time**:

- a 12-week training block
- a phased skincare regimen
- a rehab progression
- a structured nutrition protocol
- a language-learning schedule

The problem with these systems is not only remembering to act. It is **remembering what changes next**—which week you are in, which phase comes next, what task replaces the old one, and what should activate next.

Most people can make a good plan once. What becomes difficult is **mentally carrying the evolving state** of that plan for weeks or months.

**DASH carries that evolving state for the user.** The planning already happened; the decisions were already made. The user should not have to re-decide every day or hold the entire system in their head.

They just execute.

**Core loop:** get notified → see the next task → tap **Done**, **Skip**, or **Snooze**.

---

## Current status

**Active development. Not production-ready.**

### Working now

- Onboarding (domain selection, templates, trigger times, activation)
- Local-first persistence using SQLite
- Multi-week, phased playbook structure (`duration_weeks`, `week_start` / `week_end`, day filters)
- Task execution loop (Done / Skip / Snooze)
- Daily task state and progress tracking
- ChatGPT YAML import pipeline: parsing, validation, normalization, preview, conflict handling

### Still being hardened

- Notification reliability across app and device states
- Scheduling and rescheduling edge cases
- Runtime verification on iOS and Android hardware
- Multi-week transition handling and activation logic

---

## Why DASH exists

Many productivity and habit systems still require ongoing planning: reorganizing tasks, adjusting priorities, maintaining dashboards, deciding what matters today.

**DASH separates planning from execution.**

- **Planning** happens during onboarding, during import, or when defining a structured program.
- **Execution** becomes one task, at one time, with one decision: do it, defer it, or skip it.

The plan—not a daily brainstorm—is the source of truth.

---

## Core product model

### Domains

The current app exposes **three domain types**:

- **Morning**
- **Exercise**
- **Evening**

These are the shipped slots for routing notifications and playbooks. You can **map** rich programs into them (e.g. skincare → evening, training → exercise, study blocks → morning). Fully custom domain types beyond these three are not in the current product surface—they are a natural direction if the model expands.

### Playbooks

Each domain has **one active playbook at a time.**

Playbooks can:

- span multiple weeks
- activate only on certain days
- evolve through phases (`week_start` / `week_end`)
- change tasks over time via import and week progression

That is how DASH supports **structured programs** rather than a single static checklist that never changes.

---

## Example use cases

| Area | Examples |
|------|----------|
| **Training** | Periodized strength, marathon plans, climbing cycles, return-to-sport |
| **Rehab / PT** | Mobility, load, or ROM progressions over weeks |
| **Skincare** | Retinoid ramps, recovery phases, rotating actives |
| **Nutrition** | Structured protocols with phased rules |
| **Learning** | Language, instruments, certification prep |
| **Wellness / recovery** | Sleep, supplements, therapeutic routines |

---

## Tech stack

- Expo SDK 54 + expo-router
- React Native 0.81 + React 19 + TypeScript (strict)
- expo-sqlite (source of truth)
- Zustand (reactive UI state)
- expo-notifications (local scheduling)
- YAML import pipeline for ChatGPT-generated plans

**No backend.** All data stays on-device.

---

## Architecture overview

1. **Plan input** — onboarding templates and/or ChatGPT YAML import  
2. **Parse → validate → normalize** — schema checks, defaults, conflict handling  
3. **Persist in SQLite** — `domains`, `playbooks`, `tasks`, `task_logs`, `settings`  
4. **Mirror execution in Zustand** — active task flow and UI  
5. **Notifications** — bring the user back into the execution surface (TaskCard)

---

## Design decisions (short)

| Decision | Why |
|----------|-----|
| **Local-first** | Fewer moving parts, offline use, no auth friction for MVP-stage scope |
| **SQLite vs AsyncStorage** | Relational model: logs, dates, phased activations, future review/analytics |
| **Notification-driven UX** | Reduces “what phase am I in?” memory load |
| **Structured import** | ChatGPT handles planning and personalization; DASH handles execution, scheduling, and progression |

---

## How execution works

### Daily loop

1. Notification fires at the domain trigger time (when enabled).
2. User taps the notification.
3. DASH opens into the active task for that domain.
4. User taps **Done**, **Skip**, or **Snooze**.
5. Next task appears until the current run for that activation is complete.

### Skip

Skipped tasks are logged. Deferral is stored on the task log (`deferred_to`).

- **Before 20:00 (local)** → defer roughly **+60 minutes**
- **After 20:00 (local)** → defer to **next day** at the domain’s trigger time

### Snooze

Options: **10 min**, **30 min**, **60 min**, **Later Today**.

- **Later Today:** **17:00 (5:00 PM)** local; if already past that time, **+60 minutes**.

---

## ChatGPT import example

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

See `docs/CHATGPT_INTEGRATION.md` for the full format (multi-week, day filters, conflicts).

---

## Project structure

```text
app/              expo-router screens

src/
  components/     UI components
  db/             schema, migrations, queries, sqlite wrapper
  stores/         Zustand state
  notifications/  scheduling, handlers, permissions
  import/         YAML parsing, validation, prompts, storage
  utils/          time, date, week progression, helpers
  types/          shared TypeScript types

assets/
docs/
```

---

## Running locally

```bash
npm install
npm run typecheck
npm start
```

Additional scripts:

```bash
npm run ios
npm run android
npm run web
npm run lint
```

Health check (recommended):

```bash
npx expo-doctor
```

**Notes**

- iOS Simulator requires macOS and Xcode.
- **Expo Go** can limit notification behavior; fuller testing uses a **development build** and real devices.
- On Windows, use a physical phone + Expo Go or a dev build for device testing.

---

## Current priorities

- Notification reliability
- Runtime / device validation (iOS + Android)
- Multi-week progression stability
- Stronger review / analytics on execution data
- Import UX (prompts, errors, preview clarity)

---

## Further reading

- `docs/CHATGPT_INTEGRATION.md` — import format and flow  
- `docs/dev_workflow.md` — development and verification workflow  
- `assets/README.md` — icon and splash specs  
- `docs/archive/specs/DASH_MVP_SPEC.md` — legacy product spec  
- `docs/archive/specs/MVP_BUILD_CHECKLIST.md` — legacy build checklist  
