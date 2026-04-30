# DASH MVP - Complete Technical Specification

## 1. MVP Definition of Done

### Core Functionality
- [ ] User can complete onboarding in under 3 minutes
- [ ] User can select 1-3 domains (Morning, Exercise, Evening)
- [ ] User can choose from 3-5 template playbooks per domain
- [ ] User can set trigger times for each domain
- [ ] User can view and edit playbooks (add/remove/reorder tasks)
- [ ] User receives local notifications at scheduled times
- [ ] User can mark tasks as Done, Skip, or Snooze
- [ ] User can view weekly summary with completion stats
- [ ] User can configure quiet hours and notification preferences
- [ ] All data persists locally via SQLite
- [ ] App works fully offline

### UX Requirements
- [ ] No guilt-inducing copy anywhere
- [ ] Skip does not trigger negative feedback
- [ ] Streaks are hidden by default (optional toggle)
- [ ] Task cards show specific instructions, not categories
- [ ] Notifications are directive: "Do this now"

### Technical Requirements
- [ ] Expo SDK 50+
- [ ] TypeScript strict mode
- [ ] SQLite local persistence
- [ ] Local notifications with proper scheduling
- [ ] Handles app backgrounding/foregrounding
- [ ] Handles notification permission flow

---

## 2. App IA + Screen List

### Navigation Structure
```
Root (Stack)
├── Onboarding (Stack) - shown if !hasCompletedOnboarding
│   ├── 1. Welcome
│   ├── 2. DomainSelection
│   ├── 3. PlaybookSelection (per domain)
│   ├── 4. TimeSelection
│   └── 5. Confirmation
│
└── Main (Tab)
    ├── Today (Stack)
    │   ├── TodayFeed
    │   └── TaskCard (modal)
    │
    ├── Playbooks (Stack)
    │   ├── PlaybookList
    │   ├── PlaybookDetail
    │   └── TaskEdit (modal)
    │
    ├── Review (Stack)
    │   └── WeeklyReview
    │
    └── Settings (Stack)
        └── SettingsMain
```

### Screen List (Numbered)
1. Welcome - App intro, value prop, "Get Started" CTA
2. DomainSelection - Pick 1-3 domains with toggle cards
3. PlaybookSelection - Choose template for each selected domain
4. TimeSelection - Set trigger time for each domain
5. Confirmation - Review setup, "Activate" CTA
6. TodayFeed - Current/next tasks, quick status
7. TaskCard - Full-screen task execution UI
8. PlaybookList - All user playbooks by domain
9. PlaybookDetail - View/edit tasks in a playbook
10. TaskEdit - Edit individual task details
11. WeeklyReview - Stats, patterns, adjust CTAs
12. SettingsMain - Quiet hours, streaks toggle, notifications

---

## 3. Key User Flows

### Flow A: Onboarding (First Launch)
```
1. User opens app → Welcome screen
2. Tap "Get Started" → DomainSelection
3. Toggle ON desired domains (1-3) → Tap "Continue"
4. For each selected domain:
   - Show PlaybookSelection with 3-5 templates
   - User taps one to preview tasks
   - User confirms selection
5. TimeSelection screen shows all selected domains
   - User sets time for each (default provided)
6. Confirmation screen shows summary
   - User taps "Activate DASH"
7. Request notification permission
8. Navigate to TodayFeed
9. Mark onboarding complete in storage
```

### Flow B: Daily Execution
```
1. Notification fires at domain trigger time
   - Title: "DASH: Morning Routine"
   - Body: "Time for: [First task title]"
2. User taps notification → App opens to TaskCard
3. TaskCard shows:
   - Task title (large)
   - Description (if any)
   - Duration badge
   - Done / Skip / Snooze buttons
4. User taps "Done":
   - Log completion
   - Advance to next task OR show "Playbook complete!" if last
5. User taps "Skip":
   - Log skip
   - Advance to next task
   - (Skipped task is NOT rescheduled in V1 - simplicity)
6. User taps "Snooze":
   - Show options: 10m, 30m, 60m, Later Today
   - Reschedule notification
   - Return to previous screen or minimize
7. When playbook completes:
   - Show completion celebration (subtle)
   - Cancel remaining notifications for that domain today
```

### Flow C: Edit Playbook
```
1. User navigates to Playbooks tab
2. Sees list of domains with active playbooks
3. Taps a domain → PlaybookDetail
4. Can:
   - Rename playbook (tap title)
   - Reorder tasks (drag handles)
   - Delete task (swipe or tap delete)
   - Add task (+ button)
   - Edit task (tap task) → TaskEdit modal
5. Changes auto-save
6. If trigger time changed → reschedule notifications
```

### Flow D: Weekly Review
```
1. User navigates to Review tab
2. Sees current week stats:
   - Total tasks completed / total scheduled
   - Completion % per domain (bar chart)
   - Most skipped task (if any)
   - Most consistent domain
3. "Adjust Playbooks" CTA → navigates to Playbooks tab
4. Week resets on Monday 00:00 local time
```

---

## 4. Architecture

