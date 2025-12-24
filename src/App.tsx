import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Photos from "./pages/Photos";
import Bookmarks from "./pages/Bookmarks";
import Settings from "./pages/Settings";
import Statistics from "./pages/Statistics";
import Habits from "./pages/Habits";
import Tags from "./pages/Tags";
import NotFound from "./pages/NotFound";
import LockScreen from "./components/LockScreen";
import { useAppLock } from "./hooks/useAppLock";

const queryClient = new QueryClient();

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
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/photos" element={<Photos />} />
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
