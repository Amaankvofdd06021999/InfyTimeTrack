import { useEffect, useState } from "react";
import { Bus, Car, Bell, Clock } from "lucide-react";
import { useStore } from "@/lib/officeflow/store";
import { pad } from "@/lib/officeflow/utils";

export function TransportReminders() {
  const { state, emitAlert } = useStore();
  const [cabTime, setCabTime] = useState(state.transportPreferences?.defaultCabTime || "08:30");
  const [busTime, setBusTime] = useState(state.transportPreferences?.defaultBusTime || "08:00");
  const [reminderMinutes, setReminderMinutes] = useState(state.transportPreferences?.reminderMinutesBefore || 30);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  // Check for transport reminders
  useEffect(() => {
    if (!remindersEnabled) return;

    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

      // Calculate reminder times
      const cabReminderTime = calculateReminderTime(cabTime, reminderMinutes);
      const busReminderTime = calculateReminderTime(busTime, reminderMinutes);

      if (currentTime === cabReminderTime) {
        emitAlert(
          "Cab Booking Reminder",
          `Time to book your cab for ${cabTime}`,
          "warning"
        );
      }

      if (currentTime === busReminderTime) {
        emitAlert(
          "Bus Reminder",
          `Your bus is scheduled at ${busTime}`,
          "warning"
        );
      }
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Check immediately

    return () => clearInterval(interval);
  }, [cabTime, busTime, reminderMinutes, remindersEnabled, emitAlert]);

  const calculateReminderTime = (time: string, minutesBefore: number): string => {
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() - minutesBefore);
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const savePreferences = () => {
    // This would save to state in a real implementation
    emitAlert("Preferences Saved", "Transport reminder settings updated", "success");
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm shadow-black/5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold">Transport Schedule</h3>
        <button
          onClick={() => setRemindersEnabled(!remindersEnabled)}
          className={`rounded-full p-2 ${remindersEnabled ? "bg-brand-lime" : "bg-canvas"}`}
        >
          <Bell className={`h-3.5 w-3.5 ${remindersEnabled ? "text-ink" : "text-ink-muted"}`} />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {/* Cab Booking Time */}
        <div className="flex items-center justify-between rounded-lg bg-canvas p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-brand-blue p-2">
              <Car className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold">Cab Booking</div>
              <div className="text-xs text-ink-muted">Daily reminder</div>
            </div>
          </div>
          <input
            type="time"
            value={cabTime}
            onChange={(e) => setCabTime(e.target.value)}
            className="rounded-lg bg-white px-2 py-1 text-sm font-medium outline-none"
          />
        </div>

        {/* Bus Time */}
        <div className="flex items-center justify-between rounded-lg bg-canvas p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-lavender p-2">
              <Bus className="h-3.5 w-3.5 text-ink" />
            </div>
            <div>
              <div className="text-sm font-semibold">Bus Schedule</div>
              <div className="text-xs text-ink-muted">Daily reminder</div>
            </div>
          </div>
          <input
            type="time"
            value={busTime}
            onChange={(e) => setBusTime(e.target.value)}
            className="rounded-lg bg-white px-2 py-1 text-sm font-medium outline-none"
          />
        </div>

        {/* Reminder Time Before */}
        <div className="flex items-center justify-between rounded-lg bg-canvas p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-brand-lime p-2">
              <Clock className="h-3.5 w-3.5 text-ink" />
            </div>
            <div>
              <div className="text-sm font-semibold">Remind Before</div>
              <div className="text-xs text-ink-muted">Minutes before schedule</div>
            </div>
          </div>
          <select
            value={reminderMinutes}
            onChange={(e) => setReminderMinutes(Number(e.target.value))}
            className="rounded-lg bg-white px-2 py-1 text-sm font-medium outline-none"
          >
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 hour</option>
          </select>
        </div>
      </div>

      <button
        onClick={savePreferences}
        className="mt-4 w-full rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white tap tap-press"
      >
        Save Preferences
      </button>

      {remindersEnabled && (
        <div className="mt-3 rounded-lg bg-brand-lime/10 p-3">
          <div className="flex items-start gap-2">
            <Bell className="h-3.5 w-3.5 mt-0.5 text-brand-lime" />
            <div className="text-xs">
              <div className="font-semibold text-ink">Reminders Active</div>
              <div className="mt-0.5 text-ink-muted">
                You'll be notified {reminderMinutes} minutes before your scheduled times
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}