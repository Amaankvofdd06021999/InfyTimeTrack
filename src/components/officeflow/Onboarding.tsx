import { useState } from "react";
import { ArrowRight, User, Bell, Database } from "lucide-react";
import { useStore } from "@/lib/officeflow/store";

export function Onboarding() {
  const { setUserName, setOnboarded, setLocalDataEnabled, setNotificationsEnabled, requestNotifications, emitAlert } = useStore();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [enableLocal, setEnableLocal] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);

  const handleComplete = async () => {
    if (name) {
      setUserName(name);
      setLocalDataEnabled(enableLocal);
      setNotificationsEnabled(enableNotifications);

      if (enableNotifications) {
        await requestNotifications();
      }

      setOnboarded(true);
      emitAlert("Welcome to InfyTimeTrack!", `Nice to meet you, ${name}!`, "success");
    }
  };

  const handleNext = () => {
    if (step === 1 && !name) {
      emitAlert("Name required", "Please enter your name to continue");
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-5">
      <div className="w-full max-w-[420px] space-y-4">
        {/* Progress indicator */}
        <div className="flex gap-2 justify-center">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-12 rounded-full transition-colors ${
                i <= step ? "bg-brand-blue" : "bg-canvas"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue text-white mb-4">
                  <User className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-extrabold">Welcome to InfyTimeTrack</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Let's get you set up in just a minute
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">What's your name?</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-lg bg-canvas px-4 py-3 text-base font-medium outline-none focus:ring-2 focus:ring-brand-blue"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-lime text-ink mb-4 animate-pulse">
                  <Bell className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-extrabold">🔔 Enable Notifications</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  <strong>Important:</strong> Get alerts when you reach 4 hours and 6 hours of office time!
                </p>
              </div>
              <label className="flex items-center justify-between p-4 rounded-lg bg-canvas cursor-pointer border-2 border-brand-blue">
                <div className="flex-1">
                  <div className="font-semibold">🔔 Enable Browser Notifications</div>
                  <div className="text-xs text-ink-muted">
                    Get alerts even when the app is in background
                  </div>
                  <div className="text-[11px] text-brand-blue font-semibold mt-1">
                    Chrome/Edge will ask for permission when you enable this
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableNotifications}
                  onChange={(e) => setEnableNotifications(e.target.checked)}
                  className="h-5 w-5 rounded accent-brand-blue"
                />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-lavender text-ink mb-4">
                  <Database className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-extrabold">Data Storage</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Keep your tracking data saved locally
                </p>
              </div>
              <label className="flex items-center justify-between p-4 rounded-lg bg-canvas cursor-pointer">
                <div className="flex-1">
                  <div className="font-semibold">Enable Local Storage</div>
                  <div className="text-xs text-ink-muted">Save data between sessions</div>
                </div>
                <input
                  type="checkbox"
                  checked={enableLocal}
                  onChange={(e) => setEnableLocal(e.target.checked)}
                  className="h-5 w-5 rounded accent-brand-blue"
                />
              </label>
            </div>
          )}

          {/* Navigation */}
          <button
            onClick={handleNext}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-bold text-white tap tap-press"
          >
            {step === 3 ? "Get Started" : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}