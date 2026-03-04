
import React from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "./hooks/use-auth";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import TermDetailPage from "./pages/TermDetailPage";
import AddEventPage from "./pages/AddEventPage";
import EventDetailsPage from "./pages/EventDetailsPage";
import ArchivePage from "./pages/ArchivePage";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";
import ConfirmAssignmentPage from "./pages/ConfirmAssignmentPage";
import MainLayout from "./components/layout/main-layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: 'always',
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background animate-fade-in">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Initializing application...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/confirm-assignment" element={<ConfirmAssignmentPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="terms/:termId" element={<TermDetailPage />} />
            <Route path="terms/:termId/events/add" element={<AddEventPage />} />
            <Route path="terms/:termId/events/:eventId" element={<EventDetailsPage />} />
            <Route path="archive" element={<ArchivePage />} />
            <Route path="archive/:termId" element={<TermDetailPage />} />
            <Route path="archive/:termId/events/:eventId" element={<EventDetailsPage />} />
            <Route path="about" element={<AboutPage />} />
            {/* Legacy routes redirect */}
            <Route path="events" element={<Navigate to="/" replace />} />
            <Route path="staff" element={<Navigate to="/" replace />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