### Module Structure
```
src/
├── app/                    # Expo Router screens
├── components/             # Reusable UI components
├── db/                     # SQLite database layer
│   ├── schema.ts          # Table definitions
│   ├── migrations.ts      # Schema migrations
│   ├── queries.ts         # CRUD operations
│   └── index.ts           # DB initialization
├── stores/                 # Zustand state management
│   ├── appStore.ts        # Global app state
│   ├── onboardingStore.ts # Onboarding flow state
│   └── executionStore.ts  # Current execution state
├── notifications/          # Notification logic
│   ├── scheduler.ts       # Schedule/cancel notifications
│   ├── handlers.ts        # Handle notification events
│   └── permissions.ts     # Permission requests
├── constants/              # Static data
│   ├── templates.ts       # Playbook templates
│   └── theme.ts           # Colors, typography
├── utils/                  # Helper functions
│   ├── time.ts            # Time formatting
│   ├── analytics.ts       # Analytics stub
│   └── date.ts            # Date calculations
└── types/                  # TypeScript types
    └── index.ts
```

### State Management Approach
- **Zustand** for reactive UI state
- **SQLite** as source of truth for persistent data
- Pattern: Load from SQLite → Zustand → UI subscribes to Zustand
- On mutation: Update SQLite first → then sync to Zustand

### Storage Strategy
- All data local-first in SQLite
- No backend in V1
- AsyncStorage for simple flags (hasCompletedOnboarding)

### Notification Architecture
- Use expo-notifications for local notifications
- Schedule all notifications for the day at midnight or on app open
- Reschedule when:
  - User changes trigger time
  - User snoozes a task
  - Playbook is edited
- Cancel domain notifications when playbook completes for the day

---

## 5. Notification + Rescheduling Rules

