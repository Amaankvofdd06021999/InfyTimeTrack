import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { StoreProvider } from './lib/officeflow/store';
import { Onboarding } from './components/officeflow/Onboarding';
import { Dashboard } from './components/officeflow/Dashboard';
import { CalendarView } from './components/officeflow/CalendarView';
import { LogView } from './components/officeflow/LogView';
import { SettingsView } from './components/officeflow/SettingsView';
import { BottomNav } from './components/officeflow/BottomNav';
import { BannerHost } from './components/officeflow/BannerHost';
import { useStore } from './lib/officeflow/store';

type View = 'dashboard' | 'calendar' | 'logs' | 'settings';

function Shell() {
  const { state } = useStore();
  const [view, setView] = React.useState<View>('dashboard');

  if (!state.isOnboarded) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-canvas">
      <BannerHost />
      <main className="px-5 pb-24">
        <div className="mx-auto max-w-md">
          {view === 'dashboard' && <Dashboard />}
          {view === 'calendar' && <CalendarView />}
          {view === 'logs' && <LogView />}
          {view === 'settings' && <SettingsView />}
        </div>
      </main>
      <BottomNav view={view} setView={setView} />
    </div>
  );
}

function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

// Initialize the app
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);