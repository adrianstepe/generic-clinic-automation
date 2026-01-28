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
import BookingsPage from './components/super-admin/BookingsPage';
import DoctorSchedulesPage from './components/super-admin/DoctorSchedulesPage';

import { getClinicId } from './utils/clinicUtils';

const CLINIC_ID = getClinicId();
console.log('[App] Initialized with Clinic ID:', CLINIC_ID);

/**
 * Detect widget display mode from multiple sources:
 * 1. URL parameter: ?mode=inline
 * 2. DOM attribute on root: <div id="root" data-mode="inline">
 * 3. Global window property: window.embeddedMode
 */
function detectDisplayMode(): 'popup' | 'inline' {
    if (typeof window === 'undefined') return 'popup';

    // Check URL parameter first (highest priority)
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'inline') return 'inline';

    // Check DOM attribute on root element
    const rootElement = document.getElementById('root');
    if (rootElement?.getAttribute('data-mode') === 'inline') return 'inline';

    // Check global window property (for programmatic embedding)
    if ((window as any).embeddedMode === 'inline') return 'inline';

    return 'popup';
}

function App() {
    const displayMode = detectDisplayMode();

    return (
        <ConfigProvider clinicId={CLINIC_ID}>
            <UserProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<BookingWidget mode={displayMode} />} />
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
                            <Route path="doctor-schedules" element={<DoctorSchedulesPage />} />
                            <Route path="bookings" element={<BookingsPage />} />
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
