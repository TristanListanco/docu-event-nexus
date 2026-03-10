
import React from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  console.log('App ProtectedRoute: user:', user?.email, 'loading:', loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100vh] min-h-[100dvh] bg-background animate-fade-in">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Initializing application...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('App ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  console.log('App: Rendering');
  
  return (
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
  );
}

export default App;
