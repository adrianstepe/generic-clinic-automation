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
import DoctorSchedulePage from './components/dashboard/pages/DoctorSchedulePage';

// Super Admin imports
import SuperAdminRoute from './components/auth/SuperAdminRoute';
import SuperAdminLayout from './components/super-admin/SuperAdminLayout';
import SuperAdminDashboard from './components/super-admin/SuperAdminDashboard';
import ClinicsPage from './components/super-admin/ClinicsPage';
import WorkingHoursPage from './components/super-admin/WorkingHoursPage';

// Helper to determine Clinic ID from environment or subdomain
const getClinicId = () => {
    // 1. Environment variable (Build time / Dev override)
    if (import.meta.env.VITE_CLINIC_ID) {
        return import.meta.env.VITE_CLINIC_ID;
    }

    // 2. Subdomain (Runtime SaaS)
    // e.g. nordic-smile.pages.dev -> nordic-smile
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // Ignore localhost and IP addresses
        if (!hostname.includes('localhost') && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
            const parts = hostname.split('.');
            if (parts.length > 2) {
                return parts[0];
            }
        }
    }

    // 3. Fallback default
    return 'sample';
};

const CLINIC_ID = getClinicId();
console.log('[App] Initialized with Clinic ID:', CLINIC_ID);

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
                            <Route path="schedule" element={<DoctorSchedulePage />} />
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
                            <Route path="working-hours" element={<WorkingHoursPage />} />
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
