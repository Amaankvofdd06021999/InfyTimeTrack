import { useState } from "react";
import { AlertCircle, Clock, Home, X, Check, AlertTriangle } from "lucide-react";
import { calculateWFHNeeded, formatTime, REQUIRED_OFFICE_HOURS } from "@/lib/officeflow/utils";

interface WFHSuggestionModalProps {
  loginTime: number;
  logoutTime: number;
  actualHours: number;
  onClose: () => void;
  onApplyWFH?: (hours: number, startTime: string, endTime: string) => void;
}

export function WFHSuggestionModal({
  loginTime,
  logoutTime,
  actualHours,
  onClose,
  onApplyWFH
}: WFHSuggestionModalProps) {
  const loginDate = new Date(loginTime);
  const logoutDate = new Date(logoutTime);
  const wfhInfo = calculateWFHNeeded(loginDate, logoutDate);

  const [applyWFH, setApplyWFH] = useState(wfhInfo.wfhHoursNeeded > 0);
  const [customStart, setCustomStart] = useState(wfhInfo.suggestedWFHStart);
  const [customEnd, setCustomEnd] = useState(wfhInfo.suggestedWFHEnd);

  // Check if user should continue in office instead
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentTimeInHours = currentHour + currentMinutes / 60;
  const hoursLeftInDay = Math.max(0, (20.5 - currentTimeInHours)); // Hours until 8:30 PM

  // Show warning if:
  // 1. Worked less than 2 hours AND can still work 5+ hours today, OR
  // 2. Worked less than 4 hours AND can complete 9.5h by staying in office
  const canComplete9_5ByStaying = actualHours + hoursLeftInDay >= REQUIRED_OFFICE_HOURS;
  const shouldStayInOffice = (actualHours < 2 && hoursLeftInDay >= 5) ||
                             (actualHours < 4 && canComplete9_5ByStaying);

  const handleConfirm = () => {
    if (applyWFH && onApplyWFH && wfhInfo.wfhHoursNeeded > 0) {
      onApplyWFH(wfhInfo.wfhHoursNeeded, customStart, customEnd);
    }
    onClose();
  };

  // If no WFH needed, show success message
  if (actualHours >= REQUIRED_OFFICE_HOURS) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Day Complete!</h3>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-canvas">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col items-center py-6">
            <div className="mb-4 rounded-full bg-brand-lime/20 p-3">
              <Check className="h-8 w-8 text-brand-blue" />
            </div>
            <p className="text-center text-sm text-ink-muted">
              Great job! You've completed {actualHours.toFixed(1)} hours today.
              No WFH hours needed.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-lg bg-brand-lime px-4 py-2 text-sm font-bold text-ink"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">
            {shouldStayInOffice ? "⚠️ Too Early to Log Out" : "Complete Your Day"}
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-canvas">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Warning if logging out too early */}
        {shouldStayInOffice && (
          <div className="mb-4 rounded-lg bg-red-50 border-2 border-red-200 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-900">
                  ⚠️ Recommendation: Continue Working in Office
                </p>
                <p className="text-xs text-red-700 mt-1">
                  You've only worked <strong>{actualHours.toFixed(1)} hours</strong> today.
                  You still have <strong>{hoursLeftInDay.toFixed(1)} hours</strong> before 8:30 PM cutoff.
                </p>
                {canComplete9_5ByStaying && (
                  <p className="text-xs text-brand-blue mt-2 font-semibold">
                    ✅ You can complete full {REQUIRED_OFFICE_HOURS}h by staying until {
                      new Date(Date.now() + (REQUIRED_OFFICE_HOURS - actualHours) * 3600 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    }
                  </p>
                )}
                <p className="text-xs text-red-600 mt-2 font-semibold">
                  💡 Stay in office to complete more hours instead of applying unnecessary WFH!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Office Hours Summary */}
        <div className="rounded-lg bg-canvas p-4 mb-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-brand-blue" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Office Hours Logged</p>
              <p className="text-xs text-ink-muted">
                {formatTime(loginTime)} - {formatTime(logoutTime)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{actualHours.toFixed(1)}h</p>
              <p className="text-xs text-ink-muted">of {REQUIRED_OFFICE_HOURS}h</p>
            </div>
          </div>
        </div>

        {/* WFH Suggestion - Only show if not recommending to stay */}
        {wfhInfo.wfhHoursNeeded > 0 && !shouldStayInOffice && (
          <>
            <div className="rounded-lg border-2 border-brand-blue/30 bg-brand-blue/10 p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-brand-blue mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-blue">
                    WFH Hours Recommended
                  </p>
                  <p className="text-xs text-ink-muted mt-1">
                    You need <strong>{wfhInfo.wfhHoursNeeded.toFixed(1)} hours</strong> of WFH
                    to complete the required {REQUIRED_OFFICE_HOURS} hours for today.
                  </p>
                </div>
              </div>
            </div>

            {/* Apply WFH Checkbox */}
            <label className="flex items-center gap-3 p-3 rounded-lg bg-canvas cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={applyWFH}
                onChange={(e) => setApplyWFH(e.target.checked)}
                className="h-4 w-4 rounded accent-brand-blue"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold">Apply WFH Hours</p>
                <p className="text-xs text-ink-muted">
                  Mark {wfhInfo.wfhHoursNeeded.toFixed(1)} hours as Work From Home
                </p>
              </div>
            </label>

            {/* Time Selection */}
            {applyWFH && (
              <div className="space-y-3 mb-4 p-3 rounded-lg bg-brand-lime/10">
                <p className="text-xs font-semibold text-ink-muted">Suggested WFH Time</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-ink-muted">Start</label>
                    <input
                      type="time"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-muted">End</label>
                    <input
                      type="time"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                </div>
                <p className="text-xs text-ink-muted">
                  💡 Tip: Apply WFH hours before your office login time (before {formatTime(loginTime)})
                </p>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {shouldStayInOffice ? (
            <>
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-canvas px-4 py-2 text-sm font-bold text-ink-muted"
              >
                Log Out Anyway
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white animate-pulse"
              >
                Continue Working ✓
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-canvas px-4 py-2 text-sm font-bold"
              >
                Skip
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white"
              >
                {applyWFH && wfhInfo.wfhHoursNeeded > 0 ? "Log Out & Apply WFH" : "Log Out"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}