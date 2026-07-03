import { useState } from "react";
import { Calendar, FileText, Briefcase, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/officeflow/store";
import { dateKey, formatDatePretty } from "@/lib/officeflow/utils";

interface LeaveRecord {
  id: string;
  date: string;
  type: "casual" | "sick" | "earned" | "comp_off" | "od";
  reason: string;
  odPurpose?: string;
}

export function LeaveManagement({ onClose }: { onClose: () => void }) {
  const { state, markDay, emitAlert } = useStore();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLeave, setNewLeave] = useState<Partial<LeaveRecord>>({
    type: "casual",
    date: new Date().toISOString().split("T")[0],
    reason: "",
  });

  // Count OD usage for current month
  const currentMonth = new Date().getMonth();
  const odThisMonth = Object.entries(state.days).filter(([key, entry]) => {
    const date = new Date(key);
    return date.getMonth() === currentMonth && entry.type === "od";
  }).length;

  const handleAddLeave = () => {
    if (!newLeave.date || !newLeave.reason) {
      emitAlert("Missing information", "Please fill in all fields", "warning");
      return;
    }

    if (newLeave.type === "od" && odThisMonth >= (state.odAllowancePerMonth || 2)) {
      emitAlert("OD limit reached", `You can only apply ${state.odAllowancePerMonth || 2} ODs per month`, "warning");
      return;
    }

    const leaveRecord: LeaveRecord = {
      id: Date.now().toString(),
      date: newLeave.date!,
      type: newLeave.type as LeaveRecord["type"],
      reason: newLeave.reason!,
      odPurpose: newLeave.odPurpose,
    };

    // Mark the day in the calendar
    const dayKey = dateKey(new Date(newLeave.date!));
    markDay(dayKey, {
      type: newLeave.type === "od" ? "od" : "leave",
      leaveType: newLeave.type !== "od" ? newLeave.type as any : undefined,
      odPurpose: newLeave.odPurpose,
    });

    setLeaves([...leaves, leaveRecord]);
    setShowAddForm(false);
    setNewLeave({ type: "casual", date: new Date().toISOString().split("T")[0], reason: "" });

    if (newLeave.type === "od") {
      emitAlert("OD Registered", "This will be counted as a work from office day", "success");
    } else {
      emitAlert("Leave Registered", "Leave has been marked in your calendar", "success");
    }
  };

  const leaveBalance = state.leaveBalance || {
    casual: 12,
    sick: 7,
    earned: 15,
    comp_off: 0,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="min-h-screen p-4">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Leave & OD Management</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-canvas"
            >
              ×
            </button>
          </div>

          {/* Leave Balance */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-ink-muted">Leave Balance</h3>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-canvas p-3">
                <div className="text-xs font-medium text-ink-muted">Casual</div>
                <div className="mt-1 text-lg font-bold">{leaveBalance.casual}</div>
              </div>
              <div className="rounded-lg bg-canvas p-3">
                <div className="text-xs font-medium text-ink-muted">Sick</div>
                <div className="mt-1 text-lg font-bold">{leaveBalance.sick}</div>
              </div>
              <div className="rounded-lg bg-canvas p-3">
                <div className="text-xs font-medium text-ink-muted">Earned</div>
                <div className="mt-1 text-lg font-bold">{leaveBalance.earned}</div>
              </div>
              <div className="rounded-lg bg-canvas p-3">
                <div className="text-xs font-medium text-ink-muted">Comp Off</div>
                <div className="mt-1 text-lg font-bold">{leaveBalance.comp_off}</div>
              </div>
            </div>
          </div>

          {/* OD Tracker */}
          <div className="mt-6 rounded-lg bg-brand-blue/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-brand-blue" />
                <span className="text-sm font-semibold">OD Usage This Month</span>
              </div>
              <span className="text-lg font-bold text-brand-blue">
                {odThisMonth}/{state.odAllowancePerMonth || 2}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              OD days count as work from office days
            </p>
          </div>

          {/* Add Leave/OD Button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue px-4 py-3 text-sm font-bold text-white tap tap-press"
          >
            <Plus className="h-4 w-4" />
            Apply for Leave/OD
          </button>

          {/* Add Leave Form */}
          {showAddForm && (
            <div className="mt-4 rounded-lg border border-canvas p-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-ink-muted">Type</label>
                  <select
                    value={newLeave.type}
                    onChange={(e) => setNewLeave({ ...newLeave, type: e.target.value as any })}
                    className="mt-1 w-full rounded-lg bg-canvas px-3 py-2 text-sm outline-none"
                  >
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="earned">Earned Leave</option>
                    <option value="comp_off">Comp Off</option>
                    <option value="od">On Duty (OD)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-muted">Date</label>
                  <input
                    type="date"
                    value={newLeave.date}
                    onChange={(e) => setNewLeave({ ...newLeave, date: e.target.value })}
                    className="mt-1 w-full rounded-lg bg-canvas px-3 py-2 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-muted">
                    {newLeave.type === "od" ? "OD Purpose" : "Reason"}
                  </label>
                  <input
                    type="text"
                    value={newLeave.type === "od" ? newLeave.odPurpose || "" : newLeave.reason || ""}
                    onChange={(e) =>
                      setNewLeave({
                        ...newLeave,
                        [newLeave.type === "od" ? "odPurpose" : "reason"]: e.target.value,
                      })
                    }
                    placeholder={newLeave.type === "od" ? "e.g., Client meeting" : "e.g., Personal work"}
                    className="mt-1 w-full rounded-lg bg-canvas px-3 py-2 text-sm outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddLeave}
                    className="flex-1 rounded-lg bg-brand-lime px-3 py-2 text-sm font-bold text-ink"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 rounded-lg bg-canvas px-3 py-2 text-sm font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Leave History */}
          {leaves.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-ink-muted">Recent Applications</h3>
              <div className="mt-2 space-y-2">
                {leaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between rounded-lg bg-canvas p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-white p-2">
                        {leave.type === "od" ? (
                          <Briefcase className="h-3.5 w-3.5" />
                        ) : (
                          <Calendar className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          {leave.type === "od" ? "On Duty" : leave.type.replace("_", " ").toUpperCase()}
                        </div>
                        <div className="text-xs text-ink-muted">
                          {formatDatePretty(new Date(leave.date))} • {leave.reason || leave.odPurpose}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setLeaves(leaves.filter((l) => l.id !== leave.id))}
                      className="rounded-full p-1 text-ink-muted hover:bg-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}