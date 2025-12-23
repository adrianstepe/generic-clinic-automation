import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../supabaseClient';
import { Loader2, ShieldX } from 'lucide-react';

interface SuperAdminRouteProps {
    children: React.ReactNode;
}

/**
 * Protected route for Super Admin access only.
 * Checks if the authenticated user's email is in the super_admin_whitelist table.
 */
const SuperAdminRoute: React.FC<SuperAdminRouteProps> = ({ children }) => {
    const { user, loading: authLoading } = useUser();
    const location = useLocation();
    const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkSuperAdminStatus = async () => {
            if (!user?.email) {
                setIsSuperAdmin(false);
                setChecking(false);
                return;
            }

            try {
                // Check if user email is in super admin whitelist
                const { data, error } = await supabase
                    .from('super_admin_whitelist')
                    .select('email, is_active')
                    .eq('email', user.email)
                    .eq('is_active', true)
                    .maybeSingle();

                if (error || !data) {
                    console.log('[SuperAdminRoute] User is not a super admin:', user.email);
                    setIsSuperAdmin(false);
                } else {
                    console.log('[SuperAdminRoute] Super admin verified:', user.email);
                    setIsSuperAdmin(true);
                }
            } catch (err) {
                console.error('[SuperAdminRoute] Error checking super admin status:', err);
                setIsSuperAdmin(false);
            } finally {
                setChecking(false);
            }
        };

        if (user) {
            checkSuperAdminStatus();
        } else if (!authLoading) {
            setChecking(false);
            setIsSuperAdmin(false);
        }
    }, [user, authLoading]);

    // Still loading auth or checking super admin status
    if (authLoading || checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">Verifying access...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Authenticated but not a super admin - show access denied
    if (!isSuperAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldX className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                        Access Denied
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        You don't have permission to access the Super Admin dashboard.
                        This area is restricted to platform administrators only.
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Go to Homepage
                    </a>
                </div>
            </div>
        );
    }

    // Super admin - render children
    return <>{children}</>;
};

export default SuperAdminRoute;
