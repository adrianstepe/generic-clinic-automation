import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import KPICards from './KPICards';
import AppointmentList from './AppointmentList';
import CalendarView from './CalendarView';
import EditBookingModal, { BookingUpdates } from './modals/EditBookingModal';
import { Bell, ChevronDown, Check, Sun, Moon, LogOut } from 'lucide-react';
import { useDashboardData, DashboardBooking } from '../../hooks/useDashboardData';
import { useUser } from '../../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

const DashboardHome: React.FC = () => {
    // Fetch data using our new hook
    // Default to 'all' or handle user context internally in the hook if needed
    const { bookings, loading, error, stats, refresh } = useDashboardData({
        doctorId: 'all'
    });

    // State for edit modal
    const [editingBooking, setEditingBooking] = useState<DashboardBooking | null>(null);

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            alert('Failed to update');
        } else {
            refresh();
        }
    };

    const updateBooking = async (id: string, updates: BookingUpdates) => {
        const { error } = await supabase
            .from('bookings')
            .update({
                start_time: updates.start_time,
                end_time: updates.end_time,
                service_id: updates.service_id,
                service_name: updates.service_name,
                customer_phone: updates.customer_phone,
                notes: updates.notes
            })
            .eq('id', id);

        if (error) {
            console.error('Error updating booking:', error);
            throw error;
        }
        refresh();
    };

    const handleEditBooking = (booking: DashboardBooking) => {
        setEditingBooking(booking);
    };

    // Transform bookings for child components if necessary
    const mappedBookings = bookings.map(b => ({
        id: b.id,
        created_at: b.created_at,
        customer_name: b.customer_name,
        customer_email: b.customer_email,
        customer_phone: b.customer_phone,
        service_name: b.service_name,
        service_id: b.service_id,
        start_time: b.start_time,
        end_time: b.end_time,
        status: b.status,
        doctor_id: b.doctor_id,
        doctor_name: b.doctor?.full_name || 'Nav norādīts',
        duration: b.service?.durationMinutes,
        notes: b.notes
    }));

    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Ensure theme is applied on mount and updates correctly
    React.useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const { signOut } = useUser();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="flex-1 bg-gray-50 dark:bg-slate-900 min-h-screen w-full transition-colors flex flex-col">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-8 py-4 flex justify-between items-center sticky top-0 z-20 transition-colors">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Panelis</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Ārsta režīms</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>

                    <button
                        onClick={handleSignOut}
                        className="p-2 text-red-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Sign Out"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="p-8">
                <KPICards stats={stats} />

                <div className="grid grid-cols-12 gap-6 h-[600px]">
                    <div className="col-span-12 lg:col-span-7 h-full">
                        <AppointmentList
                            bookings={mappedBookings}
                            loading={loading}
                            error={error}
                            onUpdateStatus={updateStatus}
                            onEditBooking={handleEditBooking}
                        />
                    </div>
                    <div className="col-span-12 lg:col-span-5 h-full">
                        <CalendarView bookings={mappedBookings} />
                    </div>
                </div>
            </main>

            {/* Edit Booking Modal */}
            {editingBooking && (
                <EditBookingModal
                    booking={editingBooking}
                    onClose={() => setEditingBooking(null)}
                    onSave={updateBooking}
                />
            )}
        </div>
    );
};

export default DashboardHome;

