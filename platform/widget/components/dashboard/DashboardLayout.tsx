import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useUser } from '../../contexts/UserContext';
import { useConfig } from '../../hooks/useConfig';

const DashboardLayout: React.FC = () => {
    const { profile, loading: userLoading } = useUser();
    const { clinicId } = useConfig();
    const navigate = useNavigate();
    const location = useLocation();

    // Sync Clinic ID from User Profile if mismatch
    React.useEffect(() => {
        if (!userLoading && profile?.clinic_id) {
            // Check if current clinicId matches user's clinic_id
            // Ignore if we are already on the correct "view"
            if (profile.clinic_id !== clinicId) {
                console.log(`[DashboardLayout] Clinic ID mismatch. Context: ${clinicId}, User: ${profile.clinic_id}. Redirecting...`);

                // Construct new URL with correct clinicId param
                const searchParams = new URLSearchParams(location.search);
                searchParams.set('clinicId', profile.clinic_id);

                // Replace current history entry to avoid back-button loops
                navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });

                // Force a reload to ensure ConfigProvider picks up the new URL param immediately
                // This is a bit brute-force but ensures clean state for the "App" initialization
                window.location.search = searchParams.toString();
            }
        }
    }, [profile, clinicId, userLoading, navigate, location.pathname, location.search]);

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-slate-900">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