### Scheduling Rules
1. **Initial Schedule**: When user completes onboarding, schedule notifications for all active domains for today (if trigger time hasn't passed) and tomorrow.
2. **Daily Refresh**: At midnight local time (or on app open if missed), schedule notifications for today.
3. **Trigger Time**: Each domain has one notification at its trigger_time.
4. **Notification Content**:
   - Title: "DASH: {Domain Name}"
   - Body: "Time for: {First incomplete task title}"

### Snooze Rules
- **10 minutes**: Reschedule notification for now + 10 minutes
- **30 minutes**: Reschedule notification for now + 30 minutes  
- **60 minutes**: Reschedule notification for now + 60 minutes
- **Later Today**: Reschedule for 2 hours from now, or 8 PM if less than 2 hours until midnight

### Skip Rules (V1 - Simplified)
- Skip logs the task as skipped
- Does NOT reschedule the task
- User can re-attempt by manually opening the playbook
- Rationale: Keeps V1 simple, avoids infinite skip loops

### Completion Rules
- When all tasks in a playbook are marked Done or Skip for today:
  - Cancel any pending notifications for that domain
  - Mark domain as "completed" for today
  - Domain resets at midnight

### Quiet Hours Rules
- If quiet hours are enabled (e.g., 10 PM - 7 AM):
  - Do not fire notifications during this window
  - If a trigger time falls in quiet hours, delay to quiet hours end
  - Snoozed notifications also respect quiet hours

### Edge Cases
- **App killed**: Notifications still fire (OS-level local notifications)
- **App opened via notification**: Navigate directly to TaskCard
- **Multiple domains at same time**: Fire separate notifications, each opens its own flow
- **User disables domain notifications**: Remove scheduled notifications for that domain

---

## 6. Database Schema

```sql
-- Domains represent the three life areas
CREATE TABLE domains (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('morning', 'exercise', 'evening')),
  trigger_time TEXT NOT NULL, -- HH:MM format, 24-hour
  active_playbook_id TEXT,
  notifications_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (active_playbook_id) REFERENCES playbooks(id)
);

-- Playbooks are collections of tasks
CREATE TABLE playbooks (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_template INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (domain_id) REFERENCES domains(id)
);

-- Tasks are individual actions within a playbook
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  playbook_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 5,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE CASCADE
);

-- TaskLogs track execution history
CREATE TABLE task_logs (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  domain_id TEXT NOT NULL,
  scheduled_date TEXT NOT NULL, -- YYYY-MM-DD format
  status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'skipped')),
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (domain_id) REFERENCES domains(id)
);

-- App settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX idx_task_logs_date ON task_logs(scheduled_date);
CREATE INDEX idx_task_logs_domain ON task_logs(domain_id, scheduled_date);
CREATE INDEX idx_tasks_playbook ON tasks(playbook_id, sort_order);
```

---

## 7. Expo Project Scaffold

```
dash-app/
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
├── app/
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Entry redirect
│   ├── (onboarding)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── domains.tsx
│   │   ├── playbooks.tsx
│   │   ├── times.tsx
│   │   └── confirm.tsx
│   └── (main)/
│       ├── _layout.tsx          # Tab navigator
│       ├── today/
│       │   ├── _layout.tsx
│       │   ├── index.tsx        # TodayFeed
│       │   └── task.tsx         # TaskCard
│       ├── playbooks/
│       │   ├── _layout.tsx
│       │   ├── index.tsx        # PlaybookList
│       │   └── [id].tsx         # PlaybookDetail
│       ├── review/
│       │   └── index.tsx        # WeeklyReview
│       └── settings/
│           └── index.tsx        # SettingsMain
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── DomainCard.tsx
│   │   ├── TaskItem.tsx
│   │   ├── PlaybookPreview.tsx
│   │   ├── TimePicker.tsx
│   │   ├── ProgressBar.tsx
│   │   └── StatCard.tsx
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   ├── migrations.ts
│   │   └── queries.ts
│   ├── stores/
│   │   ├── appStore.ts
│   │   ├── onboardingStore.ts
│   │   └── executionStore.ts
│   ├── notifications/
│   │   ├── index.ts
│   │   ├── scheduler.ts
│   │   ├── handlers.ts
│   │   └── permissions.ts
│   ├── constants/
│   │   ├── templates.ts
│   │   └── theme.ts
│   ├── utils/
│   │   ├── time.ts
│   │   ├── date.ts
│   │   └── analytics.ts
│   └── types/
│       └── index.ts
└── assets/
    ├── icon.png
    ├── splash.png
    └── adaptive-icon.png
```

---

## 8. Analytics Events (Stub Interface)

```typescript
// Event names and when they fire
const ANALYTICS_EVENTS = {
  // Onboarding
  'onboarding_started': {}, // Welcome screen viewed
  'onboarding_domains_selected': { domains: string[] },
  'onboarding_playbook_selected': { domain: string, playbook_name: string },
  'onboarding_times_set': { domains: { type: string, time: string }[] },
  'onboarding_completed': { domain_count: number },
  
  // Execution
  'task_viewed': { task_id: string, domain: string },
  'task_completed': { task_id: string, domain: string },
  'task_skipped': { task_id: string, domain: string },
  'task_snoozed': { task_id: string, domain: string, snooze_minutes: number },
  'playbook_completed': { domain: string, completed_count: number, skipped_count: number },
  
  // Engagement
  'app_opened': { source: 'notification' | 'direct' },
  'notification_received': { domain: string },
  'weekly_review_viewed': {},
  
  // Settings
  'quiet_hours_changed': { enabled: boolean, start?: string, end?: string },
  'streaks_toggled': { enabled: boolean },
  'domain_notifications_toggled': { domain: string, enabled: boolean },
  
  // Editing
  'playbook_edited': { playbook_id: string, action: 'rename' | 'add_task' | 'remove_task' | 'reorder' },
  'task_edited': { task_id: string },
};
```

---

## 9. Test Plan

### Manual QA Steps

#### Onboarding Flow
1. Fresh install → Should see Welcome screen
2. Complete onboarding with 1 domain → Should work
3. Complete onboarding with 3 domains → Should work
4. Set trigger time in the past for today → Should not fire notification today
5. Complete onboarding → Should see TodayFeed
6. Kill app and reopen → Should stay on TodayFeed, not restart onboarding

#### Notification Flow
7. Set trigger time 1 minute in future → Notification should fire
8. Tap notification → Should open TaskCard for correct domain
9. Complete all tasks → No more notifications for that domain today
10. Snooze 10 minutes → Notification should fire in ~10 minutes
11. Enable quiet hours → Notifications during quiet hours should be delayed

#### Task Execution
12. Tap Done → Task should log as completed, advance to next
13. Tap Skip → Task should log as skipped, advance to next
14. Complete last task → Should see completion message
15. Open completed playbook → Should show all tasks with status

#### Playbook Editing
16. Add new task → Should appear at bottom
17. Reorder tasks → Order should persist
18. Delete task → Should be removed
19. Rename playbook → Name should persist
20. Edit task details → Changes should persist

#### Weekly Review
21. Complete some tasks, skip others → Stats should be accurate
22. View review on Monday → Should show previous week
23. "Adjust" CTA → Should navigate to Playbooks

#### Settings
24. Toggle quiet hours ON → Notifications should respect it
25. Toggle domain notifications OFF → No notifications for that domain
26. Toggle streaks ON → Streak count should appear

### Edge Cases to Verify
- [ ] App killed mid-playbook → State should persist
- [ ] Phone restarted → Notifications should still be scheduled
- [ ] Time zone change → Trigger times should remain in local time
- [ ] Playbook with 0 tasks → Should handle gracefully
- [ ] Two domains at same trigger time → Both notifications fire
- [ ] Notification permission denied → App should still function without notifications
- [ ] Skip all tasks → Playbook should complete, no infinite loop
- [ ] Edit playbook mid-execution → Current progress should be preserved

---

## 10. Assumptions Made

1. **V1 is iOS + Android** via Expo, no web support
2. **Week starts Monday** for weekly review purposes
3. **No user accounts** - purely local data
4. **Templates are hardcoded** - not fetched from server
5. **Snooze "Later Today"** = 2 hours or 8 PM, whichever is sooner
6. **Skip does NOT reschedule** - simplifies V1 logic
7. **One playbook per domain** at a time
8. **Tasks have no dependencies** - can be completed in any order (though displayed in order)
9. **Duration is for display only** - no enforced timers
10. **Streaks count consecutive days with ≥1 completed task** (when enabled)
