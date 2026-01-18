# DASH × ChatGPT Integration

## Overview

The ChatGPT import system is a **core feature** of DASH, not an afterthought. It solves the fundamental problem: people create excellent plans in ChatGPT but those plans get lost in walls of text and never get executed.

## The Key Insight

Users already use ChatGPT to plan:
- Workout programs
- Meal plans  
- Skincare routines
- Study schedules
- Marathon training
- Morning/evening routines

The failure isn't planning—it's **execution**. DASH captures plans from ChatGPT and turns them into daily directive notifications.

## How It Works

### User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1. User goes to ChatGPT                                       │
│      - Either starts fresh or has existing conversation         │
│                                                                 │
│   2. User pastes DASH prompt                                    │
│      - "Fresh Start" for new plans                              │
│      - "Export Existing" to convert existing conversation       │
│                                                                 │
│   3. ChatGPT workshopss & outputs YAML                          │
│      - Asks clarifying questions                                │
│      - Creates personalized plan                                │
│      - Outputs in strict DASH format                            │
│                                                                 │
│   4. User copies YAML to DASH                                   │
│      - Paste in import screen                                   │
│      - Or share directly from ChatGPT app                       │
│                                                                 │
│   5. DASH validates, previews, activates                        │
│      - Shows warnings if plan seems ambitious                   │
│      - Handles conflicts with existing playbooks                │
│      - Schedules notifications immediately                      │
│                                                                 │
│   6. User receives notifications & executes                     │
│      - "Time for: [exact task instruction]"                     │
│      - Done / Skip / Snooze                                     │
│      - No re-deciding required                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### The Two Prompts

**1. Fresh Start Prompt**
For users who want to create a new plan:
- Explains DASH format to ChatGPT
- Encourages dialogue and clarifying questions
- Includes YAML template
- User fills in their goal at the end

**2. Export Existing Prompt**  
For users who already have a plan in ChatGPT:
- Tells ChatGPT to look at previous conversation
- Converts existing plan to DASH format
- No need to re-explain goals

### YAML Format

```yaml
dash_version: 1
plan:
  name: "Plan Name"
  description: "Brief description"
  created: 2025-01-15
  duration_weeks: 12  # Optional, for multi-week plans

domains:
  - type: morning | exercise | evening
    trigger_time: "07:00"
    playbooks:
      - name: "Playbook Name"
        week_start: 1     # Optional
        week_end: 4       # Optional
        days: [mon, wed, fri]  # Optional
        tasks:
          - title: "Do exactly this thing"
            description: "Optional detail"
            duration: 5  # minutes
```

## Architecture

```
src/import/
├── types.ts      # Type definitions for import format
├── parser.ts     # YAML parsing and validation
├── prompts.ts    # ChatGPT prompt templates
├── storage.ts    # Database operations for imported plans
└── index.ts      # Public API

src/stores/
└── importStore.ts  # Zustand store for import flow state

app/(main)/import/
├── _layout.tsx   # Stack navigator
├── index.tsx     # Paste input screen
├── preview.tsx   # Preview plan before activation  
├── conflicts.tsx # Resolve existing playbook conflicts
└── success.tsx   # Activation confirmation

src/components/
├── ImportButton.tsx     # Entry point button
└── PromptCopySheet.tsx  # Help sheet for getting prompts
```

## Key Design Decisions

### 1. No LLM Inside DASH
The import is pure parsing. No API calls, no intelligence—just deterministic validation. This means:
- Works offline
- No API costs
- No rate limits
- Fast and predictable

### 2. Strict Format, Flexible Defaults
The YAML format is strict but DASH applies sensible defaults:
- Missing duration → 5 minutes
- Missing trigger_time → domain default
- Missing days → all 7 days

### 3. Warnings, Not Blocks
DASH warns about ambitious plans but doesn't prevent them:
- "This playbook has 15 tasks—consider breaking it up"
- "Total daily time is 3 hours—that's ambitious!"

The user made the plan with ChatGPT. DASH trusts their decision.

### 4. Multi-Week Support
Plans can span weeks (e.g., 12-week marathon program):
- Playbooks have `week_start` and `week_end`
- DASH auto-advances the week
- Different playbooks activate as weeks progress

### 5. Day Filtering  
Playbooks can run on specific days:
- `days: [mon, wed, fri]` for 3x/week workouts
- Different playbooks for different days

## Error Handling

### Parse Errors (Block Import)
- Invalid YAML syntax
- Missing `dash_version`
- Unknown domain type
- Empty playbooks

### Warnings (Allow with Notice)
- Duration exceeds 120 minutes (capped)
- More than 10 tasks per playbook
- Total daily time exceeds 2 hours

### Silent Auto-Fixes
- Duration < 1 minute → 1 minute
- Duration > 120 minutes → 120 minutes
- Missing duration → 5 minutes
- Invalid day names → filtered out

## Testing the Import

### Valid Import Test
```yaml
dash_version: 1
plan:
  name: "Test Morning Routine"
  description: "Quick test import"
  created: 2025-01-15

domains:
  - type: morning
    trigger_time: "07:00"
    playbooks:
      - name: "Wake Up Right"
        tasks:
          - title: "Drink a glass of water"
            duration: 1
          - title: "Make your bed"
            duration: 2
          - title: "10 minutes of stretching"
            description: "Focus on neck and back"
            duration: 10
```

### Edge Cases to Test
1. Very long plan names (should truncate)
2. Missing optional fields (should use defaults)
3. Future week_start values (should work for phased plans)
4. Overlapping playbooks on same day (should warn)
5. All domains skipped in conflict resolution (should block)

## Future Enhancements (Not V1)

1. **QR Code Export**: ChatGPT displays QR, DASH scans it
2. **ChatGPT Plugin**: Native DASH export button in ChatGPT
3. **Plan Versioning**: Re-import updated plans without losing progress
4. **Template Marketplace**: Share plans with other users
5. **Progress Sync**: Export DASH progress back to ChatGPT for adjustment

## Why This Matters

The ChatGPT → DASH handoff creates a clean separation of concerns:

- **ChatGPT**: Decisions, personalization, dialogue, planning
- **DASH**: Execution, notifications, accountability, streaks

This means:
1. Users don't need DASH to be "smart"—ChatGPT already is
2. DASH can focus purely on execution UX
3. Plans carry the weight of a prior decision ("You already decided this")
4. No re-negotiation with the app every day

The integration positions DASH as the **execution layer for AI-generated plans**—a durable and defensible product position.
