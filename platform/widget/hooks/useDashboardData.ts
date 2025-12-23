import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { startOfDay, endOfDay, isSameDay, parseISO } from 'date-fns';

export interface DashboardBooking {
    id: string;
    created_at: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    start_time: string;
    end_time?: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    doctor_id?: string;
    service_id?: string;
    doctor_name?: string;
    service_name?: string;
    notes?: string;
    doctor?: {
        full_name: string;
    };
    services?: {
        name: any; // JSONB
        price_cents: number;
        duration_minutes?: number;
    };
    // Keep these for backward compatibility if needed, or map them from 'services'
    service?: {
        name: any;
        price: number;
        durationMinutes?: number;
    };
}

export interface DashboardStats {
    appointmentsToday: number;
    patientsWaiting: number;
    pendingRequests: number;
    revenue: number;
}

interface UseDashboardDataProps {
    dateRange?: { start: Date; end: Date };
    doctorId?: string | 'all';
}

export const useDashboardData = ({ dateRange, doctorId }: UseDashboardDataProps) => {
    const [bookings, setBookings] = useState<DashboardBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            console.log('[Dashboard] Fetching bookings...');
            console.log('[Dashboard] Current User:', user?.id, user?.email);

            if (!user) {
                console.log('[Dashboard] No authenticated user found');
                setError('Please log in to view bookings');
                setLoading(false);
                return;
            }

            // Check user's role and specialist_id
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, full_name, clinic_id, specialist_id')
                .eq('id', user.id)
                .maybeSingle();

            console.log('[Dashboard] User Profile:', profile, 'Profile Error:', profileError);

            let query = supabase
                .from('bookings')
                .select(`
                    *,
                    services:service_id (
                        name,
                        price_cents,
                        duration_minutes
                    ),
                    specialist:specialist_id (
                        name,
                        role
                    )
                `)
                .order('start_time', { ascending: true });

            // SaaS: Filter by VITE_CLINIC_ID (from environment variable)
            // This ensures each deployment shows only its own clinic's data
            const clinicId = import.meta.env.VITE_CLINIC_ID;
            if (clinicId) {
                query = query.eq('clinic_id', clinicId);
                console.log('[Dashboard] Filtering by VITE_CLINIC_ID:', clinicId);
            } else {
                console.warn('[Dashboard] No VITE_CLINIC_ID set, showing all bookings');
            }

            // ROLE-BASED FILTERING: Doctors see only their appointments
            if (profile?.role === 'doctor' && profile?.specialist_id) {
                query = query.eq('specialist_id', profile.specialist_id);
                console.log('[Dashboard] Filtering by doctor specialist_id:', profile.specialist_id);
            }

            // Filter by the selected doctor if specified (for admin dropdown filter)
            if (doctorId && doctorId !== 'all' && profile?.role !== 'doctor') {
                query = query.eq('specialist_id', doctorId);
            }

            if (dateRange) {
                query = query.gte('start_time', dateRange.start.toISOString())
                    .lte('start_time', dateRange.end.toISOString());
            }

            const { data, error } = await query;

            console.log('[Dashboard] Query Result - Data count:', data?.length || 0);
            console.log('[Dashboard] Query Result - Error:', error);
            console.log('[Dashboard] Raw Data:', JSON.stringify(data, null, 2));

            if (error) {
                console.error('[Dashboard] Query Error:', error.message, error.hint, error.details);
                throw error;
            }

            if (!data || data.length === 0) {
                console.log('[Dashboard] No bookings found in database');
                setBookings([]);
                setLoading(false);
                return;
            }

            // Helper to parse localized names
            const getLocalizedName = (nameData: any, lang: string = 'EN'): string => {
                if (!nameData) return 'Unknown Service';

                try {
                    // If it's already a string
                    if (typeof nameData === 'string') {
                        // Check if it looks like a JSON string
                        if (nameData.trim().startsWith('{')) {
                            const parsed = JSON.parse(nameData);
                            return parsed[lang] || parsed['EN'] || Object.values(parsed)[0] as string || nameData;
                        }
                        return nameData;
                    }

                    // If it's an object
                    if (typeof nameData === 'object') {
                        return nameData[lang] || nameData['EN'] || Object.values(nameData)[0] as string || 'Unknown Service';
                    }
                } catch (e) {
                    console.warn('Failed to parse service name:', nameData);
                    return String(nameData);
                }

                return 'Unknown Service';
            };

            // Map data to match the interface expected by components
            // REMOVED: Aggressive test data filtering - show ALL bookings
            const mappedData = (data as any[]).map(b => {
                // Handle the joined 'services' object
                const serviceData = Array.isArray(b.services) ? b.services[0] : b.services;
                // Handle the joined 'specialist' object (from specialists table)
                const specialistData = Array.isArray(b.specialist) ? b.specialist[0] : b.specialist;

                const serviceName = b.service_name || getLocalizedName(serviceData?.name);
                const doctorName = specialistData?.name || b.doctor_name || 'Nav norādīts';

                return {
                    ...b,
                    service_name: serviceName,
                    doctor_name: doctorName,
                    service: serviceData ? {
                        name: serviceName,
                        price: serviceData.price_cents ? serviceData.price_cents / 100 : 0,
                        durationMinutes: serviceData.duration_minutes || 30
                    } : undefined,
                    doctor: specialistData ? {
                        full_name: specialistData.name
                    } : undefined
                };
            });

            console.log('[Dashboard] Mapped Bookings:', mappedData.length, 'bookings');
            setBookings(mappedData as DashboardBooking[]);
        } catch (err: any) {
            console.error('[Dashboard] Error fetching dashboard data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();

        // Real-time subscription
        const channel = supabase
            .channel('public:bookings')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'bookings' },
                (payload) => {
                    console.log('Real-time update:', payload);
                    fetchBookings();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [doctorId, dateRange?.start?.toISOString(), dateRange?.end?.toISOString()]);

    const stats = useMemo(() => {
        const today = new Date();
        const todayBookings = bookings.filter(b => isSameDay(parseISO(b.start_time), today));

        const appointmentsToday = todayBookings.filter(b => b.status !== 'cancelled').length;

        const patientsWaiting = todayBookings.filter(b =>
            b.status === 'confirmed' && new Date(b.start_time) > new Date()
        ).length;

        const pendingRequests = bookings.filter(b => b.status === 'pending').length;

        const revenue = bookings
            .filter(b => b.status === 'completed' || b.status === 'confirmed')
            .reduce((acc, curr) => acc + (curr.service?.price || 0), 0);

        return {
            appointmentsToday,
            patientsWaiting,
            pendingRequests,
            revenue
        };
    }, [bookings]);

    return { bookings, loading, error, stats, refresh: fetchBookings };
};
