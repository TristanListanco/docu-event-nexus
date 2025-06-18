
import React from "react";
import {
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "./hooks/use-auth";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Index from "./pages/Index";
import EventsPage from "./pages/EventsPage";
import AddEventPage from "./pages/AddEventPage";
import EventDetailsPage from "./pages/EventDetailsPage";
import StaffPage from "./pages/StaffPage";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";
import ConfirmAssignmentPage from "./pages/ConfirmAssignmentPage";
import MainLayout from "./components/layout/main-layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes cache time
      retry: (failureCount, error) => {
        // Don't retry on auth errors or client errors (4xx)
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
          <p className="text-muted-foreground">Loading...</p>
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
            <Route index element={<Index />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/add" element={<AddEventPage />} />
            <Route path="events/new" element={<AddEventPage />} />
            <Route path="events/:eventId" element={<EventDetailsPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
