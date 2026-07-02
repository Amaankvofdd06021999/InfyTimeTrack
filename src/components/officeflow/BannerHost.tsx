import { useStore } from "@/lib/officeflow/store";

export function BannerHost() {
  const { banners, dismissBanner } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-3">
      {banners.map((b) => (
        <button
          key={b.id}
          onClick={() => dismissBanner(b.id)}
          className="pointer-events-auto w-full max-w-[380px] rounded-full bg-ink px-5 py-3 text-left text-primary-foreground shadow-lg shadow-black/20 tap tap-press"
        >
          <div className="flex items-center gap-3">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  b.tone === "success" ? "var(--brand-lime)" : b.tone === "warning" ? "#fbbf24" : "var(--brand-blue)",
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{b.title}</div>
              {b.body ? <div className="truncate text-xs opacity-80">{b.body}</div> : null}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
