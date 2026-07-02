import { useEffect, useState } from "react";
import { Bell, Check, Minus, Plus, Trash2, Database, User, Download } from "lucide-react";
import { useStore } from "@/lib/officeflow/store";

export function SettingsView() {
  const { state, setAllowance, notifyPermission, requestNotifications, emitAlert, clearAllData, setLocalDataEnabled, setNotificationsEnabled, setUserName } = useStore();
  const [draft, setDraft] = useState(state.allowance);
  const [nameInput, setNameInput] = useState(state.userName || "");
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event
    const handleInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  useEffect(() => setDraft(state.allowance), [state.allowance]);

  const dirty = draft !== state.allowance;

  const permLabel =
    notifyPermission === "granted"
      ? "Enabled"
      : notifyPermission === "denied"
        ? "Blocked in browser"
        : notifyPermission === "unsupported"
          ? "Not supported here"
          : "Not yet enabled";

  return (
    <div className="space-y-4 pb-32 pt-4">
      <header>
        <div className="text-xs font-semibold text-ink-muted">Preferences</div>
        <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
      </header>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-blue text-white">
            <User className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold">Your Name</div>
            <div className="text-xs text-ink-muted">
              Used for personalized greetings
            </div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter your name"
              className="mt-3 w-full rounded-lg bg-canvas px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </div>
        <button
          onClick={() => {
            setUserName(nameInput);
            emitAlert("Name updated", `Welcome, ${nameInput}!`, "success");
          }}
          disabled={nameInput === state.userName || !nameInput}
          className={`mt-4 w-full rounded-lg px-4 py-3 text-sm font-bold tap tap-press ${
            nameInput !== state.userName && nameInput ? "bg-ink text-white" : "bg-canvas text-ink-muted"
          }`}
        >
          Save Name
        </button>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <div className="text-xs font-semibold text-ink-muted">Monthly WFH allowance</div>
        <div className="mt-1 text-base font-bold">How many WFH days can you take each month?</div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setDraft((d) => Math.max(0, d - 1))}
            className="grid h-11 w-11 place-items-center rounded-full bg-canvas tap tap-press"
            aria-label="Decrease"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex-1 rounded-2xl bg-canvas py-3 text-center text-3xl font-extrabold tabular-nums">
            {draft}
          </div>
          <button
            onClick={() => setDraft((d) => Math.min(31, d + 1))}
            className="grid h-11 w-11 place-items-center rounded-full bg-canvas tap tap-press"
            aria-label="Increase"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={() => {
            setAllowance(draft);
            emitAlert("Allowance updated", `Now ${draft} WFH days per month.`, "success");
          }}
          disabled={!dirty}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold tap tap-press ${
            dirty ? "bg-ink text-white" : "bg-canvas text-ink-muted"
          }`}
        >
          <Check className="h-4 w-4" /> Save allowance
        </button>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm border-2 border-brand-blue">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-lime animate-pulse">
            <Bell className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold">🔔 Enable Notifications</div>
            <div className="text-xs text-ink-muted">
              Get alerts when you reach 4 hours and 6 hours of office time. Notifications work even when the app is in the background!
            </div>
            <div className="mt-2 text-[11px] font-semibold text-ink-muted">
              Status: <span className={notifyPermission === "granted" ? "text-green-600" : "text-orange-600"}>
                {permLabel}
              </span>
            </div>
            {notifyPermission === "default" && (
              <div className="mt-2 text-[11px] text-brand-blue font-semibold">
                👆 Click the button below to enable notifications!
              </div>
            )}
          </div>
        </div>
        <button
          onClick={async () => {
            const result = await requestNotifications();
            if (result === "granted") {
              // Test notification
              new Notification("InfyTimeTrack Notifications Enabled! 🎉", {
                body: "You'll receive alerts at 4h and 6h milestones",
                icon: '/logoforIT.png'
              });
            }
          }}
          disabled={notifyPermission === "granted" || notifyPermission === "denied" || notifyPermission === "unsupported"}
          className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-bold tap tap-press ${
            notifyPermission === "default" ? "bg-brand-blue text-white animate-pulse" : "bg-canvas text-ink-muted"
          }`}
        >
          {notifyPermission === "granted" ? "✅ Notifications Enabled" : notifyPermission === "denied" ? "❌ Blocked — enable in browser settings" : notifyPermission === "unsupported" ? "Unsupported browser" : "🔔 Enable Browser Notifications"}
        </button>
        {notifyPermission === "denied" && (
          <div className="mt-3 text-[11px] text-destructive">
            <strong>To enable notifications:</strong>
            <ol className="mt-1 ml-3 list-decimal">
              <li>Click the lock icon in your browser's address bar</li>
              <li>Find "Notifications" in the permissions</li>
              <li>Change it from "Block" to "Allow"</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lavender">
            <Database className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold">Local Data Storage</div>
            <div className="text-xs text-ink-muted">
              Keep all your tracking data on this device. When enabled, data persists between sessions.
            </div>
            <div className="mt-2 text-[11px] font-semibold text-ink-muted">
              Status: {state.localDataEnabled ? "Enabled" : "Disabled"}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setLocalDataEnabled(!state.localDataEnabled);
            emitAlert(
              state.localDataEnabled ? "Local storage disabled" : "Local storage enabled",
              state.localDataEnabled ? "Data will not persist" : "Your data is now saved locally"
            );
          }}
          className="mt-4 w-full rounded-lg bg-brand-blue px-4 py-3 text-sm font-bold text-white tap tap-press"
        >
          {state.localDataEnabled ? "Disable Local Storage" : "Enable Local Storage"}
        </button>
      </section>

      {!isInstalled && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-blue text-white">
              <Download className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold">Install as Chrome App</div>
              <div className="text-xs text-ink-muted">
                Install InfyTimeTrack as a standalone app on your device for quick access and offline support.
              </div>
            </div>
          </div>
          <button
            onClick={async () => {
              if (installPrompt) {
                installPrompt.prompt();
                const { outcome } = await installPrompt.userChoice;
                if (outcome === 'accepted') {
                  setIsInstalled(true);
                  emitAlert("App installed!", "InfyTimeTrack has been added to your device", "success");
                }
                setInstallPrompt(null);
              } else {
                emitAlert("Installation not available", "Open in Chrome and try again", "warning");
              }
            }}
            disabled={!installPrompt}
            className={`mt-4 w-full rounded-lg px-4 py-3 text-sm font-bold text-white tap tap-press ${
              installPrompt ? "bg-brand-blue" : "bg-gray-400"
            }`}
          >
            {installPrompt ? "Install App" : "Installation not available"}
          </button>
        </section>
      )}

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-destructive text-white">
            <Trash2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold">Clear All Data</div>
            <div className="text-xs text-ink-muted">
              Delete all tracking history, logs, and settings. This action cannot be undone.
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm("Are you sure you want to delete all data? This cannot be undone.")) {
              clearAllData();
            }
          }}
          className="mt-4 w-full rounded-lg bg-destructive px-4 py-3 text-sm font-bold text-white tap tap-press"
        >
          Clear All Data
        </button>
      </section>

      <section className="rounded-xl bg-ink p-5 text-white shadow-sm">
        <div className="text-xs font-semibold opacity-70">Privacy</div>
        <div className="mt-1 text-sm font-medium opacity-90">
          Everything you log stays on this device, in local storage. No account, no server, no sharing.
        </div>
      </section>

      <div className="pt-2 text-center text-[11px] text-ink-muted">InfyTimeTrack · v1.0</div>
    </div>
  );
}
