import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { dateKey, MAX_SESSION_MS, todayKey } from "./utils";
import { playNotificationSound, playAlarmSound } from "./sound";

export type DayType = "wfo" | "wfh";
export interface DayEntry {
  type: DayType;
  hours?: number | null; // WFO: number of hours, or null = manual full day. WFH: undefined.
  loginTs?: number;
  logoutTs?: number;
}
export interface Session {
  date: string;
  loginTs: number;
  n4: boolean;
  n6: boolean;
}

export interface State {
  allowance: number;
  days: Record<string, DayEntry>;
  session: Session | null;
  userName?: string;
  localDataEnabled?: boolean;
  notificationsEnabled?: boolean;
  isOnboarded?: boolean;
}

const STORAGE_KEY = "infy_time_track_v1";
const DEFAULT_STATE: State = {
  allowance: 8,
  days: {},
  session: null,
  localDataEnabled: true,
  notificationsEnabled: true,
  isOnboarded: false,
};

function loadState(): State {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(s: State) {
  if (typeof window === "undefined") return;
  // Only save if local data is enabled (default true for backwards compatibility)
  if (s.localDataEnabled !== false) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      // ignore quota errors
    }
  }
}

// ---------------- Banner / notifications ----------------
export interface Banner {
  id: number;
  title: string;
  body?: string;
  tone?: "default" | "success" | "warning";
}

