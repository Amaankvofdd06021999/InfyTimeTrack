import { useState } from "react";
import { Edit3, Save, X } from "lucide-react";
import { useStore } from "@/lib/officeflow/store";
import { formatTime, pad } from "@/lib/officeflow/utils";
import type { DayEntry } from "@/lib/officeflow/store";

interface EditSessionProps {
  date: string;
  entry: DayEntry;
  onClose: () => void;
  onSave: () => void;
}

export function EditSession({ date, entry, onClose, onSave }: EditSessionProps) {
  const { markDay } = useStore();

  const [loginTime, setLoginTime] = useState(() => {
    if (entry.loginTs) {
      const d = new Date(entry.loginTs);
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return "09:00";
  });

  const [logoutTime, setLogoutTime] = useState(() => {
    if (entry.logoutTs) {
      const d = new Date(entry.logoutTs);
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return "18:00";
  });

  const handleSave = () => {
    const [loginH, loginM] = loginTime.split(":").map(Number);
    const [logoutH, logoutM] = logoutTime.split(":").map(Number);

    const loginDate = new Date(date);
    loginDate.setHours(loginH, loginM, 0, 0);

    const logoutDate = new Date(date);
    logoutDate.setHours(logoutH, logoutM, 0, 0);

    const hours = (logoutDate.getTime() - loginDate.getTime()) / (3600 * 1000);

    markDay(date, {
      ...entry,
      loginTs: loginDate.getTime(),
      logoutTs: logoutDate.getTime(),
      hours: Math.max(0, hours),
      edited: true,
    });

    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Edit Session Time</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-canvas"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-ink-muted">
              Login Time
            </label>
            <input
              type="time"
              value={loginTime}
              onChange={(e) => setLoginTime(e.target.value)}
              className="mt-1 w-full rounded-lg bg-canvas px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-muted">
              Logout Time
            </label>
            <input
              type="time"
              value={logoutTime}
              onChange={(e) => setLogoutTime(e.target.value)}
              className="mt-1 w-full rounded-lg bg-canvas px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white tap tap-press"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-canvas px-4 py-2 text-sm font-bold text-ink tap tap-press"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}