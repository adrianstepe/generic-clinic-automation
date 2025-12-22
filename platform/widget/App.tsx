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

// Super Admin imports
import SuperAdminRoute from './components/auth/SuperAdminRoute';
import SuperAdminLayout from './components/super-admin/SuperAdminLayout';
import SuperAdminDashboard from './components/super-admin/SuperAdminDashboard';
import ClinicsPage from './components/super-admin/ClinicsPage';

// Clinic ID is set via environment variable (VITE_CLINIC_ID) or defaults to 'sample'
const CLINIC_ID = import.meta.env.VITE_CLINIC_ID || 'sample';

function App() {
    return (
        <ConfigProvider clinicId={CLINIC_ID}>
            <UserProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<BookingWidget />} />
                        <Route path="/login" element={<LoginPage />} />

                        {/* Clinic Staff Dashboard */}
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

                        {/* Super Admin Dashboard (Platform Management) */}
                        <Route path="/super-admin" element={
                            <SuperAdminRoute>
                                <SuperAdminLayout />
                            </SuperAdminRoute>
                        }>
                            <Route index element={<SuperAdminDashboard />} />
                            <Route path="clinics" element={<ClinicsPage />} />
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