interface Ctx {
  state: State;
  setAllowance: (n: number) => void;
  markDay: (key: string, entry: DayEntry) => void;
  clearDay: (key: string) => void;
  startTimer: (loginTs: number) => void;
  stopTimer: () => { hours: number; full: boolean } | null;
  markSessionFlag: (flag: "n4" | "n6") => void;
  now: number;
  banners: Banner[];
  pushBanner: (b: Omit<Banner, "id">) => void;
  dismissBanner: (id: number) => void;
  notifyPermission: NotificationPermission | "unsupported";
  requestNotifications: () => Promise<NotificationPermission | "unsupported">;
  emitAlert: (title: string, body?: string, tone?: Banner["tone"]) => void;
  setUserName: (name: string) => void;
  setLocalDataEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setOnboarded: (onboarded: boolean) => void;
  clearAllData: () => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());
  const [banners, setBanners] = useState<Banner[]>([]);
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission | "unsupported">("default");
  const bannerId = useRef(1);
  const eodPrompted = useRef(false);

  // Hydrate once client-side.
  useEffect(() => {
    setState(loadState());
    setHydrated(true);
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifyPermission(Notification.permission);
    } else {
      setNotifyPermission("unsupported");
    }
  }, []);

  // Persist on every change.
  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  // Global tick every second — drives timer + EOD checks.
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const pushBanner = useCallback((b: Omit<Banner, "id">) => {
    const id = bannerId.current++;
    setBanners((prev) => [...prev, { id, ...b }]);
    window.setTimeout(() => {
      setBanners((prev) => prev.filter((x) => x.id !== id));
    }, 8000);
  }, []);

  const dismissBanner = useCallback((id: number) => {
    setBanners((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const emitAlert = useCallback(
    (title: string, body?: string, tone: Banner["tone"] = "default") => {
      pushBanner({ title, body, tone });
      // Only send browser notifications if user has enabled them AND has granted permission
      if (
        state.notificationsEnabled !== false &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(title, { body, icon: '/favicon.ico' });
        } catch {
          // ignore
        }
      }
    },
    [pushBanner, state.notificationsEnabled],
  );

  const requestNotifications = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifyPermission("unsupported");
      pushBanner({ title: "Notifications not supported", body: "Your browser does not support notifications", tone: "warning" });
      return "unsupported" as const;
    }
    const p = await Notification.requestPermission();
    setNotifyPermission(p);

    if (p === "granted") {
      setState((s) => ({ ...s, notificationsEnabled: true }));
      // Send a test notification
      try {
        new Notification("InfyTimeTrack Notifications Enabled", {
          body: "You will receive alerts at 4h and 6h milestones",
          icon: '/favicon.ico'
        });
      } catch {
        // ignore
      }
    } else if (p === "denied") {
      pushBanner({ title: "Notifications blocked", body: "Please enable notifications in your browser settings", tone: "warning" });
    }

    return p;
  }, [pushBanner]);

  // ---------------- Mutations ----------------
  const setAllowance = useCallback((n: number) => {
    const clamped = Math.max(0, Math.min(31, Math.round(n)));
    setState((s) => ({ ...s, allowance: clamped }));
  }, []);

  const markDay = useCallback((key: string, entry: DayEntry) => {
    setState((s) => ({ ...s, days: { ...s.days, [key]: entry } }));
  }, []);

  const clearDay = useCallback((key: string) => {
    setState((s) => {
      const next = { ...s.days };
      delete next[key];
      return { ...s, days: next };
    });
  }, []);

  const startTimer = useCallback((loginTs: number) => {
    const clamped = Math.min(loginTs, Date.now());
    const date = dateKey(new Date(clamped));
    setState((s) => ({ ...s, session: { date, loginTs: clamped, n4: false, n6: false } }));
  }, []);

  const stopTimer = useCallback((): { hours: number; full: boolean } | null => {
    let result: { hours: number; full: boolean } | null = null;
    setState((s) => {
      if (!s.session) return s;
      const elapsed = Math.min(MAX_SESSION_MS, Date.now() - s.session.loginTs);
      const hours = elapsed / 3600 / 1000;
      const full = hours >= 6;
      const entry: DayEntry = {
        type: "wfo",
        hours: full ? Math.max(6, +hours.toFixed(2)) : +hours.toFixed(2),
        loginTs: s.session.loginTs,
        logoutTs: Date.now(),
      };
      result = { hours: +hours.toFixed(2), full };
      return { ...s, session: null, days: { ...s.days, [s.session.date]: entry } };
    });
    return result;
  }, []);

  const markSessionFlag = useCallback((flag: "n4" | "n6") => {
    setState((s) => (s.session ? { ...s, session: { ...s.session, [flag]: true } } : s));
  }, []);

  const setUserName = useCallback((name: string) => {
    setState((s) => ({ ...s, userName: name }));
  }, []);

  const setLocalDataEnabled = useCallback((enabled: boolean) => {
    setState((s) => ({ ...s, localDataEnabled: enabled }));
  }, []);

  const setNotificationsEnabled = useCallback((enabled: boolean) => {
    setState((s) => ({ ...s, notificationsEnabled: enabled }));
  }, []);

  const setOnboarded = useCallback((onboarded: boolean) => {
    setState((s) => ({ ...s, isOnboarded: onboarded }));
  }, []);

  const clearAllData = useCallback(() => {
    const newState = { ...DEFAULT_STATE, userName: state.userName, isOnboarded: state.isOnboarded };
    setState(newState);
    emitAlert("Data cleared", "All tracking data has been deleted.", "success");
  }, [state.userName, state.isOnboarded, emitAlert]);

  // ---------------- Milestone + EOD watchers ----------------
  useEffect(() => {
    if (!hydrated) return;
    const s = state.session;
    if (s) {
      const elapsed = now - s.loginTs;
      if (!s.n4 && elapsed >= 4 * 3600 * 1000) {
        markSessionFlag("n4");
        emitAlert("4 hours done", "Half-day mark reached. Keep going!", "success");
        if (state.notificationsEnabled !== false) {
          playNotificationSound();
        }
      }
      if (!s.n6 && elapsed >= 6 * 3600 * 1000) {
        markSessionFlag("n6");
        emitAlert("6 hours complete", "Full office day logged — nicely done.", "success");
        if (state.notificationsEnabled !== false) {
          playAlarmSound(); // More prominent sound for full day
        }
      }
    }

    // End-of-day nudge (once per app session)
    const d = new Date(now);
    const today = todayKey();
    if (
      !eodPrompted.current &&
      d.getHours() >= 17 &&
      !state.days[today] &&
      !state.session
    ) {
      eodPrompted.current = true;
      emitAlert("How did you work today?", "Tap the dashboard to mark WFH or Office.", "warning");
    }
  }, [now, state.session, state.days, hydrated, emitAlert, markSessionFlag]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      setAllowance,
      markDay,
      clearDay,
      startTimer,
      stopTimer,
      markSessionFlag,
      now,
      banners,
      pushBanner,
      dismissBanner,
      notifyPermission,
      requestNotifications,
      emitAlert,
      setUserName,
      setLocalDataEnabled,
      setNotificationsEnabled,
      setOnboarded,
      clearAllData,
    }),
    [state, setAllowance, markDay, clearDay, startTimer, stopTimer, markSessionFlag, now, banners, pushBanner, dismissBanner, notifyPermission, requestNotifications, emitAlert, setUserName, setLocalDataEnabled, setNotificationsEnabled, setOnboarded, clearAllData],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}
