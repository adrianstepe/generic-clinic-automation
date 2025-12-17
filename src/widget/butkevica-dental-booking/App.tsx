import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { ConfigProvider } from './hooks/useConfig';
import BookingWidget from './BookingWidget';
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardHome from './components/dashboard/DashboardHome';
import CalendarPage from './components/dashboard/pages/CalendarPage';
import ServicesPage from './components/dashboard/pages/ServicesPage';
import SpecialistsPage from './components/dashboard/pages/SpecialistsPage';

function App() {
  return (
    <ConfigProvider clinicId="butkevica">
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<BookingWidget />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardHome />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="specialists" element={<SpecialistsPage />} />
            </Route>
            {/* Redirect legacy admin param or unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </UserProvider>
    </ConfigProvider>
  );
}

export default App;