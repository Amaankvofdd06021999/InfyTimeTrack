import { useEffect } from "react";
import { Bus, Car, Bell, X } from "lucide-react";
import { useStore } from "@/lib/officeflow/store";

export function TransportReminder() {
  const { state, markDay, emitAlert } = useStore();

  useEffect(() => {
    // Check for tomorrow's transport needs
    const checkTransportReminder = () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Skip weekends
      if (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) return;

      const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
      const tomorrowEntry = state.days[tomorrowKey];

      // Check if tomorrow is a working day and not marked as WFH/leave/holiday
      const needsTransport = !tomorrowEntry ||
        (!["wfh", "planned_wfh", "leave", "od", "holiday", "weekend", "pending_leave", "pending_od"].includes(tomorrowEntry.type));

      // Check if reminder was already shown today
      const lastReminderKey = `transport-reminder-${tomorrowKey}`;
      const lastReminderShown = localStorage.getItem(lastReminderKey);
      const today = new Date().toISOString().split("T")[0];

      if (needsTransport && lastReminderShown !== today) {
        // Show transport reminder
        showTransportModal(tomorrow, tomorrowKey);
        localStorage.setItem(lastReminderKey, today);
      }
    };

    // Check immediately on mount
    checkTransportReminder();

    // Check every hour
    const interval = setInterval(checkTransportReminder, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [state.days]);

  const showTransportModal = (date: Date, dayKey: string) => {
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in";

    const content = `
      <div class="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
        <div class="flex items-start gap-3 mb-4">
          <div class="rounded-full bg-brand-blue/10 p-2">
            <svg class="h-6 w-6 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-bold text-ink">Transport Reminder</h3>
            <p class="text-sm text-ink-muted mt-1">
              Tomorrow (${date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}) is an office day
            </p>
          </div>
        </div>

        <div class="rounded-lg bg-brand-blue/5 border border-brand-blue/20 p-3 mb-4">
          <p class="text-xs font-semibold text-brand-blue mb-2">Book your transport now:</p>
          <div class="space-y-2">
            <button onclick="window.bookCab('${dayKey}')" class="w-full flex items-center gap-2 rounded-lg bg-white border border-brand-blue/30 px-3 py-2 text-sm font-semibold hover:bg-brand-blue hover:text-white transition-colors">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Book Cab
            </button>
            <button onclick="window.bookBus('${dayKey}')" class="w-full flex items-center gap-2 rounded-lg bg-white border border-brand-blue/30 px-3 py-2 text-sm font-semibold hover:bg-brand-blue hover:text-white transition-colors">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
              </svg>
              Book Bus
            </button>
          </div>
        </div>

        <div class="text-[11px] text-ink-muted mb-3">
          Tip: Mark WFH days in advance to skip these reminders
        </div>

        <div class="flex gap-2">
          <button onclick="window.markWFH('${dayKey}')" class="flex-1 rounded-lg bg-brand-lime px-3 py-2 text-sm font-bold text-ink">
            Mark as WFH
          </button>
          <button onclick="this.closest('.fixed').remove()" class="flex-1 rounded-lg bg-canvas px-3 py-2 text-sm font-bold text-ink">
            Dismiss
          </button>
        </div>
      </div>
    `;

    modal.innerHTML = content;
    document.body.appendChild(modal);

    // Add global functions for button handlers
    (window as any).bookCab = (dayKey: string) => {
      const cabTime = prompt("Enter cab booking time (e.g., 8:30 AM):");
      if (cabTime) {
        const entry = state.days[dayKey] || { type: "wfo" };
        markDay(dayKey, { ...entry, cabBookingTime: cabTime });
        emitAlert("Cab Booked", `Cab booked for ${cabTime} tomorrow`, "success");
        modal.remove();
      }
    };

    (window as any).bookBus = (dayKey: string) => {
      const busTime = prompt("Enter preferred bus time (e.g., 8:00 AM):");
      if (busTime) {
        const entry = state.days[dayKey] || { type: "wfo" };
        markDay(dayKey, { ...entry, busTime });
        emitAlert("Bus Preference Set", `Bus time set for ${busTime} tomorrow`, "success");
        modal.remove();
      }
    };

    (window as any).markWFH = (dayKey: string) => {
      markDay(dayKey, { type: "planned_wfh" });
      emitAlert("Marked as WFH", "Tomorrow marked as planned WFH", "success");
      modal.remove();
    };
  };

  return null; // This is a background component
}