import React from "react";
import {
  BrowserRouter as Router,
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
import Index from "./pages";
import EventsPage from "./pages/EventsPage";
import AddEventPage from "./pages/AddEventPage";
import EventDetailsPage from "./pages/EventDetailsPage";
import StaffPage from "./pages/StaffPage";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFoundPage";

import ConfirmAssignmentPage from "./pages/ConfirmAssignmentPage";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function MainLayout() {
  return (
    <div>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

import { Outlet } from "react-router-dom";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/confirm/:token" element={<ConfirmAssignmentPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Index />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="events/add" element={<AddEventPage />} />
              <Route path="events/:eventId" element={<EventDetailsPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="about" element={<AboutPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
