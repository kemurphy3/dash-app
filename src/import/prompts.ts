// ============================================================
// CHATGPT PROMPT TEMPLATES
// These are the prompts users copy to ChatGPT to generate DASH-compatible plans
// ============================================================

/**
 * The "Fresh Start" prompt - for users who want ChatGPT to help them
 * create a new plan from scratch through dialogue
 */
export const FRESH_START_PROMPT = `I want you to help me create a structured plan that I'll import into DASH, an app that handles daily execution through notifications. DASH removes the need to re-decide anything—it just tells me exactly what to do and when.

**How this works:**
1. First, we'll have a conversation where you understand my goals, constraints, and preferences.
2. Ask me clarifying questions if needed, but prefer sensible defaults over excessive questions.
3. When the plan is ready, output it in DASH's exact YAML format (I'll show you the format below).
4. The final output should be ONLY the YAML—no explanations, no preamble, no "here's your plan."

**DASH Format Rules:**
- Domains must be one of: \`morning\`, \`exercise\`, or \`evening\`
- Times are 24-hour format: "06:00", "18:30", etc.
- Task durations are in minutes (1-120)
- Task titles must be imperative commands ("Do X", "Run Y", not "You should...")
- Multi-week plans use \`week_start\` and \`week_end\` (1-indexed)
- Day filters use: \`[mon, tue, wed, thu, fri, sat, sun]\`

**YAML Template:**
\`\`\`yaml
dash_version: 1
plan:
  name: "Plan Name"
  description: "Brief description"
  created: YYYY-MM-DD
  duration_weeks: NUMBER  # optional, for phased plans

domains:
  - type: morning | exercise | evening
    trigger_time: "HH:MM"
    playbooks:
      - name: "Playbook Name"
        week_start: 1        # optional
        week_end: 4          # optional  
        days: [mon, wed, fri] # optional, defaults to all
        tasks:
          - title: "Imperative task instruction"
            description: "Optional additional detail"
            duration: MINUTES
\`\`\`

**What I want to plan:**
[DESCRIBE YOUR GOAL HERE - e.g., "A 12-week marathon training plan. I'm running Boston in April, currently running 20 miles/week, goal is sub-4 hours."]

Start by asking me any essential clarifying questions, then build the plan.`;

/**
 * The "Export Existing" prompt - for users who ALREADY have a plan
 * in their ChatGPT conversation and want to convert it to DASH format
 */
export const EXPORT_EXISTING_PROMPT = `I have a plan we discussed earlier in this conversation. Please convert it to DASH format so I can import it into my execution app.

**DASH Format Rules:**
- Domains must be one of: \`morning\`, \`exercise\`, or \`evening\` (pick the best fit for each part of the plan)
- Times are 24-hour format: "06:00", "18:30", etc.
- Task durations are in minutes (1-120)
- Task titles must be imperative commands ("Do X", "Run Y", not "You should...")
- Multi-week plans use \`week_start\` and \`week_end\` (1-indexed)
- Day filters use: \`[mon, tue, wed, thu, fri, sat, sun]\`

**Output ONLY the YAML below—no explanations:**

\`\`\`yaml
dash_version: 1
plan:
  name: "Plan Name"
  description: "Brief description"
  created: YYYY-MM-DD
  duration_weeks: NUMBER  # optional, for phased plans

domains:
  - type: morning | exercise | evening
    trigger_time: "HH:MM"
    playbooks:
      - name: "Playbook Name"
        week_start: 1        # optional
        week_end: 4          # optional  
        days: [mon, wed, fri] # optional, defaults to all
        tasks:
          - title: "Imperative task instruction"
            description: "Optional additional detail"
            duration: MINUTES
\`\`\`

Convert the plan we discussed into this exact format now.`;

/**
 * A shorter "quick export" prompt for users who just want the format
 * without the full instructions
 */
export const QUICK_EXPORT_PROMPT = `Convert everything we discussed into DASH YAML format. Use this exact structure:

\`\`\`yaml
dash_version: 1
plan:
  name: "Name"
  description: "Description"
  created: YYYY-MM-DD
  duration_weeks: N

domains:
  - type: morning | exercise | evening
    trigger_time: "HH:MM"
    playbooks:
      - name: "Name"
        days: [mon, tue, wed, thu, fri, sat, sun]
        tasks:
          - title: "Imperative instruction"
            duration: MINUTES
\`\`\`

Output ONLY the YAML, no explanations.`;

/**
 * Example suggestions for what to plan
 * Used in the UI to give users ideas
 */
export const PLAN_SUGGESTIONS = [
  {
    title: 'Marathon Training',
    description: '12-16 week progressive running plan',
    prompt: 'A 12-week marathon training plan. I can run mornings at 6am, currently running 15-20 miles/week. Goal is to finish my first marathon.',
  },
  {
    title: 'Skincare Routine',
    description: 'AM/PM skincare with products you own',
    prompt: 'A daily skincare routine for combination skin. I have: cleanser, vitamin C serum, moisturizer, sunscreen, retinol, and eye cream.',
  },
  {
    title: 'Strength Training',
    description: '3-4 day split for building muscle',
    prompt: 'A 4-day strength training program. I have access to a full gym, can work out in the evenings around 6pm. Goal is to build muscle and strength.',
  },
  {
    title: 'Morning Routine',
    description: 'Optimized start to your day',
    prompt: 'A morning routine to help me be more productive. I need to leave for work by 8:30am and want to include exercise, breakfast, and some personal time.',
  },
  {
    title: 'Study Plan',
    description: 'Structured learning schedule',
    prompt: 'A study plan to learn Spanish over 8 weeks. I can dedicate 30-45 minutes in the mornings and 20 minutes in the evenings.',
  },
  {
    title: 'Evening Wind-down',
    description: 'Better sleep through better habits',
    prompt: 'An evening routine to improve my sleep. I want to be in bed by 10:30pm and need help disconnecting from screens and relaxing.',
  },
];

/**
 * Get the appropriate prompt based on context
 */
export function getPromptForContext(hasExistingConversation: boolean): string {
  return hasExistingConversation ? EXPORT_EXISTING_PROMPT : FRESH_START_PROMPT;
}

/**
 * Build a complete prompt with the user's specific goal
 */
export function buildFreshStartPrompt(goal: string): string {
  return FRESH_START_PROMPT.replace(
    '[DESCRIBE YOUR GOAL HERE - e.g., "A 12-week marathon training plan. I\'m running Boston in April, currently running 20 miles/week, goal is sub-4 hours."]',
    goal
  );
}
