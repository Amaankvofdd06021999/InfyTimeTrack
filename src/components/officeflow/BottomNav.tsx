import { Home, CalendarDays, ListChecks, Settings2 } from "lucide-react";
import type { View } from "./types";

const items: { id: View; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "log", label: "Log", icon: ListChecks },
  { id: "settings", label: "Settings", icon: Settings2 },
];

export function BottomNav({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="flex w-full max-w-[380px] items-center justify-between rounded-full bg-ink px-2 py-2 shadow-xl shadow-black/25">
        {items.map((it) => {
          const active = view === it.id;
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs font-semibold tap tap-press ${
                active ? "bg-brand-lime text-ink" : "text-white/80"
              }`}
              aria-label={it.label}
            >
              <Icon className="h-4 w-4" strokeWidth={2.5} />
              {active ? <span>{it.label}</span> : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
