
import { Routes, Route } from 'react-router-dom';
import AuthLayout from './components/layout/auth-layout';
import MainLayout from './components/layout/main-layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Index from './pages/Index';
import AboutPage from './pages/AboutPage';
import StaffPage from './pages/StaffPage';
import EventsPage from './pages/EventsPage';
import AddEventPage from './pages/AddEventPage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/auth/protected-route';
import EventDetailsPage from './pages/EventDetailsPage';
import AddMultiDayEventPage from './pages/AddMultiDayEventPage';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Index />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/add" element={<AddEventPage />} />
          <Route path="/events/add-multi" element={<AddMultiDayEventPage />} />
          <Route path="/events/:eventId" element={<EventDetailsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
