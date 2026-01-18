import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, startOfWeek, isMonday, isSameDay, parseISO } from 'date-fns';
import { getDatabase } from '../db';

const LAST_WEEK_CHECK_KEY = 'dash_last_week_check';

/**
 * Check if we need to advance week counters for multi-week plans
 * Should be called on every app open
 */
export async function checkAndAdvanceWeeks(): Promise<{ advanced: boolean; newWeek: number | null }> {
  const db = getDatabase();
  const today = new Date();
  
  // Get the last time we checked
  const lastCheckStr = await AsyncStorage.getItem(LAST_WEEK_CHECK_KEY);
  const lastCheck = lastCheckStr ? parseISO(lastCheckStr) : null;
  
  // Get start of current week (Monday)
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  
  // If we've already checked this week, skip
  if (lastCheck && isSameDay(startOfWeek(lastCheck, { weekStartsOn: 1 }), currentWeekStart)) {
    console.log('[WeekProgression] Already checked this week');
    return { advanced: false, newWeek: null };
  }
  
  // Check if plans table exists (only created after first import)
  const tableExists = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='plans'"
  );
  
  if (!tableExists) {
    // No plans table yet - user hasn't imported anything
    await AsyncStorage.setItem(LAST_WEEK_CHECK_KEY, today.toISOString());
    return { advanced: false, newWeek: null };
  }
  
  // If this is a new week (and we have a previous check), advance the plans
  if (lastCheck) {
    const lastWeekStart = startOfWeek(lastCheck, { weekStartsOn: 1 });
    
    if (currentWeekStart > lastWeekStart) {
      console.log('[WeekProgression] New week detected, advancing plans...');
      
      // Get all plans with duration_weeks set
      const plans = await db.getAllAsync<{
        id: string;
        name: string;
        duration_weeks: number | null;
        current_week: number;
      }>('SELECT id, name, duration_weeks, current_week FROM plans WHERE duration_weeks IS NOT NULL');
      
      for (const plan of plans) {
        if (plan.current_week < (plan.duration_weeks || 0)) {
          const newWeek = plan.current_week + 1;
          await db.runAsync(
            'UPDATE plans SET current_week = ? WHERE id = ?',
            [newWeek, plan.id]
          );
          console.log(`[WeekProgression] Plan "${plan.name}" advanced to week ${newWeek}`);
          
          // Update active playbooks for this plan's domains
          await updateActivePlaybooksForPlan(db, plan.id, newWeek);
        }
      }
      
      // Save the check timestamp
      await AsyncStorage.setItem(LAST_WEEK_CHECK_KEY, today.toISOString());
      
      const firstPlan = plans[0];
      return { 
        advanced: plans.length > 0, 
        newWeek: firstPlan ? firstPlan.current_week + 1 : null 
      };
    }
  }
  
  // Save the check timestamp (first run or same week)
  await AsyncStorage.setItem(LAST_WEEK_CHECK_KEY, today.toISOString());
  
  return { advanced: false, newWeek: null };
}

/**
 * Update active playbooks for a plan based on current week and day
 */
async function updateActivePlaybooksForPlan(
  db: SQLite.SQLiteDatabase, 
  planId: string, 
  currentWeek: number
): Promise<void> {
  const today = new Date();
  const dayOfWeek = format(today, 'EEE').toLowerCase().slice(0, 3); // 'mon', 'tue', etc.
  
  // Get all domains that have playbooks from this plan
  const domains = await db.getAllAsync<{ id: string }>(
    `SELECT DISTINCT d.id 
     FROM domains d 
     JOIN playbooks p ON p.domain_id = d.id 
     WHERE p.plan_id = ?`,
    [planId]
  );
  
  for (const domain of domains) {
    const bestPlaybook = await findBestPlaybookForDomain(
      db, 
      domain.id, 
      planId, 
      currentWeek, 
      dayOfWeek
    );
    
    if (bestPlaybook) {
      await db.runAsync(
        'UPDATE domains SET active_playbook_id = ? WHERE id = ?',
        [bestPlaybook.id, domain.id]
      );
      console.log(`[WeekProgression] Domain ${domain.id} now using playbook "${bestPlaybook.name}"`);
    }
  }
}

/**
 * Find the best playbook for a domain based on current week and day
 */
async function findBestPlaybookForDomain(
  db: SQLite.SQLiteDatabase,
  domainId: string,
  planId: string,
  currentWeek: number,
  dayOfWeek: string
): Promise<{ id: string; name: string } | null> {
  // Get all playbooks for this domain and plan
  const playbooks = await db.getAllAsync<{
    id: string;
    name: string;
    week_start: number | null;
    week_end: number | null;
    active_days: string | null;
  }>(
    `SELECT id, name, week_start, week_end, active_days 
     FROM playbooks 
     WHERE domain_id = ? AND plan_id = ?`,
    [domainId, planId]
  );
  
  // Filter to playbooks that match current week
  const weekMatches = playbooks.filter(p => {
    if (p.week_start === null) return true; // No week restriction
    const weekEnd = p.week_end || p.week_start;
    return currentWeek >= p.week_start && currentWeek <= weekEnd;
  });
  
  // Filter to playbooks that match current day
  const dayMatches = weekMatches.filter(p => {
    if (!p.active_days) return true; // No day restriction
    try {
      const days = JSON.parse(p.active_days) as string[];
      return days.includes(dayOfWeek);
    } catch {
      return true;
    }
  });
  
  // If no day matches, fall back to week matches
  const candidates = dayMatches.length > 0 ? dayMatches : weekMatches;
  
  if (candidates.length === 0) {
    return playbooks[0] || null; // Fall back to first playbook
  }
  
  // Return the most specific match (highest week_start)
  return candidates.reduce((best, current) => {
    const bestWeek = best.week_start || 0;
    const currentWeekStart = current.week_start || 0;
    return currentWeekStart > bestWeek ? current : best;
  });
}

/**
 * Get current week for a plan
 */
export async function getPlanCurrentWeek(planId: string): Promise<number> {
  const db = getDatabase();
  const result = await db.getFirstAsync<{ current_week: number }>(
    'SELECT current_week FROM plans WHERE id = ?',
    [planId]
  );
  return result?.current_week || 1;
}

/**
 * Force refresh active playbooks for all domains based on current date
 * Useful when user changes date or after week progression
 */
export async function refreshActivePlaybooks(): Promise<void> {
  const db = getDatabase();
  const today = new Date();
  const dayOfWeek = format(today, 'EEE').toLowerCase().slice(0, 3);
  
  // Get all plans
  const plans = await db.getAllAsync<{
    id: string;
    current_week: number;
  }>('SELECT id, current_week FROM plans');
  
  for (const plan of plans) {
    await updateActivePlaybooksForPlan(db, plan.id, plan.current_week);
  }
  
  console.log('[WeekProgression] Refreshed active playbooks for all domains');
}
