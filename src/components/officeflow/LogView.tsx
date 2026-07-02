import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/officeflow/store";
import { monthEntries, monthStats } from "@/lib/officeflow/selectors";
import { FULL_DAY_HOURS, formatTime, monthLabel, parseKey } from "@/lib/officeflow/utils";

export function LogView() {
  const { state } = useStore();
  const [view, setView] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const entries = useMemo(() => monthEntries(state, view), [state, view]);
  const stats = useMemo(() => monthStats(state, view), [state, view]);

  const go = (delta: number) => {
    const d = new Date(view);
    d.setMonth(d.getMonth() + delta);
    setView(d);
  };

  return (
    <div className="space-y-4 pb-32 pt-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-ink-muted">Monthly log</div>
          <h1 className="text-2xl font-extrabold tracking-tight">{monthLabel(view)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => go(-1)} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm tap tap-press">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => go(1)} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm tap tap-press">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-brand-blue p-4 text-white">
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Total office hours</div>
          <div className="mt-1 text-2xl font-extrabold tabular-nums">{stats.officeHours.toFixed(1)}h</div>
        </div>
        <div className="rounded-2xl bg-brand-lime p-4 text-ink">
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">WFH used</div>
          <div className="mt-1 text-2xl font-extrabold tabular-nums">
            {stats.wfhUsed}
            <span className="text-sm font-bold opacity-60"> / {state.allowance}</span>
          </div>
        </div>
      </section>

      {entries.length === 0 ? (
        <section className="rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">🗓️</div>
          <div className="mt-2 text-base font-bold">No days logged yet</div>
          <div className="mt-1 text-sm text-ink-muted">
            Start the office timer or mark a WFH day from the dashboard, or tap a date on the calendar.
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          {entries.map(({ key, entry }, idx) => {
            const d = parseKey(key);
            const isWFH = entry.type === "wfh";
            const partial = entry.type === "wfo" && entry.hours != null && entry.hours < FULL_DAY_HOURS;
            const descriptor = isWFH ? "WFH" : partial ? "Office partial" : "Office full";
            const hoursPill = isWFH
              ? "WFH"
              : entry.hours == null
                ? "Full day"
                : `${entry.hours.toFixed(2)}h`;
            const badgeBg = isWFH ? "bg-brand-lime text-ink" : partial ? "bg-lavender text-ink" : "bg-brand-blue text-white";
            return (
              <div
                key={key}
                className={`flex items-center gap-3 px-4 py-3 ${idx !== 0 ? "border-t border-border/60" : ""}`}
              >
                <span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-extrabold ${badgeBg}`}>
                  {isWFH ? "H" : "O"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">
                    {d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" })}
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    {descriptor}
                    {entry.loginTs ? ` · in at ${formatTime(entry.loginTs)}` : ""}
                    {entry.logoutTs ? ` - out at ${formatTime(entry.logoutTs)}` : ""}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold tabular-nums ${
                    isWFH ? "bg-brand-lime-soft text-ink" : partial ? "bg-lavender-soft text-ink" : "bg-brand-blue-soft text-ink"
                  }`}
                >
                  {hoursPill}
                </span>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
