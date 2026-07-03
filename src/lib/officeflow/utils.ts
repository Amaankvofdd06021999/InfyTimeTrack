export const DAY_MS = 86_400_000;
export const FULL_DAY_HOURS = 6;
export const FULL_DAY_MS = FULL_DAY_HOURS * 3600 * 1000;
export const HALF_DAY_MS = 4 * 3600 * 1000;
export const MAX_SESSION_MS = 24 * 3600 * 1000;
export const REQUIRED_OFFICE_HOURS = 9.5; // Required hours in office (9.5 hours)
export const REQUIRED_OFFICE_MS = REQUIRED_OFFICE_HOURS * 3600 * 1000;
export const OFFICE_CUTOFF_TIME = "20:30"; // 8:30 PM cutoff

export function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isFuture(key: string): boolean {
  return key > todayKey();
}

export function formatHMS(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export function formatHours(h: number): string {
  return `${h.toFixed(2)}h`;
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDatePretty(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function monthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** Monday-first grid of 42 cells covering the visible month. */
export function monthGrid(view: Date): Date[] {
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const weekday = (first.getDay() + 6) % 7; // Monday = 0
  const start = new Date(first);
  start.setDate(1 - weekday);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

// ---------------- Gamification ----------------
// 20 points per WFO full day, 12 pts per partial (prorated), 8 pts per WFH, +5 bonus for streak days.
export function pointsForDay(entry: { type: "wfo" | "wfh"; hours?: number | null }): number {
  if (entry.type === "wfh") return 8;
  if (entry.hours == null) return 20;
  if (entry.hours >= FULL_DAY_HOURS) return 20;
  return Math.round((entry.hours / FULL_DAY_HOURS) * 12);
}

export function levelFromPoints(pts: number): { level: number; inLevel: number; needed: number; pct: number } {
  // Level n requires n*100 cumulative points (1→100, 2→300, 3→600, 4→1000 ...) — triangular.
  let level = 1;
  let acc = 0;
  while (true) {
    const cost = level * 100;
    if (acc + cost > pts) {
      const inLevel = pts - acc;
      return { level, inLevel, needed: cost, pct: Math.min(100, (inLevel / cost) * 100) };
    }
    acc += cost;
    level++;
    if (level > 999) return { level, inLevel: 0, needed: 100, pct: 0 };
  }
}

export interface Badge {
  id: string;
  label: string;
  hint: string;
  earned: boolean;
}

// Calculate WFH hours needed for an incomplete office day
export function calculateWFHNeeded(loginTime: Date, logoutTime: Date): {
  wfhHoursNeeded: number;
  suggestedWFHStart: string;
  suggestedWFHEnd: string;
  canCompleteInOffice: boolean;
  suggestionType: 'morning' | 'evening' | 'both' | 'split';
  totalPossibleHours: number;
} {
  const officeHours = (logoutTime.getTime() - loginTime.getTime()) / (3600 * 1000);
  const hoursNeeded = Math.max(0, REQUIRED_OFFICE_HOURS - officeHours);

  if (hoursNeeded === 0) {
    return {
      wfhHoursNeeded: 0,
      suggestedWFHStart: '',
      suggestedWFHEnd: '',
      canCompleteInOffice: true,
      suggestionType: 'both',
      totalPossibleHours: officeHours
    };
  }

  // Set work day boundaries (8:30 AM to 8:30 PM)
  const dayStart = new Date(loginTime);
  dayStart.setHours(8, 30, 0, 0);

  const dayEnd = new Date(logoutTime);
  dayEnd.setHours(20, 30, 0, 0);

  // Calculate available WFH slots
  const morningAvailable = Math.max(0, (loginTime.getTime() - dayStart.getTime()) / (3600 * 1000));
  const eveningAvailable = Math.max(0, (dayEnd.getTime() - logoutTime.getTime()) / (3600 * 1000));
  const totalAvailable = morningAvailable + eveningAvailable;

  // Total possible hours including office
  const totalPossibleHours = officeHours + totalAvailable;

  // Check if 9.5 hours is even possible
  const canCompleteInOffice = totalPossibleHours >= REQUIRED_OFFICE_HOURS;

  let suggestedStart: Date;
  let suggestedEnd: Date;
  let suggestionType: 'morning' | 'evening' | 'both' | 'split';
  let actualWFHHours = hoursNeeded;

  // If we can't reach 9.5 hours even with all available time
  if (!canCompleteInOffice) {
    // Use all available time
    actualWFHHours = totalAvailable;

    if (morningAvailable > 0 && eveningAvailable > 0) {
      // Need both morning and evening
      suggestionType = 'split';
      suggestedStart = dayStart;
      suggestedEnd = dayEnd;
    } else if (morningAvailable > 0) {
      suggestionType = 'morning';
      suggestedStart = dayStart;
      suggestedEnd = loginTime;
    } else {
      suggestionType = 'evening';
      suggestedStart = logoutTime;
      suggestedEnd = dayEnd;
    }
  }
  // If morning slot alone can cover the needed hours
  else if (morningAvailable >= hoursNeeded) {
    suggestionType = 'morning';
    // For very short office hours, prefer suggesting from 8:30 AM
    if (loginTime.getHours() >= 10 || officeHours < 2) {
      suggestedStart = new Date(loginTime.getTime() - hoursNeeded * 3600 * 1000);
      if (suggestedStart < dayStart) {
        suggestedStart = dayStart;
      }
      suggestedEnd = loginTime;
    } else {
      suggestedStart = dayStart;
      suggestedEnd = new Date(dayStart.getTime() + hoursNeeded * 3600 * 1000);
    }
  }
  // If evening slot alone can cover the needed hours
  else if (eveningAvailable >= hoursNeeded) {
    suggestionType = 'evening';
    suggestedStart = logoutTime;
    suggestedEnd = new Date(logoutTime.getTime() + hoursNeeded * 3600 * 1000);
    if (suggestedEnd > dayEnd) {
      suggestedEnd = dayEnd;
    }
  }
  // Need to split between morning and evening
  else {
    suggestionType = 'split';
    // Use format like "8:30-11:41 + 12:00-20:30"
    suggestedStart = dayStart;
    suggestedEnd = dayEnd;
    actualWFHHours = totalAvailable;
  }

  // Format the suggestion for split time
  let formattedStart = formatTime(suggestedStart.getTime());
  let formattedEnd = formatTime(suggestedEnd.getTime());

  if (suggestionType === 'split') {
    formattedStart = `${formatTime(dayStart.getTime())}-${formatTime(loginTime.getTime())}`;
    formattedEnd = `${formatTime(logoutTime.getTime())}-${formatTime(dayEnd.getTime())}`;
  }

  return {
    wfhHoursNeeded: actualWFHHours,
    suggestedWFHStart: formattedStart,
    suggestedWFHEnd: formattedEnd,
    canCompleteInOffice,
    suggestionType,
    totalPossibleHours
  };
}

// Get working days and weekends in a month
export function getMonthStatistics(year: number, month: number): {
  totalDays: number;
  weekdays: number;
  weekends: number;
  holidays: number;
  wfoRequired: number; // Auto-calculated WFO days
} {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();

  let weekdays = 0;
  let weekends = 0;

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekends++;
    } else {
      weekdays++;
    }
  }

  // Auto-calculate WFO required days
  // Total workdays - WFH allowance = WFO required
  // Assuming default 8 WFH days per month
  const wfoRequired = Math.max(0, weekdays - 8); // This will be dynamic based on state.allowance

  return {
    totalDays,
    weekdays,
    weekends,
    holidays: 0, // Can be enhanced with holiday API
    wfoRequired,
  };
}

// Calculate WFO requirements for a month
export function calculateWFORequirement(year: number, month: number, wfhAllowance: number): number {
  const stats = getMonthStatistics(year, month);
  // Work days in month - WFH allowance = WFO required
  return Math.max(0, stats.weekdays - wfhAllowance);
}

export function computeBadges(stats: {
  totalDays: number;
  wfoFull: number;
  wfoPartial: number;
  wfhTotal: number;
  bestStreak: number;
  monthsTracked: number;
}): Badge[] {
  return [
    { id: "first-step", label: "First step", hint: "Log your first day", earned: stats.totalDays >= 1 },
    { id: "week-warrior", label: "Week warrior", hint: "5-day streak", earned: stats.bestStreak >= 5 },
    { id: "office-regular", label: "Office regular", hint: "10 office days", earned: stats.wfoFull + stats.wfoPartial >= 10 },
    { id: "home-base", label: "Home base", hint: "8 WFH days", earned: stats.wfhTotal >= 8 },
    { id: "full-focus", label: "Full focus", hint: "20 full office days", earned: stats.wfoFull >= 20 },
    { id: "consistent", label: "Consistent", hint: "15-day streak", earned: stats.bestStreak >= 15 },
    { id: "monthly-hero", label: "Monthly hero", hint: "Track a whole month", earned: stats.monthsTracked >= 1 },
    { id: "century", label: "Century club", hint: "100 days logged", earned: stats.totalDays >= 100 },
  ];
}
