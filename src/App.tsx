
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import ProtectedRoute from "@/components/auth/protected-route";
import MainLayout from "@/components/layout/main-layout";
import AuthLayout from "@/components/layout/auth-layout";

const queryClient = new QueryClient();

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const StaffPage = lazy(() => import("./pages/StaffPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const AddEventPage = lazy(() => import("./pages/AddEventPage"));
const EventDetailsPage = lazy(() => import("./pages/EventDetailsPage"));
const ConfirmAssignmentPage = lazy(() => import("./pages/ConfirmAssignmentPage"));
const BorrowingLogPage = lazy(() => import("./pages/BorrowingLogPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              {/* Auth routes */}
              <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
              <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />
              <Route path="/confirm-assignment" element={<ConfirmAssignmentPage />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route path="/" element={<Index />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/add" element={<AddEventPage />} />
                <Route path="/events/:id" element={<EventDetailsPage />} />
                <Route path="/staff" element={<StaffPage />} />
                <Route path="/borrowing" element={<BorrowingLogPage />} />
                <Route path="/about" element={<AboutPage />} />
              </Route>
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
