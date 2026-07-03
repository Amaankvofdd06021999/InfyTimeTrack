import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StoreProvider, useStore } from "@/lib/officeflow/store";
import { BannerHost } from "@/components/officeflow/BannerHost";
import { BottomNav } from "@/components/officeflow/BottomNav";
import { Dashboard } from "@/components/officeflow/Dashboard";
import { CalendarView } from "@/components/officeflow/CalendarView";
import { LogView } from "@/components/officeflow/LogView";
import { SettingsView } from "@/components/officeflow/SettingsView";
import { Onboarding } from "@/components/officeflow/Onboarding";
import { TransportReminder } from "@/components/officeflow/TransportReminder";
import type { View } from "@/components/officeflow/types";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

function Shell() {
  const { state } = useStore();
  const [view, setView] = useState<View>("dashboard");

  // Show onboarding if user hasn't completed it
  if (!state.isOnboarded) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-canvas">
      <TransportReminder />
      <BannerHost />
      <main className="mx-auto w-full max-w-[420px] px-5">
        {view === "dashboard" && <Dashboard onNavigate={setView} />}
        {view === "calendar" && <CalendarView />}
        {view === "log" && <LogView />}
        {view === "settings" && <SettingsView />}
      </main>
      <BottomNav view={view} onChange={setView} />
    </div>
  );
}
