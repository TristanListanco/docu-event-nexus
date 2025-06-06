
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import MainLayout from "@/components/layout/main-layout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import EventsPage from "@/pages/EventsPage";
import EventDetailsPage from "@/pages/EventDetailsPage";
import AddEventPage from "@/pages/AddEventPage";
import StaffPage from "@/pages/StaffPage";
import AboutPage from "@/pages/AboutPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "@/components/auth/protected-route";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/new" element={<AddEventPage />} />
              <Route path="/events/:eventId" element={<EventDetailsPage />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Route>
          </Route>
          
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
