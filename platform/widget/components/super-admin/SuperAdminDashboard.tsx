import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Building2, CalendarCheck, DollarSign, TrendingUp, Users, Loader2, RefreshCw } from 'lucide-react';
import { startOfMonth, format } from 'date-fns';

interface PlatformStats {
    totalClinics: number;
    activeClinics: number;
    totalBookings: number;
    monthlyBookings: number;
    monthlyRevenue: number;
    totalPatients: number;
}

interface RecentClinic {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
    bookingsCount?: number;
}

const SuperAdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [recentClinics, setRecentClinics] = useState<RecentClinic[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            // Fetch clinics count
            const { data: clinicsData, error: clinicsError } = await supabase
                .from('clinics')
                .select('id, is_active');

            if (clinicsError) throw clinicsError;

            const totalClinics = clinicsData?.length || 0;
            const activeClinics = clinicsData?.filter(c => c.is_active !== false).length || 0;

            // Fetch all bookings
            const { data: bookingsData, error: bookingsError } = await supabase
                .from('bookings')
                .select('id, amount_paid, status, created_at, customer_email');

            if (bookingsError) throw bookingsError;

            const totalBookings = bookingsData?.length || 0;

            // This month's stats
            const monthStart = startOfMonth(new Date()).toISOString();
            const monthlyBookings = bookingsData?.filter(b => b.created_at >= monthStart).length || 0;
            const monthlyRevenue = bookingsData
                ?.filter(b => b.created_at >= monthStart && (b.status === 'confirmed' || b.status === 'completed'))
                .reduce((sum, b) => sum + (b.amount_paid || 0), 0) || 0;

            // Unique patients (by email)
            const uniqueEmails = new Set(bookingsData?.map(b => b.customer_email).filter(Boolean));
            const totalPatients = uniqueEmails.size;

            setStats({
                totalClinics,
                activeClinics,
                totalBookings,
                monthlyBookings,
                monthlyRevenue,
                totalPatients
            });

            // Fetch recent clinics with booking counts
            const { data: clinicsList } = await supabase
                .from('clinics')
                .select('id, name, is_active, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            if (clinicsList) {
                // Get booking counts per clinic
                const clinicsWithCounts = await Promise.all(
                    clinicsList.map(async (clinic) => {
                        const { count } = await supabase
                            .from('bookings')
                            .select('*', { count: 'exact', head: true })
                            .eq('clinic_id', clinic.id);

                        return { ...clinic, bookingsCount: count || 0 };
                    })
                );
                setRecentClinics(clinicsWithCounts);
            }

        } catch (error) {
            console.error('[SuperAdminDashboard] Error fetching stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const StatCard: React.FC<{
        icon: React.ElementType;
        label: string;
        value: string | number;
        subtext?: string;
        color: string;
    }> = ({ icon: Icon, label, value, subtext, color }) => (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-400 text-sm">{label}</p>
                    <p className="text-3xl font-bold text-white mt-2">{value}</p>
                    {subtext && <p className="text-slate-500 text-xs mt-1">{subtext}</p>}
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Platform Overview</h1>
                    <p className="text-slate-400 mt-1">
                        Multi-tenant clinic management • {format(new Date(), 'MMMM yyyy')}
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                    icon={Building2}
                    label="Total Clinics"
                    value={stats?.totalClinics || 0}
                    subtext={`${stats?.activeClinics || 0} active`}
                    color="bg-purple-600"
                />
                <StatCard
                    icon={CalendarCheck}
                    label="Total Bookings"
                    value={stats?.totalBookings || 0}
                    subtext={`${stats?.monthlyBookings || 0} this month`}
                    color="bg-blue-600"
                />
                <StatCard
                    icon={DollarSign}
                    label="Monthly Revenue"
                    value={`€${(stats?.monthlyRevenue || 0).toFixed(2)}`}
                    subtext={format(new Date(), 'MMMM yyyy')}
                    color="bg-green-600"
                />
                <StatCard
                    icon={Users}
                    label="Unique Patients"
                    value={stats?.totalPatients || 0}
                    subtext="Across all clinics"
                    color="bg-amber-600"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Avg. Bookings/Clinic"
                    value={stats?.totalClinics ? Math.round(stats.totalBookings / stats.totalClinics) : 0}
                    subtext="All time average"
                    color="bg-pink-600"
                />
            </div>

            {/* Recent Clinics */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">Recent Clinics</h2>
                    <a
                        href="/super-admin/clinics"
                        className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                        View all →
                    </a>
                </div>
                <div className="divide-y divide-slate-700">
                    {recentClinics.length === 0 ? (
                        <div className="px-6 py-8 text-center text-slate-500">
                            No clinics found. Create your first clinic to get started.
                        </div>
                    ) : (
                        recentClinics.map((clinic) => (
                            <div key={clinic.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{clinic.name}</p>
                                        <p className="text-slate-500 text-sm">ID: {clinic.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-white">{clinic.bookingsCount} bookings</p>
                                        <p className="text-slate-500 text-xs">
                                            {format(new Date(clinic.created_at), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${clinic.is_active !== false
                                            ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                                            : 'bg-red-900/30 text-red-400 border border-red-500/30'
                                        }`}>
                                        {clinic.is_active !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
