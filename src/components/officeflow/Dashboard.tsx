import { useMemo, useState } from "react";
import { ArrowUpRight, Bell, Clock3, Flame, Home as HomeIcon, Building2, ChevronLeft } from "lucide-react";
import { useStore } from "@/lib/officeflow/store";
import { gamification, monthStats, todayEntry } from "@/lib/officeflow/selectors";
import { FULL_DAY_HOURS, FULL_DAY_MS, formatHMS, formatHours, formatTime, MAX_SESSION_MS, pad, todayKey } from "@/lib/officeflow/utils";
import type { View } from "./types";

type DailyStep = "choose" | "wfo-time";

export function Dashboard({ onNavigate }: { onNavigate: (v: View) => void }) {
  const { state, now, markDay, startTimer, stopTimer, emitAlert } = useStore();
  const stats = useMemo(() => monthStats(state, new Date()), [state]);
  const game = useMemo(() => gamification(state), [state]);
  const today = todayEntry(state);
  const hasSession = state.session != null;
  const isEndOfDay = new Date(now).getHours() >= 17;

  const [step, setStep] = useState<DailyStep>("choose");
  const [loginHM, setLoginHM] = useState(() => {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const markWFH = () => {
    markDay(todayKey(), { type: "wfh" });
    emitAlert("Work from home marked", "Enjoy your day — quota updated.", "success");
  };

  const beginOfficeTimer = () => {
    const [h, m] = loginHM.split(":").map(Number);
    const d = new Date();
    d.setHours(h ?? d.getHours(), m ?? d.getMinutes(), 0, 0);
    const ts = Math.min(d.getTime(), Date.now());
    startTimer(ts);
    emitAlert("Office timer started", `Logged in at ${formatTime(ts)}.`);
    setStep("choose");
  };

  return (
    <div className="space-y-5 pb-32">
      <Header />

      {/* Daily decision / timer / today-logged / EOD prompt */}
      {hasSession ? (
        <TimerCard onLogout={() => {
          const res = stopTimer();
          if (res) {
            if (res.full) emitAlert("Full office day logged", `${formatHours(res.hours)} recorded.`, "success");
            else emitAlert("Partial office day logged", `${formatHours(res.hours)} recorded.`, "warning");
          }
        }} />
      ) : today ? (
        <TodayLoggedCard entry={today} />
      ) : step === "choose" ? (
        <ChooseCard
          eod={isEndOfDay}
          onWFH={markWFH}
          onWFO={() => setStep("wfo-time")}
        />
      ) : (
        <LoginTimeCard
          value={loginHM}
          onChange={setLoginHM}
          onBack={() => setStep("choose")}
          onStart={beginOfficeTimer}
        />
      )}

      {/* Hero WFH-left tile */}
      <HeroTile
        left={stats.wfhLeft}
        allowance={state.allowance}
        used={stats.wfhUsed}
        onOpen={() => onNavigate("calendar")}
      />

      {/* Gamification row */}
      <div className="grid grid-cols-2 gap-3">
        <StatChip
          bg="bg-brand-lime-soft"
          badgeBg="bg-brand-lime"
          icon={<Flame className="h-4 w-4" strokeWidth={2.5} />}
          value={`${game.streak}`}
          label="Day streak"
          hint={`Best: ${game.best}`}
        />
        <StatChip
          bg="bg-lavender-soft"
          badgeBg="bg-lavender"
          icon={<ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />}
          value={`${game.points}`}
          label={`Level ${game.level.level}`}
          hint={`${Math.round(game.level.pct)}% to next`}
          progress={game.level.pct}
        />
      </div>

      {/* Month glance */}
      <section className="rounded-xl bg-white p-5 shadow-sm shadow-black/5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Month at a glance</h2>
          <button
            onClick={() => onNavigate("log")}
            className="text-xs font-semibold text-ink-muted underline underline-offset-2"
          >
            See all
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniStat value={`${stats.wfoFullCount}`} label="Office full" tone="blue" />
          <MiniStat value={`${stats.wfoPartialCount}`} label="Partial" tone="lavender" />
          <MiniStat value={`${stats.wfhCount}`} label="WFH used" tone="lime" />
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-canvas px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-muted">
            <Clock3 className="h-3.5 w-3.5" /> Office hours this month
          </div>
          <div className="text-sm font-bold tabular-nums">{stats.officeHours.toFixed(1)}h</div>
        </div>
      </section>

      {/* Badges strip */}
      <section className="rounded-xl bg-white p-5 shadow-sm shadow-black/5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Badges</h2>
          <span className="text-xs font-medium text-ink-muted">
            {game.badges.filter((b) => b.earned).length}/{game.badges.length}
          </span>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {game.badges.map((b) => (
            <div
              key={b.id}
              className={`shrink-0 rounded-2xl px-3 py-2 text-xs ${
                b.earned ? "bg-brand-lime text-ink" : "bg-canvas text-ink-muted"
              }`}
              title={b.hint}
            >
              <div className="font-bold">{b.label}</div>
              <div className="text-[10px] opacity-80">{b.hint}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Header() {
  const { state } = useStore();
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const userName = state.userName || "User";

  return (
    <header className="flex items-center justify-between pt-4">
      <div>
        <div className="text-xs font-medium text-ink-muted">{greet}, {userName}</div>
        <div className="text-2xl font-extrabold tracking-tight">InfyTimeTrack</div>
      </div>
      <div className="relative rounded-full bg-white p-2.5 shadow-sm shadow-black/5">
        <Bell className="h-4 w-4" strokeWidth={2.5} />
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-lime" />
      </div>
    </header>
  );
}

function ChooseCard({
  eod,
  onWFH,
  onWFO,
}: {
  eod: boolean;
  onWFH: () => void;
  onWFO: () => void;
}) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm shadow-black/5">
      <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
        {eod ? <Bell className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
        {eod ? "End-of-day check-in" : "Today"}
      </div>
      <h2 className="mt-1 text-xl font-extrabold leading-tight">
        {eod ? "How did you work today?" : "Where are you working today?"}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={onWFH}
          className="flex flex-col items-start gap-2 rounded-2xl bg-brand-lime p-4 text-left tap tap-press"
        >
          <span className="rounded-full bg-ink p-1.5 text-white">
            <HomeIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <div>
            <div className="text-sm font-extrabold">Work from home</div>
            <div className="text-[11px] font-medium opacity-70">Uses 1 WFH day</div>
          </div>
        </button>
        <button
          onClick={onWFO}
          className="flex flex-col items-start gap-2 rounded-2xl bg-brand-blue p-4 text-left text-white tap tap-press"
        >
          <span className="rounded-full bg-white/20 p-1.5">
            <Building2 className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <div>
            <div className="text-sm font-extrabold">Work from office</div>
            <div className="text-[11px] font-medium opacity-80">Starts 6h timer</div>
          </div>
        </button>
      </div>
    </section>
  );
}

function LoginTimeCard({
  value,
  onChange,
  onBack,
  onStart,
}: {
  value: string;
  onChange: (v: string) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm shadow-black/5">
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-semibold text-ink-muted">
        <ChevronLeft className="h-3.5 w-3.5" /> Back
      </button>
      <h2 className="mt-2 text-xl font-extrabold leading-tight">What time did you log in?</h2>
      <p className="mt-1 text-xs text-ink-muted">The 6-hour timer counts from this moment.</p>
      <div className="mt-4 flex items-center gap-3">
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-2xl bg-canvas px-4 py-3 text-lg font-bold tabular-nums outline-none focus:ring-2 focus:ring-brand-blue"
        />
        <button
          onClick={onStart}
          className="rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white tap tap-press"
        >
          Start timer
        </button>
      </div>
    </section>
  );
}

function TimerCard({ onLogout }: { onLogout: () => void }) {
  const { state, now } = useStore();
  const s = state.session!;
  const elapsed = Math.min(MAX_SESSION_MS, now - s.loginTs);
  const pct = Math.min(100, (elapsed / FULL_DAY_MS) * 100);

  // Ring geometry
  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);

  return (
    <section className="rounded-xl bg-brand-blue p-5 text-white shadow-md shadow-brand-blue/25 relative overflow-hidden">
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold opacity-80">Office timer</div>
            <div className="mt-0.5 text-sm font-medium opacity-90">
              Logged in at {formatTime(s.loginTs)}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="rounded-full bg-ink px-4 py-2 text-xs font-bold tap tap-press"
          >
            Log out
          </button>
        </div>
        <div className="mt-4 flex items-center justify-center">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-white/20" />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                strokeWidth={stroke}
                strokeLinecap="round"
                className="fill-none stroke-brand-lime transition-[stroke-dashoffset] duration-500 ease-out"
                strokeDasharray={c}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-extrabold tabular-nums">{formatHMS(elapsed)}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">of 6h goal</div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <Chip on={elapsed >= 4 * 3600 * 1000}>4h · half day</Chip>
          <Chip on={elapsed >= FULL_DAY_MS}>6h · full day</Chip>
        </div>
      </div>
    </section>
  );
}

function Chip({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-bold ${
        on ? "bg-brand-lime text-ink" : "bg-white/15 text-white/70"
      }`}
    >
      {children}
    </span>
  );
}

function TodayLoggedCard({ entry }: { entry: { type: "wfo" | "wfh"; hours?: number | null; loginTs?: number } }) {
  const isWFH = entry.type === "wfh";
  const label = isWFH
    ? "Work from home logged"
    : entry.hours == null || entry.hours >= FULL_DAY_HOURS
      ? "Full office day logged"
      : `Partial office day · ${formatHours(entry.hours)}`;
  return (
    <section
      className={`rounded-xl p-5 shadow-sm shadow-black/5 ${
        isWFH ? "bg-brand-lime text-ink" : "bg-brand-blue text-white"
      }`}
    >
      <div className="text-xs font-semibold opacity-80">Today is logged</div>
      <div className="mt-1 text-xl font-extrabold leading-tight">{label}</div>
      {entry.loginTs ? (
        <div className="mt-1 text-xs opacity-80">Logged in at {formatTime(entry.loginTs)}</div>
      ) : null}
      <div className="mt-3 text-[11px] opacity-70">
        Change it any time from the calendar.
      </div>
    </section>
  );
}

function HeroTile({
  left,
  allowance,
  used,
  onOpen,
}: {
  left: number;
  allowance: number;
  used: number;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="relative block w-full overflow-hidden rounded-xl bg-brand-blue p-5 text-left text-white shadow-md shadow-brand-blue/20 tap tap-press"
    >
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold opacity-90">WFH days left</span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-lime text-ink">
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
          </span>
        </div>
        <div className="mt-2 text-6xl font-extrabold tracking-tight tabular-nums leading-none">
          {left}
        </div>
        <div className="mt-2 text-xs font-medium opacity-90">
          of {allowance} allowed · {used} used
        </div>
      </div>
    </button>
  );
}

function StatChip({
  bg,
  badgeBg,
  icon,
  value,
  label,
  hint,
  progress,
}: {
  bg: string;
  badgeBg: string;
  icon: React.ReactNode;
  value: string;
  label: string;
  hint?: string;
  progress?: number;
}) {
  return (
    <div className={`rounded-2xl p-4 ${bg}`}>
      <div className="flex items-center justify-between">
        <span className={`grid h-7 w-7 place-items-center rounded-full ${badgeBg} text-ink`}>{icon}</span>
        <span className="text-[10px] font-semibold text-ink-muted">{hint}</span>
      </div>
      <div className="mt-3 text-2xl font-extrabold tabular-nums leading-none">{value}</div>
      <div className="text-xs font-medium text-ink-muted">{label}</div>
      {progress != null ? (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/70">
          <div className="h-full rounded-full bg-ink" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </div>
  );
}

function MiniStat({ value, label, tone }: { value: string; label: string; tone: "blue" | "lime" | "lavender" }) {
  const bg =
    tone === "blue" ? "bg-brand-blue text-white" : tone === "lime" ? "bg-brand-lime text-ink" : "bg-lavender text-ink";
  return (
    <div className={`rounded-2xl px-3 py-3 ${bg}`}>
      <div className="text-lg font-extrabold tabular-nums leading-none">{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</div>
    </div>
  );
}
