import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Building2, Home as HomeIcon, Trash2, Clock, Calendar, Briefcase } from "lucide-react";
import { useStore } from "@/lib/officeflow/store";
import { monthStats } from "@/lib/officeflow/selectors";
import { dateKey, FULL_DAY_HOURS, isFuture, monthGrid, monthLabel, todayKey, formatTime } from "@/lib/officeflow/utils";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function CalendarView() {
  const { state, markDay, clearDay, emitAlert } = useStore();
  const [view, setView] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [showTimeEntry, setShowTimeEntry] = useState(false);
  const [loginTime, setLoginTime] = useState("09:00");
  const [logoutTime, setLogoutTime] = useState("18:00");

  const cells = useMemo(() => monthGrid(view), [view]);
  const stats = useMemo(() => monthStats(state, view), [state, view]);
  const today = todayKey();

  const go = (delta: number) => {
    const d = new Date(view);
    d.setMonth(d.getMonth() + delta);
    setView(d);
    setSelected(null);
  };

  const selectedEntry = selected ? state.days[selected] : null;

  return (
    <div className="space-y-4 pb-32 pt-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-ink-muted">Your month</div>
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

      <section className="rounded-xl bg-white p-4 shadow-sm shadow-black/5">
        <div className="grid grid-cols-7 gap-1 pb-2 text-center text-[10px] font-bold text-ink-muted">
          {WEEKDAYS.map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d) => {
            const k = dateKey(d);
            const entry = state.days[k];
            const inMonth = d.getMonth() === view.getMonth();
            const isToday = k === today;
            const future = isFuture(k);
            const isSelected = selected === k;

            let pillClass = "bg-transparent text-ink";
            if (entry?.type === "wfh") {
              pillClass = "bg-brand-lime text-ink";
            } else if (entry?.type === "wfo") {
              if (entry.hours != null && entry.hours < FULL_DAY_HOURS) pillClass = "bg-lavender text-ink";
              else pillClass = "bg-brand-blue text-white";
            } else if (entry?.type === "leave") {
              pillClass = "bg-green-500 text-white"; // Approved leave - green
            } else if (entry?.type === "pending_leave") {
              pillClass = "bg-yellow-500 text-white"; // Pending leave - yellow
            } else if (entry?.type === "od") {
              pillClass = "bg-purple-500 text-white"; // Approved OD - purple
            } else if (entry?.type === "pending_od") {
              pillClass = "bg-yellow-500 text-white"; // Pending OD - yellow
            } else if (entry?.type === "planned_wfh") {
              pillClass = "bg-yellow-300 text-ink"; // Planned WFH - light yellow
            } else if (entry?.type === "holiday") {
              pillClass = "bg-red-500 text-white"; // Holiday - red
            } else if (entry?.type === "weekend") {
              pillClass = "bg-gray-300 text-ink"; // Weekend - gray
            }

            return (
              <button
                key={k}
                onClick={() => setSelected(isSelected ? null : k)}
                className={`aspect-square rounded-full text-[13px] font-bold tap tap-press ${pillClass} ${
                  inMonth ? "" : "opacity-30"
                } ${future && !entry ? "opacity-50" : ""} ${isToday ? "ring-2 ring-ink ring-offset-2 ring-offset-white" : ""} ${
                  isSelected ? "outline outline-2 outline-ink" : ""
                }`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-[10px] text-ink-muted">
          <LegendDot color="bg-brand-blue" label="Office" />
          <LegendDot color="bg-brand-lime" label="WFH" />
          <LegendDot color="bg-green-500" label="Leave" />
          <LegendDot color="bg-purple-500" label="OD" />
          <LegendDot color="bg-yellow-500" label="Pending" />
          <LegendDot color="bg-yellow-300" label="Planned" />
        </div>
      </section>

      {selected ? (
        <section className="rounded-xl bg-white p-5 shadow-sm shadow-black/5">
          <div className="text-xs font-semibold text-ink-muted">
            {new Date(selected).toLocaleDateString(undefined, {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>
          <div className="mt-1 text-lg font-extrabold">
            {selectedEntry ? (
              selectedEntry.type === "wfh" ? "Work from home" :
              selectedEntry.type === "wfo" ? (
                selectedEntry.hours != null && selectedEntry.hours < FULL_DAY_HOURS
                  ? `Office · ${selectedEntry.hours.toFixed(2)}h partial`
                  : "Office · full day"
              ) :
              selectedEntry.type === "leave" ? `Leave · ${selectedEntry.leaveType || "Approved"}` :
              selectedEntry.type === "pending_leave" ? `Leave · Pending Approval` :
              selectedEntry.type === "od" ? `On Duty · ${selectedEntry.odPurpose || "Approved"}` :
              selectedEntry.type === "pending_od" ? `On Duty · Pending Approval` :
              selectedEntry.type === "planned_wfh" ? "Planned WFH · Pending" :
              selectedEntry.type === "holiday" ? "Holiday" :
              selectedEntry.type === "weekend" ? "Weekend" :
              "Not marked"
            ) : "Not marked"}
          </div>

          {selectedEntry?.loginTs && (
            <div className="mt-2 text-xs text-ink-muted">
              Login: {formatTime(selectedEntry.loginTs)}
              {selectedEntry.logoutTs && ` | Logout: ${formatTime(selectedEntry.logoutTs)}`}
            </div>
          )}

          {selectedEntry?.wfhHours && (
            <div className="mt-2 text-xs text-ink-muted">
              WFH Hours: {selectedEntry.wfhHours.toFixed(1)}h (applied for remaining day)
            </div>
          )}

          {!showTimeEntry ? (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {/* For future dates, show Plan WFH option */}
                {isFuture(selected) ? (
                  <>
                    <button
                      onClick={() => {
                        markDay(selected, { type: "planned_wfh" });
                        emitAlert("WFH planned for this day", "You can change this to office on the actual day", "success");
                      }}
                      className="flex items-center justify-center gap-2 rounded-lg bg-yellow-300 px-3 py-3 text-sm font-bold text-ink tap tap-press col-span-2"
                    >
                      <HomeIcon className="h-4 w-4" /> Plan WFH
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowTimeEntry(true)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-brand-blue px-3 py-3 text-sm font-bold text-white tap tap-press"
                    >
                      <Building2 className="h-4 w-4" /> Office
                    </button>
                    <button
                      onClick={() => {
                        // Check if there are already office hours logged for this day
                        if (selectedEntry && selectedEntry.type === "wfo" && selectedEntry.hours) {
                          // Calculate remaining hours for WFH
                          const standardFullDay = 9; // Standard full day hours
                          const remainingHours = Math.max(0, standardFullDay - selectedEntry.hours);

                          if (remainingHours > 0) {
                            // Confirm with user before applying WFH for remaining hours
                            const confirmMsg = `You logged ${selectedEntry.hours.toFixed(1)}h in office. Apply remaining ${remainingHours.toFixed(1)}h as WFH?`;
                            if (window.confirm(confirmMsg)) {
                              // Update the entry to include both office and WFH hours
                              markDay(selected, {
                                ...selectedEntry,
                                wfhHours: remainingHours,
                              });
                              emitAlert("WFH applied for remaining hours", `${remainingHours.toFixed(1)}h WFH added to your ${selectedEntry.hours.toFixed(1)}h office day`, "success");
                            }
                          } else {
                            emitAlert("Full day already logged", "You've already logged enough office hours for a full day", "warning");
                          }
                        } else {
                          // No office hours yet, mark as full WFH day
                          markDay(selected, { type: "wfh" });
                          emitAlert("Marked as work from home");
                        }
                      }}
                      className="flex items-center justify-center gap-2 rounded-lg bg-brand-lime px-3 py-3 text-sm font-bold text-ink tap tap-press"
                    >
                      <HomeIcon className="h-4 w-4" /> WFH
                    </button>
                  </>
                )}
              </div>

              {/* Additional buttons for Leave and OD */}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    // Mark as leave
                    markDay(selected, {
                      type: "pending_leave",
                      leaveType: "casual",
                      approvalStatus: "pending",
                      appliedDate: Date.now(),
                      comments: "Applied from calendar"
                    });
                    emitAlert("Leave applied", "Pending approval from manager", "success");
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-3 py-2.5 text-sm font-bold text-white tap tap-press"
                >
                  <Calendar className="h-4 w-4" /> Mark Leave
                </button>
                <button
                  onClick={() => {
                    // Check OD limit
                    const currentMonth = new Date(selected).getMonth();
                    const odThisMonth = Object.entries(state.days).filter(([key, entry]) => {
                      const date = new Date(key);
                      return date.getMonth() === currentMonth && (entry.type === "od" || entry.type === "pending_od");
                    }).length;

                    if (odThisMonth >= (state.odAllowancePerMonth || 2)) {
                      emitAlert("OD limit reached", `You can only apply ${state.odAllowancePerMonth || 2} ODs per month`, "warning");
                    } else {
                      markDay(selected, {
                        type: "pending_od",
                        odPurpose: "Applied from calendar",
                        approvalStatus: "pending",
                        appliedDate: Date.now()
                      });
                      emitAlert("OD applied", "Pending approval, will count as WFO day when approved", "success");
                    }
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-purple-500 px-3 py-2.5 text-sm font-bold text-white tap tap-press"
                >
                  <Briefcase className="h-4 w-4" /> Mark OD
                </button>
              </div>

              {selectedEntry ? (
                <button
                  onClick={() => {
                    clearDay(selected);
                    emitAlert("Day cleared");
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-canvas px-3 py-3 text-sm font-semibold text-ink-muted tap tap-press"
                >
                  <Trash2 className="h-4 w-4" /> Clear this day
                </button>
              ) : null}
            </>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="text-sm font-semibold">Enter office hours for {new Date(selected).toLocaleDateString()}</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-ink-muted">Login time</label>
                  <input
                    type="time"
                    value={loginTime}
                    onChange={(e) => setLoginTime(e.target.value)}
                    className="w-full mt-1 rounded-lg bg-canvas px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted">Logout time</label>
                  <input
                    type="time"
                    value={logoutTime}
                    onChange={(e) => setLogoutTime(e.target.value)}
                    className="w-full mt-1 rounded-lg bg-canvas px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const [lh, lm] = loginTime.split(":").map(Number);
                    const [oh, om] = logoutTime.split(":").map(Number);
                    const loginDate = new Date(selected);
                    loginDate.setHours(lh, lm, 0, 0);
                    const logoutDate = new Date(selected);
                    logoutDate.setHours(oh, om, 0, 0);

                    const hours = (logoutDate.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
                    if (hours > 0) {
                      markDay(selected, {
                        type: "wfo",
                        hours: Math.min(12, hours),
                        loginTs: loginDate.getTime(),
                        logoutTs: logoutDate.getTime()
                      });
                      emitAlert("Office hours logged", `${hours.toFixed(2)} hours recorded`);
                      setShowTimeEntry(false);
                    } else {
                      emitAlert("Invalid time", "Logout must be after login");
                    }
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2.5 text-sm font-bold text-white tap tap-press"
                >
                  <Clock className="h-4 w-4" /> Save
                </button>
                <button
                  onClick={() => setShowTimeEntry(false)}
                  className="rounded-lg bg-canvas px-3 py-2.5 text-sm font-semibold text-ink-muted tap tap-press"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-xl bg-ink p-5 text-white shadow-sm">
          <div className="text-xs font-semibold opacity-70">This month</div>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center">
            <SummaryCell value={`${stats.wfhLeft}`} label="WFH left" />
            <SummaryCell value={`${stats.wfhUsed}`} label="WFH used" />
            <SummaryCell value={`${stats.wfoFullCount + stats.wfoPartialCount}`} label="Office days" />
            <SummaryCell value={`${stats.officeHours.toFixed(1)}h`} label="Hours" />
          </div>
        </section>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function SummaryCell({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-lg font-extrabold tabular-nums leading-none">{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</div>
    </div>
  );
}
