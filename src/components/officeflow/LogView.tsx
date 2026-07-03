import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Home, Building2, Clock, AlertCircle, Plus, Edit3 } from "lucide-react";
import { useStore } from "@/lib/officeflow/store";
import { monthEntries, monthStats } from "@/lib/officeflow/selectors";
import { FULL_DAY_HOURS, REQUIRED_OFFICE_HOURS, formatTime, monthLabel, parseKey, calculateWFHNeeded } from "@/lib/officeflow/utils";
import { EditSession } from "./EditSession";

export function LogView() {
  const { state, markDay, emitAlert } = useStore();
  const [view, setView] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [editingEntry, setEditingEntry] = useState<{ date: string; entry: any } | null>(null);
  const entries = useMemo(() => monthEntries(state, view), [state, view]);
  const stats = useMemo(() => monthStats(state, view), [state, view]);

  const go = (delta: number) => {
    const d = new Date(view);
    d.setMonth(d.getMonth() + delta);
    setView(d);
  };

  const handleMarkWFH = (key: string, entry: any, wfhHours: number, startTime: string, endTime: string) => {
    markDay(key, {
      ...entry,
      wfhHours,
      wfhStartTime: startTime,
      wfhEndTime: endTime
    });
    emitAlert("WFH Hours Applied", `${wfhHours.toFixed(1)} hours of WFH marked for this day`, "success");
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
            const hasWFHHours = entry.wfhHours && entry.wfhHours > 0;
            const partial = entry.type === "wfo" && entry.hours != null && entry.hours < FULL_DAY_HOURS;
            const descriptor = isWFH ? "WFH" : partial ? "Office partial" : "Office full";

            // Calculate total hours including WFH
            const officeHours = entry.hours || 0;
            const wfhHours = entry.wfhHours || 0;
            const totalHours = officeHours + wfhHours;

            // Calculate WFH suggestion for incomplete days
            let wfhSuggestion = null;
            if (entry.type === "wfo" && !hasWFHHours && entry.loginTs && entry.logoutTs && officeHours < REQUIRED_OFFICE_HOURS) {
              const loginDate = new Date(entry.loginTs);
              const logoutDate = new Date(entry.logoutTs);
              wfhSuggestion = calculateWFHNeeded(loginDate, logoutDate);
            }

            const hoursPill = isWFH
              ? "WFH"
              : entry.hours == null
                ? "Full day"
                : hasWFHHours
                  ? `${totalHours.toFixed(1)}h total`
                  : `${entry.hours.toFixed(2)}h`;

            const badgeBg = isWFH ? "bg-brand-lime text-ink" : partial && !hasWFHHours ? "bg-lavender text-ink" : "bg-brand-blue text-white";

            return (
              <div
                key={key}
                className={`px-4 py-3 ${idx !== 0 ? "border-t border-border/60" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-extrabold ${badgeBg}`}>
                    {isWFH ? "H" : hasWFHHours ? "H+O" : "O"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" })}
                      </span>
                      {entry.type === "wfo" && (
                        <button
                          onClick={() => setEditingEntry({ date: key, entry })}
                          className="p-1 rounded hover:bg-canvas"
                          title="Edit times"
                        >
                          <Edit3 className="h-3 w-3 text-ink-muted" />
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-muted">
                      {descriptor}
                      {entry.loginTs ? ` · in at ${formatTime(entry.loginTs)}` : ""}
                      {entry.logoutTs ? ` - out at ${formatTime(entry.logoutTs)}` : ""}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold tabular-nums ${
                      isWFH ? "bg-brand-lime-soft text-ink" : hasWFHHours ? "bg-brand-lime/20 text-ink" : partial ? "bg-lavender-soft text-ink" : "bg-brand-blue-soft text-ink"
                    }`}
                  >
                    {hoursPill}
                  </span>
                </div>

                {/* Show WFH details if applied */}
                {hasWFHHours && (
                  <div className="mt-2 ml-12 p-2 rounded-lg bg-brand-lime/20 border border-brand-lime/40">
                    <div className="flex items-start gap-2">
                      <Home className="h-3.5 w-3.5 text-brand-blue mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-ink">
                          WFH Hours Applied ✓
                        </p>
                        <p className="text-[10px] text-ink-muted mt-0.5">
                          Office: {officeHours.toFixed(1)}h + WFH: {wfhHours.toFixed(1)}h
                          {entry.wfhStartTime && entry.wfhEndTime && (
                            <span> ({entry.wfhStartTime} - {entry.wfhEndTime})</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show WFH suggestion for incomplete days */}
                {wfhSuggestion && wfhSuggestion.wfhHoursNeeded > 0 && (
                  <div className="mt-2 ml-12 p-2 rounded-lg bg-brand-blue/10 border border-brand-blue/30">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-brand-blue mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-brand-blue">
                          Incomplete Day - WFH Suggested
                        </p>
                        <p className="text-[10px] text-ink-muted mt-0.5">
                          Need {wfhSuggestion.wfhHoursNeeded.toFixed(1)}h more to complete 9.5h
                        </p>
                        <p className="text-[10px] text-ink-muted mt-0.5">
                          {wfhSuggestion.suggestionType === 'split' ? (
                            <>Split WFH: Morning + Evening<br/>
                            {wfhSuggestion.suggestedWFHStart} + {wfhSuggestion.suggestedWFHEnd}</>
                          ) : (
                            <>Suggested: {wfhSuggestion.suggestionType === 'morning' ? 'Morning' : 'Evening'} WFH
                            ({wfhSuggestion.suggestedWFHStart} - {wfhSuggestion.suggestedWFHEnd})</>
                          )}
                        </p>
                        {!wfhSuggestion.canCompleteInOffice && (
                          <p className="text-[10px] text-red-600 mt-1 font-semibold">
                            ⚠️ Max possible: {wfhSuggestion.totalPossibleHours.toFixed(1)}h (cannot reach 9.5h)
                          </p>
                        )}
                        <button
                          onClick={() => handleMarkWFH(
                            key,
                            entry,
                            wfhSuggestion.wfhHoursNeeded,
                            wfhSuggestion.suggestedWFHStart,
                            wfhSuggestion.suggestedWFHEnd
                          )}
                          className="mt-2 flex items-center gap-1 rounded-lg bg-brand-blue px-2 py-1 text-[10px] font-bold text-white hover:bg-brand-blue/90"
                        >
                          <Plus className="h-3 w-3" />
                          Mark WFH Hours
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Edit Session Modal */}
      {editingEntry && (
        <EditSession
          date={editingEntry.date}
          entry={editingEntry.entry}
          onClose={() => setEditingEntry(null)}
          onSave={() => {
            setEditingEntry(null);
            emitAlert("Times Updated", "Login/logout times have been updated", "success");
          }}
        />
      )}
    </div>
  );
}
