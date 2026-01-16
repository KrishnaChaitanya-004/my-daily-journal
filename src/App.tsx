import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import Index from "./pages/Index";
import Editor from "./pages/Editor";
import Photos from "./pages/Photos";
import VoiceNotes from "./pages/VoiceNotes";
import Places from "./pages/Places";
import Bookmarks from "./pages/Bookmarks";
import Settings from "./pages/Settings";
import Statistics from "./pages/Statistics";
import Habits from "./pages/Habits";
import Tags from "./pages/Tags";
import Achievements from "./pages/Achievements";
import NotFound from "./pages/NotFound";
import LockScreen from "./components/LockScreen";
import { useAppLock } from "./hooks/useAppLock";
import { getMenuState, closeGlobalMenu } from "./hooks/useMenuState";
import { widgetsBridge } from "@/lib/widgetsBridge";

const queryClient = new QueryClient();

// Hook to handle Android back button
const useAndroidBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backHandler = CapacitorApp.addListener('backButton', () => {
      // First check if menu is open - close it instead of navigating/exiting
      if (getMenuState()) {
        closeGlobalMenu();
        return;
      }

      // If on home page and menu is closed, exit app
      if (location.pathname === '/') {
        CapacitorApp.exitApp();
      } else {
        // Navigate to home
        navigate('/');
      }
    });

    return () => {
      backHandler.then(h => h.remove());
    };
  }, [navigate, location.pathname]);
};

// Component wrapper to use the hook
const BackButtonHandler = () => {
  useAndroidBackButton();
  return null;
};

const AppContent = () => {
  const { isLocked, lockSettings, biometricAvailable, unlock, unlockWithBiometric } = useAppLock();

  // Keep the Habits Progress widget in sync even when the user isn't on /habits
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const HABITS_KEY = 'diary-habits-list';
    const STORAGE_KEY = 'diary-app-data';

    const syncHabitsProgress = async () => {
      try {
        const habitsRaw = localStorage.getItem(HABITS_KEY);
        const habits = habitsRaw ? (JSON.parse(habitsRaw) as Array<{ id: string }>) : [];

        const today = new Date().toISOString().split('T')[0];
        const dataRaw = localStorage.getItem(STORAGE_KEY);
        const data = dataRaw ? (JSON.parse(dataRaw) as Record<string, any>) : {};
        const todayHabits = data?.[today]?.habits ?? {};

        const completed = habits.filter((h) => !!todayHabits?.[h.id]).length;
        await widgetsBridge.setHabitsProgress(completed, habits.length);
      } catch {
        // ignore
      }
    };

    // Initial sync on launch
    void syncHabitsProgress();

    // Sync when the app comes back to foreground
    const sub = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void syncHabitsProgress();
    });

    // Sync when habits change anywhere in the UI
    const onHabitsChanged = () => void syncHabitsProgress();
    window.addEventListener('habits-changed', onHabitsChanged);

    return () => {
      window.removeEventListener('habits-changed', onHabitsChanged);
      sub.then((h) => h.remove());
    };
  }, []);

  if (isLocked) {
    return (
      <LockScreen
        onUnlock={unlock}
        onBiometricUnlock={unlockWithBiometric}
        biometricEnabled={lockSettings.useBiometric}
        biometricAvailable={biometricAvailable}
      />
    );
  }

  return (
    <BrowserRouter>
      <BackButtonHandler />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/photos" element={<Photos />} />
        <Route path="/voice-notes" element={<VoiceNotes />} />
        <Route path="/places" element={<Places />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/tags" element={<Tags />} />
        <Route path="/achievements" element={<Achievements />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
