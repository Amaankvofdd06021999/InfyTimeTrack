import type { State, DayEntry } from "./store";
import { computeBadges, dateKey, FULL_DAY_HOURS, levelFromPoints, monthKey, parseKey, pointsForDay, todayKey } from "./utils";

export interface MonthStats {
  wfhCount: number;
  wfoFullCount: number;
  wfoPartialCount: number;
  officeHours: number;
  wfhLeft: number;
  wfhUsed: number;
}

export function monthEntries(state: State, view: Date): { key: string; entry: DayEntry }[] {
  const prefix = monthKey(view);
  return Object.entries(state.days)
    .filter(([k]) => k.startsWith(prefix))
    .map(([key, entry]) => ({ key, entry }))
    .sort((a, b) => (a.key < b.key ? 1 : -1));
}

export function monthStats(state: State, view: Date): MonthStats {
  const entries = monthEntries(state, view);
  let wfhCount = 0;
  let wfoFullCount = 0;
  let wfoPartialCount = 0;
  let officeHours = 0;
  for (const { entry } of entries) {
    if (entry.type === "wfh") wfhCount++;
    else {
      const h = entry.hours;
      if (h == null || h >= FULL_DAY_HOURS) {
        wfoFullCount++;
        officeHours += h ?? FULL_DAY_HOURS;
      } else {
        wfoPartialCount++;
        officeHours += h;
      }
    }
  }
  return {
    wfhCount,
    wfoFullCount,
    wfoPartialCount,
    officeHours: +officeHours.toFixed(2),
    wfhUsed: wfhCount,
    wfhLeft: Math.max(0, state.allowance - wfhCount),
  };
}

export function bestStreak(state: State): number {
  // Longest consecutive streak of any-logged day.
  const keys = Object.keys(state.days).sort();
  if (keys.length === 0) return 0;
  let best = 1;
  let cur = 1;
  for (let i = 1; i < keys.length; i++) {
    const prev = parseKey(keys[i - 1]);
    const now = parseKey(keys[i]);
    const diff = Math.round((now.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      cur++;
      best = Math.max(best, cur);
    } else if (diff !== 0) {
      cur = 1;
    }
  }
  return best;
}

export function currentStreak(state: State): number {
  let d = new Date();
  let count = 0;
  // If today isn't logged, start from yesterday so the streak survives a not-yet-logged today.
  if (!state.days[dateKey(d)]) d.setDate(d.getDate() - 1);
  while (state.days[dateKey(d)]) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

export function totalPoints(state: State): number {
  return Object.values(state.days).reduce((s, e) => s + pointsForDay(e), 0);
}

export function gamification(state: State) {
  const pts = totalPoints(state);
  const lvl = levelFromPoints(pts);
  const streak = currentStreak(state);
  const best = bestStreak(state);
  const totalDays = Object.keys(state.days).length;
  const wfoFull = Object.values(state.days).filter((e) => e.type === "wfo" && (e.hours == null || e.hours >= FULL_DAY_HOURS)).length;
  const wfoPartial = Object.values(state.days).filter((e) => e.type === "wfo" && e.hours != null && e.hours < FULL_DAY_HOURS).length;
  const wfhTotal = Object.values(state.days).filter((e) => e.type === "wfh").length;
  const monthsTracked = new Set(Object.keys(state.days).map((k) => k.slice(0, 7))).size;
  const badges = computeBadges({ totalDays, wfoFull, wfoPartial, wfhTotal, bestStreak: best, monthsTracked });
  return { points: pts, level: lvl, streak, best, badges, totalDays };
}

export function todayEntry(state: State) {
  return state.days[todayKey()];
}
