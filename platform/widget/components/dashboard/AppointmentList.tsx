import React, { useState } from 'react';
import { Search, Filter, CheckCircle, XCircle, Clock, Calendar, Copy, UserPlus, Check, X, AlertCircle, Pencil, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { lv } from 'date-fns/locale';

// Helper to format time from database (stored as UTC but represents Riga time)
// This extracts the raw hour/minute from the ISO string without timezone conversion
const formatRigaTime = (isoString: string): { date: string; time: string } => {
    // Parse the ISO string to extract raw values
    // Database stores "2025-12-15 10:00:00+00" meaning 10:00 Riga time (stored incorrectly as UTC)
    // We need to display it as 10:00, not convert it
    const match = isoString.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
    if (match) {
        const [, year, month, day, hour, minute] = match;
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return {
            date: format(dateObj, 'd. MMM', { locale: lv }),
            time: `${hour}:${minute}`
        };
    }
    // Fallback to regular parsing if pattern doesn't match
    const date = parseISO(isoString);
    return {
        date: format(date, 'd. MMM', { locale: lv }),
        time: format(date, 'HH:mm')
    };
};

// Latvian status translations
const STATUS_LABELS: Record<string, string> = {
    pending: 'Gaida',
    confirmed: 'Apstiprināts',
    completed: 'Pabeigts',
    cancelled: 'Atcelts'
};

interface Booking {
    id: string;
    created_at: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    service_name?: string;
    service_id?: string;
    start_time: string;
    end_time?: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    doctor_id?: string;
    doctor_name?: string;
    notes?: string;
}

interface AppointmentListProps {
    bookings: Booking[];
    loading: boolean;
    error?: string | null;
    onUpdateStatus: (id: string, status: string) => void;
    onEditBooking?: (booking: Booking) => void;
    onAddBooking?: () => void;
}

type DateFilterType = 'today' | 'tomorrow' | 'all' | 'custom';

const AppointmentList: React.FC<AppointmentListProps> = ({ bookings, loading, error, onUpdateStatus, onEditBooking, onAddBooking }) => {
    const [filter, setFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState<DateFilterType>('today');
    const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [search, setSearch] = useState('');

    const filteredBookings = bookings.filter(b => {
        // Status Filter
        const matchesStatus = filter === 'all' || b.status === filter;

        // Search Filter
        const matchesSearch = b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
            b.service_name.toLowerCase().includes(search.toLowerCase());

        // Date Filter - use raw date extraction to avoid timezone issues
        let matchesDate = true;

        // Extract raw date from booking (YYYY-MM-DD format)
        const bookingDateMatch = b.start_time.match(/(\d{4}-\d{2}-\d{2})/);
        const bookingDateStr = bookingDateMatch ? bookingDateMatch[1] : '';

        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Get tomorrow's date in YYYY-MM-DD format
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

        if (dateFilter === 'today') {
            matchesDate = bookingDateStr === todayStr;
        } else if (dateFilter === 'tomorrow') {
            matchesDate = bookingDateStr === tomorrowStr;
        } else if (dateFilter === 'custom') {
            matchesDate = bookingDateStr === customDate;
        } else if (dateFilter === 'all') {
            // For 'all' (renamed to Aktuālie), show only future/today bookings to avoid clutter
            matchesDate = bookingDateStr >= todayStr;
        }

        return matchesStatus && matchesSearch && matchesDate;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
            case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock size={14} className="mr-1" />;
            case 'confirmed': return <CheckCircle size={14} className="mr-1" />;
            case 'completed': return <CheckCircle size={14} className="mr-1" />;
            case 'cancelled': return <XCircle size={14} className="mr-1" />;
            default: return <Clock size={14} className="mr-1" />;
        }
    };

    const copyBookingLink = () => {
        navigator.clipboard.writeText(window.location.origin);
        alert('Rezervācijas saite nokopēta!');
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex flex-col gap-4 bg-white dark:bg-slate-800 sticky top-0 z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Pierakstu pieprasījumi</h3>
                        {onAddBooking && (
                            <button
                                onClick={onAddBooking}
                                className="p-1.5 bg-teal-100 text-teal-700 hover:bg-teal-200 rounded-lg transition-colors"
                                title="Pievienot pierakstu"
                            >
                                <Plus size={18} />
                            </button>
                        )}
                    </div>
                    <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
                        <button
                            onClick={() => setDateFilter('today')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${dateFilter === 'today' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            Šodien
                        </button>
                        <button
                            onClick={() => setDateFilter('tomorrow')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${dateFilter === 'tomorrow' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            Rīt
                        </button>
                        <button
                            onClick={() => setDateFilter('all')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${dateFilter === 'all' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            Aktuālie
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 justify-between">
                    <div className="relative flex-1 max-w-xs">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Meklēt pacientus..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all w-full"
                        />
                    </div>

                    <div className="flex gap-2">
                        {dateFilter === 'custom' && (
                            <input
                                type="date"
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                                className="px-3 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            />
                        )}
                        {dateFilter !== 'custom' && (
                            <button
                                onClick={() => setDateFilter('custom')}
                                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all"
                                title="Select Date"
                            >
                                <Calendar size={18} />
                            </button>
                        )}

                        <div className="relative">
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="pl-3 pr-8 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none cursor-pointer"
                            >
                                <option value="all">Visi statusi</option>
                                <option value="pending">Gaida</option>
                                <option value="confirmed">Apstiprināts</option>
                                <option value="completed">Pabeigts</option>
                                <option value="cancelled">Atcelts</option>
                            </select>
                            <Filter size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-y-auto flex-1">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-500 p-8 text-center">
                        <AlertCircle size={48} className="mb-4 opacity-50" />
                        <h4 className="font-bold text-lg mb-2">Neizdevās ielādēt pierakstus</h4>
                        <p className="text-sm text-slate-500 max-w-xs">{error}</p>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
                        <p>Ielādē pierakstus...</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400 dark:text-slate-500">
                        <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-full mb-4">
                            <Calendar size={32} className="text-gray-300 dark:text-slate-500" />
                        </div>
                        <h4 className="text-slate-700 dark:text-slate-300 font-medium mb-1">Pieraksti nav atrasti</h4>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 text-center max-w-xs">
                            {dateFilter === 'today'
                                ? "Šodien nav ieplānotu pierakstu."
                                : dateFilter === 'tomorrow'
                                    ? "Rīt nav ieplānotu pierakstu."
                                    : "Neviens pieraksts neatbilst filtriem."}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={copyBookingLink}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                            >
                                <Copy size={16} />
                                Kopēt saiti
                            </button>
                        </div>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-slate-700/50 sticky top-0 z-0">
                            <tr>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pacients</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pakalpojums</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Speciālists</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Datums un laiks</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statuss</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Darbības</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredBookings.map((booking) => {
                                const { date: formattedDate, time: formattedTime } = formatRigaTime(booking.start_time);
                                return (
                                    <tr key={booking.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 flex items-center justify-center text-xs font-bold">
                                                    {booking.customer_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">{booking.customer_name}</div>
                                                    <div className="text-slate-400 dark:text-slate-500 text-xs">{booking.customer_email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-slate-600 dark:text-slate-300">{booking.service_name}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                                                    {booking.doctor_name ? booking.doctor_name.charAt(0) : '?'}
                                                </div>
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{booking.doctor_name || 'Nav norādīts'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                                                {formattedDate} • {formattedTime}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                                                {getStatusIcon(booking.status)}
                                                {STATUS_LABELS[booking.status] || booking.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {onEditBooking && (
                                                    <button
                                                        onClick={() => onEditBooking(booking)}
                                                        className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-md transition-colors"
                                                        title="Rediģēt"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onUpdateStatus(booking.id, 'confirmed')}
                                                    className="p-1.5 text-green-600 hover:text-white hover:bg-green-600 rounded-md transition-colors"
                                                    title="Apstiprināt"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                                                    className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 rounded-md transition-colors"
                                                    title="Noraidīt/Atcelt"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div >
    );
};

export default AppointmentList;
