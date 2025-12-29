import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import Index from "./pages/Index";
import Photos from "./pages/Photos";
import VoiceNotes from "./pages/VoiceNotes";
import Places from "./pages/Places";
import Bookmarks from "./pages/Bookmarks";
import Settings from "./pages/Settings";
import Statistics from "./pages/Statistics";
import Habits from "./pages/Habits";
import Tags from "./pages/Tags";
import NotFound from "./pages/NotFound";
import LockScreen from "./components/LockScreen";
import { useAppLock } from "./hooks/useAppLock";

const queryClient = new QueryClient();

// Hook to handle Android back button
const useAndroidBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backHandler = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      // If on home page, exit app
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
        <Route path="/photos" element={<Photos />} />
        <Route path="/voice-notes" element={<VoiceNotes />} />
        <Route path="/places" element={<Places />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/tags" element={<Tags />} />
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
