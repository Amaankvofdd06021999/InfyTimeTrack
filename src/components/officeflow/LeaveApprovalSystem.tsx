import { useState } from "react";
import { Calendar, Briefcase, Clock, Check, X, AlertCircle, Home, Building } from "lucide-react";
import { useStore } from "@/lib/officeflow/store";
import { dateKey, formatDatePretty } from "@/lib/officeflow/utils";
import type { DayEntry, ApprovalStatus } from "@/lib/officeflow/store";

interface ApprovalModalProps {
  onClose: () => void;
}

export function LeaveApprovalSystem({ onClose }: ApprovalModalProps) {
  const { state, markDay, emitAlert } = useStore();
  const [activeTab, setActiveTab] = useState<"apply" | "pending" | "approved">("apply");
  const [showAddForm, setShowAddForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    type: "leave" as "leave" | "od",
    date: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    leaveType: "casual" as "casual" | "sick" | "earned" | "comp_off",
    reason: "",
    odPurpose: "",
    comments: "",
  });

  // Get current month OD usage
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const odThisMonth = Object.entries(state.days).filter(([key, entry]) => {
    const [year, month] = key.split("-").map(Number);
    return year === currentYear && month === currentMonth + 1 &&
           (entry.type === "od" || (entry.type === "pending_od" && entry.approvalStatus !== "rejected"));
  }).length;

  // Get all pending, approved, and rejected entries
  const pendingEntries = Object.entries(state.days)
    .filter(([_, entry]) =>
      ["pending_leave", "pending_od", "planned_wfh"].includes(entry.type) &&
      (!entry.approvalStatus || entry.approvalStatus === "pending")
    )
    .sort(([a], [b]) => a.localeCompare(b));

  const approvedEntries = Object.entries(state.days)
    .filter(([_, entry]) =>
      entry.approvalStatus === "approved" &&
      ["leave", "od", "wfh", "pending_leave", "pending_od", "planned_wfh"].includes(entry.type)
    )
    .sort(([a], [b]) => b.localeCompare(a));

  const handleApply = () => {
    const { type, date, endDate, leaveType, reason, odPurpose, comments } = applicationData;

    if (!date || (!reason && type === "leave") || (!odPurpose && type === "od")) {
      emitAlert("Missing Information", "Please fill in all required fields", "warning");
      return;
    }

    // Check OD limit
    if (type === "od" && odThisMonth >= (state.odAllowancePerMonth || 2)) {
      emitAlert("OD Limit Reached", `You can only apply ${state.odAllowancePerMonth || 2} ODs per month`, "warning");
      return;
    }

    // Calculate date range
    const startDate = new Date(date);
    const finalEndDate = new Date(endDate || date);

    // Apply for each day in the range
    for (let d = new Date(startDate); d <= finalEndDate; d.setDate(d.getDate() + 1)) {
      const dayKey = dateKey(d);
      const dayEntry: DayEntry = {
        type: type === "leave" ? "pending_leave" : "pending_od",
        leaveType: type === "leave" ? leaveType : undefined,
        odPurpose: type === "od" ? odPurpose : undefined,
        approvalStatus: "pending",
        appliedDate: Date.now(),
        comments: comments || reason || odPurpose,
      };

      markDay(dayKey, dayEntry);
    }

    setShowAddForm(false);
    setApplicationData({
      type: "leave",
      date: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      leaveType: "casual",
      reason: "",
      odPurpose: "",
      comments: "",
    });

    const dayCount = Math.floor((finalEndDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const typeText = type === "leave" ? "Leave" : type === "od" ? "OD" : "WFH";
    emitAlert(
      `${typeText} Applied`,
      `Applied for ${dayCount} day(s). Waiting for manager approval.`,
      "success"
    );
  };

  const handleApprove = (dayKey: string, entry: DayEntry) => {
    const approvedEntry: DayEntry = {
      ...entry,
      type: entry.type === "pending_leave" ? "leave" :
            entry.type === "pending_od" ? "od" :
            "wfh",
      approvalStatus: "approved",
      approvedDate: Date.now(),
      approvedBy: "Manager", // In real app, this would be the actual manager
    };

    markDay(dayKey, approvedEntry);
    emitAlert("Approved", "Application has been approved", "success");
  };

  const handleReject = (dayKey: string, entry: DayEntry) => {
    const rejectedEntry: DayEntry = {
      ...entry,
      approvalStatus: "rejected",
      approvedDate: Date.now(),
      approvedBy: "Manager",
    };

    markDay(dayKey, rejectedEntry);
    emitAlert("Rejected", "Application has been rejected", "warning");
  };

  const handleMarkOffice = (dayKey: string) => {
    markDay(dayKey, {
      type: "wfo",
      hours: 9.5,
      loginTs: new Date(`${dayKey} 09:00`).getTime(),
      logoutTs: new Date(`${dayKey} 18:30`).getTime(),
    });
    emitAlert("Marked as Office", "Day has been marked as work from office", "success");
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
        <div className="mx-auto max-w-3xl rounded-xl bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <h2 className="text-xl font-bold">Leave, OD & WFH Management</h2>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-canvas">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {(["apply", "pending", "approved"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-brand-blue text-brand-blue"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {tab}
                {tab === "pending" && pendingEntries.length > 0 && (
                  <span className="ml-2 rounded-full bg-yellow-500 px-2 py-0.5 text-xs text-white">
                    {pendingEntries.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Apply Tab */}
            {activeTab === "apply" && (
              <div className="space-y-4">
                {/* Leave Balance */}
                <div>
                  <h3 className="text-sm font-semibold text-ink-muted mb-2">Leave Balance</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-canvas p-3">
                      <div className="text-xs text-ink-muted">Casual</div>
                      <div className="text-lg font-bold">{leaveBalance.casual}</div>
                    </div>
                    <div className="rounded-lg bg-canvas p-3">
                      <div className="text-xs text-ink-muted">Sick</div>
                      <div className="text-lg font-bold">{leaveBalance.sick}</div>
                    </div>
                    <div className="rounded-lg bg-canvas p-3">
                      <div className="text-xs text-ink-muted">Earned</div>
                      <div className="text-lg font-bold">{leaveBalance.earned}</div>
                    </div>
                    <div className="rounded-lg bg-canvas p-3">
                      <div className="text-xs text-ink-muted">Comp Off</div>
                      <div className="text-lg font-bold">{leaveBalance.comp_off}</div>
                    </div>
                  </div>
                </div>

                {/* OD Tracker */}
                <div className="rounded-lg bg-brand-blue/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-brand-blue" />
                      <span className="text-sm font-semibold">OD Usage This Month</span>
                    </div>
                    <span className="text-lg font-bold text-brand-blue">
                      {odThisMonth}/{state.odAllowancePerMonth || 2}
                    </span>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="w-full rounded-lg bg-brand-blue px-4 py-3 text-sm font-bold text-white"
                >
                  {showAddForm ? "Hide Form" : "Apply for Leave / OD"}
                </button>

                {/* Application Form */}
                {showAddForm && (
                  <div className="rounded-lg border p-4 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-ink-muted">Type</label>
                      <select
                        value={applicationData.type}
                        onChange={(e) => setApplicationData({
                          ...applicationData,
                          type: e.target.value as any
                        })}
                        className="mt-1 w-full rounded-lg bg-canvas px-3 py-2 text-sm"
                      >
                        <option value="leave">Leave</option>
                        <option value="od">On Duty (OD)</option>
                      </select>
                    </div>

                    {applicationData.type === "leave" && (
                      <div>
                        <label className="text-xs font-semibold text-ink-muted">Leave Type</label>
                        <select
                          value={applicationData.leaveType}
                          onChange={(e) => setApplicationData({
                            ...applicationData,
                            leaveType: e.target.value as any
                          })}
                          className="mt-1 w-full rounded-lg bg-canvas px-3 py-2 text-sm"
                        >
                          <option value="casual">Casual Leave</option>
                          <option value="sick">Sick Leave</option>
                          <option value="earned">Earned Leave</option>
                          <option value="comp_off">Comp Off</option>
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-ink-muted">Start Date</label>
                        <input
                          type="date"
                          value={applicationData.date}
                          onChange={(e) => setApplicationData({
                            ...applicationData,
                            date: e.target.value
                          })}
                          className="mt-1 w-full rounded-lg bg-canvas px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-ink-muted">End Date</label>
                        <input
                          type="date"
                          value={applicationData.endDate}
                          min={applicationData.date}
                          onChange={(e) => setApplicationData({
                            ...applicationData,
                            endDate: e.target.value
                          })}
                          className="mt-1 w-full rounded-lg bg-canvas px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-ink-muted">
                        {applicationData.type === "od" ? "OD Purpose" : "Reason"}
                      </label>
                      <textarea
                        value={
                          applicationData.type === "od" ? applicationData.odPurpose : applicationData.reason
                        }
                        onChange={(e) => setApplicationData({
                          ...applicationData,
                          [applicationData.type === "od" ? "odPurpose" : "reason"]: e.target.value
                        })}
                        placeholder={
                          applicationData.type === "od" ? "e.g., Client meeting at site" : "e.g., Family function"
                        }
                        className="mt-1 w-full rounded-lg bg-canvas px-3 py-2 text-sm h-20"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleApply}
                        className="flex-1 rounded-lg bg-brand-lime px-3 py-2 text-sm font-bold text-ink"
                      >
                        Submit Application
                      </button>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="flex-1 rounded-lg bg-canvas px-3 py-2 text-sm font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pending Tab */}
            {activeTab === "pending" && (
              <div className="space-y-3">
                {pendingEntries.length === 0 ? (
                  <p className="text-center text-sm text-ink-muted py-8">No pending applications</p>
                ) : (
                  pendingEntries.map(([dayKey, entry]) => (
                    <div key={dayKey} className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {entry.type === "pending_leave" && <Calendar className="h-4 w-4 text-yellow-600" />}
                            {entry.type === "pending_od" && <Briefcase className="h-4 w-4 text-yellow-600" />}
                            {entry.type === "planned_wfh" && <Home className="h-4 w-4 text-yellow-600" />}
                            <span className="text-sm font-semibold">
                              {entry.type === "pending_leave" ? `Leave - ${entry.leaveType?.toUpperCase()}` :
                               entry.type === "pending_od" ? "On Duty" :
                               "Planned WFH"}
                            </span>
                            <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-xs text-white">
                              Pending
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted">
                            Date: {formatDatePretty(new Date(dayKey))}
                          </p>
                          {entry.comments && (
                            <p className="text-xs text-ink-muted mt-1">
                              Reason: {entry.comments}
                            </p>
                          )}
                          {entry.appliedDate && (
                            <p className="text-xs text-ink-muted">
                              Applied on: {new Date(entry.appliedDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleApprove(dayKey, entry)}
                            className="rounded-lg bg-brand-lime px-3 py-1.5 text-xs font-bold text-ink"
                            title="Approve"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleReject(dayKey, entry)}
                            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white"
                            title="Reject"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          {entry.type === "planned_wfh" && (
                            <button
                              onClick={() => handleMarkOffice(dayKey)}
                              className="rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-bold text-white"
                              title="Mark as Office"
                            >
                              <Building className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Approved Tab */}
            {activeTab === "approved" && (
              <div className="space-y-3">
                {approvedEntries.length === 0 ? (
                  <p className="text-center text-sm text-ink-muted py-8">No approved applications</p>
                ) : (
                  approvedEntries.map(([dayKey, entry]) => (
                    <div key={dayKey} className="rounded-lg border border-brand-lime/30 bg-brand-lime/10 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {(entry.type === "leave" || entry.type === "pending_leave") &&
                              <Calendar className="h-4 w-4 text-brand-blue" />}
                            {(entry.type === "od" || entry.type === "pending_od") &&
                              <Briefcase className="h-4 w-4 text-brand-blue" />}
                            {(entry.type === "wfh" || entry.type === "planned_wfh") &&
                              <Home className="h-4 w-4 text-brand-blue" />}
                            <span className="text-sm font-semibold">
                              {entry.type === "leave" || entry.type === "pending_leave" ?
                                `Leave - ${entry.leaveType?.toUpperCase()}` :
                               entry.type === "od" || entry.type === "pending_od" ? "On Duty" :
                               "Work From Home"}
                            </span>
                            <span className="rounded-full bg-brand-lime px-2 py-0.5 text-xs text-ink">
                              Approved
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted">
                            Date: {formatDatePretty(new Date(dayKey))}
                          </p>
                          {entry.comments && (
                            <p className="text-xs text-ink-muted mt-1">
                              Reason: {entry.comments}
                            </p>
                          )}
                          {entry.approvedDate && (
                            <p className="text-xs text-ink-muted">
                              Approved on: {new Date(entry.approvedDate).toLocaleDateString()}
                              {entry.approvedBy && ` by ${entry.approvedBy}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}