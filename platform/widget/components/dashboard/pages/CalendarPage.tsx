import React, { useState } from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, getHours, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Clock } from 'lucide-react';
import { useUser } from '../../../contexts/UserContext';
import { useEffect } from 'react';
import { useDashboardData, DashboardBooking } from '../../../hooks/useDashboardData';
import AppointmentDetailsModal from '../modals/AppointmentDetailsModal';
import { supabase } from '../../../supabaseClient';

const CalendarPage: React.FC = () => {
    const { profile } = useUser();
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedBooking, setSelectedBooking] = useState<DashboardBooking | null>(null);
    const [doctorId, setDoctorId] = useState<string>('all');

    useEffect(() => {
        if (profile?.role === 'doctor') {
            setDoctorId(profile.id);
        }
    }, [profile]);

    // Fetch data for the current view range
    // For simplicity, we'll fetch a broad range (e.g., current month +/- 1) or rely on the hook's default
    // Ideally, we'd pass the start/end dates of the current view to the hook
    const { bookings, loading, refresh } = useDashboardData({
        doctorId: doctorId
    });

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            refresh();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const navigate = (direction: 'prev' | 'next') => {
        if (view === 'month') {
            setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
        } else if (view === 'week') {
            setCurrentDate(direction === 'prev' ? addDays(currentDate, -7) : addDays(currentDate, 7));
        } else {
            setCurrentDate(direction === 'prev' ? addDays(currentDate, -1) : addDays(currentDate, 1));
        }
    };

    const renderHeader = () => (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Calendar</h1>
                <p className="text-slate-500">Manage your schedule and appointments</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                    <button
                        onClick={() => setView('month')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'month' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-gray-50'}`}
                    >
                        Month
                    </button>
                    <button
                        onClick={() => setView('week')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'week' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-gray-50'}`}
                    >
                        Week
                    </button>
                    <button
                        onClick={() => setView('day')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'day' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-gray-50'}`}
                    >
                        Day
                    </button>
                </div>

                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm">
                    <button onClick={() => navigate('prev')} className="p-1 hover:bg-gray-100 rounded-full text-slate-500">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-bold text-slate-700 min-w-[100px] text-center">
                        {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
                    </span>
                    <button onClick={() => navigate('next')} className="p-1 hover:bg-gray-100 rounded-full text-slate-500">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-2 bg-white border border-gray-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"
                >
                    Today
                </button>
            </div>
        </div>
    );

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = addDays(startOfWeek(monthEnd, { weekStartsOn: 1 }), 6);

        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                    {weekDays.map(day => (
                        <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 auto-rows-[minmax(120px,1fr)]">
                    {days.map(day => {
                        const dayBookings = bookings.filter(b => isSameDay(parseISO(b.start_time), day));
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isTodayDate = isToday(day);

                        return (
                            <div
                                key={day.toString()}
                                className={`border-b border-r border-gray-100 p-2 transition-colors hover:bg-gray-50 ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'bg-white'}`}
                                onClick={() => { setCurrentDate(day); setView('day'); }}
                            >
                                <div className={`text-sm font-medium mb-2 ${isTodayDate ? 'bg-teal-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : ''}`}>
                                    {format(day, 'd')}
                                </div>
                                <div className="space-y-1">
                                    {dayBookings.slice(0, 3).map(booking => (
                                        <div
                                            key={booking.id}
                                            onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); }}
                                            className={`text-[10px] px-1.5 py-1 rounded border truncate cursor-pointer
                                                ${booking.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    booking.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                                                        'bg-blue-50 text-blue-700 border-blue-100'}`}
                                        >
                                            {format(parseISO(booking.start_time), 'HH:mm')} {booking.customer_name}
                                        </div>
                                    ))}
                                    {dayBookings.length > 3 && (
                                        <div className="text-[10px] text-slate-400 pl-1">
                                            + {dayBookings.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderWeekView = () => {
        const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
        const hours = Array.from({ length: 13 }).map((_, i) => i + 8); // 8 AM to 8 PM

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 flex-none">
                    <div className="p-3 border-r border-gray-200"></div>
                    {weekDays.map(day => (
                        <div key={day.toString()} className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${isToday(day) ? 'bg-teal-50' : ''}`}>
                            <div className={`text-xs font-bold uppercase ${isToday(day) ? 'text-teal-700' : 'text-slate-500'}`}>{format(day, 'EEE')}</div>
                            <div className={`text-sm font-bold ${isToday(day) ? 'text-teal-700' : 'text-slate-700'}`}>{format(day, 'd')}</div>
                        </div>
                    ))}
                </div>
                <div className="overflow-y-auto flex-1">
                    <div className="grid grid-cols-8">
                        <div className="border-r border-gray-200 bg-gray-50/50">
                            {hours.map(hour => (
                                <div key={hour} className="h-20 border-b border-gray-100 text-xs text-slate-400 font-medium flex items-start justify-center pt-2">
                                    {hour}:00
                                </div>
                            ))}
                        </div>
                        {weekDays.map(day => (
                            <div key={day.toString()} className="border-r border-gray-200 last:border-r-0 relative">
                                {hours.map(hour => (
                                    <div key={hour} className="h-20 border-b border-gray-100"></div>
                                ))}
                                {/* Render Events */}
                                {bookings
                                    .filter(b => isSameDay(parseISO(b.start_time), day))
                                    .map(booking => {
                                        const start = parseISO(booking.start_time);
                                        const startHour = getHours(start);
                                        const duration = booking.service?.durationMinutes || 60;
                                        const top = (startHour - 8) * 80 + (start.getMinutes() / 60) * 80;
                                        const height = (duration / 60) * 80;

                                        if (startHour < 8 || startHour > 20) return null;

                                        return (
                                            <div
                                                key={booking.id}
                                                onClick={() => setSelectedBooking(booking)}
                                                className={`absolute inset-x-1 rounded-md p-2 text-xs border overflow-hidden cursor-pointer hover:shadow-md hover:z-10 transition-all
                                                    ${booking.status === 'confirmed' ? 'bg-green-100 border-green-200 text-green-800' :
                                                        booking.status === 'cancelled' ? 'bg-red-100 border-red-200 text-red-800' :
                                                            'bg-teal-100 border-teal-200 text-teal-800'}`}
                                                style={{ top: `${top}px`, height: `${height}px` }}
                                            >
                                                <div className="font-bold truncate">{booking.customer_name}</div>
                                                <div className="truncate opacity-80">{booking.service_name}</div>
                                            </div>
                                        );
                                    })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto h-full flex flex-col">
            {renderHeader()}

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                </div>
            ) : (
                <div className="flex-1">
                    {view === 'month' && renderMonthView()}
                    {view === 'week' && renderWeekView()}
                    {view === 'day' && renderWeekView()} {/* Reuse week view logic but just show one day ideally, or just keep week view for now as it's more useful */}
                </div>
            )}

            <AppointmentDetailsModal
                booking={selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onUpdateStatus={handleUpdateStatus}
            />
        </div>
    );
};

export default CalendarPage;
