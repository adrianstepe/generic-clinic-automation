import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import {
    Loader2,
    CalendarCheck,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    Mail,
    Phone,
    Building2
} from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';

interface Booking {
    id: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    service_name?: string;
    start_time: string;
    end_time?: string;
    status: string;
    actual_status?: string;
    amount_cents?: number;
    clinic_id?: string;
    created_at: string;
}

interface Clinic {
    id: string;
    name: string;
}

const BookingsPage: React.FC = () => {
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [selectedClinicId, setSelectedClinicId] = useState<string>('');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'no_show'>('all');

    // Fetch clinics on mount
    useEffect(() => {
        fetchClinics();
    }, []);

    // Fetch bookings when clinic changes
    useEffect(() => {
        if (selectedClinicId) {
            fetchBookings(selectedClinicId);
        }
    }, [selectedClinicId]);

    const fetchClinics = async () => {
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('id, name')
                .order('name');

            if (error) throw error;
            setClinics(data || []);

            // Auto-select first clinic
            if (data && data.length > 0) {
                setSelectedClinicId(data[0].id);
            }
        } catch (error) {
            console.error('[BookingsPage] Error fetching clinics:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBookings = async (clinicId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('clinic_id', clinicId)
                .in('status', ['confirmed', 'completed'])
                .order('start_time', { ascending: false });

            if (error) throw error;
            setBookings(data || []);
        } catch (error) {
            console.error('[BookingsPage] Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkStatus = async (bookingId: string, newStatus: 'completed' | 'no_show', customerName: string) => {
        const statusLabel = newStatus === 'completed' ? 'Completed' : 'No-Show';
        const confirmed = window.confirm(`Are you sure you want to mark ${customerName}'s booking as "${statusLabel}"?\n\nThis action cannot be undone.`);

        if (!confirmed) return;

        setUpdating(bookingId);
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ actual_status: newStatus })
                .eq('id', bookingId);

            if (error) throw error;

            // Update local state
            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, actual_status: newStatus } : b
            ));
        } catch (error) {
            console.error('[BookingsPage] Error updating status:', error);
            alert('Failed to update booking status');
        } finally {
            setUpdating(null);
        }
    };

    const filteredBookings = bookings.filter(b => {
        if (filter === 'all') return true;
        if (filter === 'pending') return !b.actual_status && isPast(parseISO(b.start_time));
        if (filter === 'completed') return b.actual_status === 'completed';
        if (filter === 'no_show') return b.actual_status === 'no_show';
        return true;
    });

    const getStatusBadge = (booking: Booking) => {
        if (booking.actual_status === 'completed') {
            return (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-500/30">
                    <CheckCircle size={12} /> Completed
                </span>
            );
        }
        if (booking.actual_status === 'no_show') {
            return (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-500/30">
                    <XCircle size={12} /> No-Show
                </span>
            );
        }
        if (isPast(parseISO(booking.start_time))) {
            return (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-900/30 text-amber-400 border border-amber-500/30">
                    <Clock size={12} /> Needs Review
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-500/30">
                <CalendarCheck size={12} /> Upcoming
            </span>
        );
    };

    const pendingCount = bookings.filter(b => !b.actual_status && isPast(parseISO(b.start_time))).length;
    const selectedClinic = clinics.find(c => c.id === selectedClinicId);

    if (loading && clinics.length === 0) {
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
                    <h1 className="text-3xl font-bold text-white">Bookings</h1>
                    <p className="text-slate-400 mt-1">
                        Track appointment outcomes and patient attendance
                    </p>
                </div>
                <button
                    onClick={() => selectedClinicId && fetchBookings(selectedClinicId)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Clinic Selector */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Building2 size={16} />
                    Select Clinic
                </label>
                <select
                    value={selectedClinicId}
                    onChange={(e) => setSelectedClinicId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
                >
                    {clinics.map(clinic => (
                        <option key={clinic.id} value={clinic.id}>
                            {clinic.name} ({clinic.id})
                        </option>
                    ))}
                </select>
            </div>

            {/* Alert for pending reviews */}
            {pendingCount > 0 && (
                <div className="mb-6 bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-400" />
                    <p className="text-amber-200">
                        <strong>{pendingCount}</strong> past appointment{pendingCount !== 1 ? 's' : ''} need{pendingCount === 1 ? 's' : ''} outcome review
                        {selectedClinic && <span className="text-amber-400"> at {selectedClinic.name}</span>}
                    </p>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { key: 'all', label: 'All' },
                    { key: 'pending', label: 'Needs Review', count: pendingCount },
                    { key: 'completed', label: 'Completed' },
                    { key: 'no_show', label: 'No-Shows' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key as typeof filter)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === tab.key
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-black text-xs rounded-full">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Bookings Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {filteredBookings.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <CalendarCheck className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No bookings found</h3>
                        <p className="text-slate-500">
                            {filter === 'pending'
                                ? 'All past appointments have been reviewed!'
                                : selectedClinicId
                                    ? 'No bookings match this filter'
                                    : 'Select a clinic to view bookings'}
                        </p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-700/50">
                            <tr className="text-left text-slate-400 text-xs uppercase">
                                <th className="px-6 py-4">Patient</th>
                                <th className="px-6 py-4">Service</th>
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {filteredBookings.map((booking) => {
                                const isPastAppointment = isPast(parseISO(booking.start_time));
                                const needsReview = isPastAppointment && !booking.actual_status;

                                return (
                                    <tr
                                        key={booking.id}
                                        className={`hover:bg-slate-700/30 transition-colors ${needsReview ? 'bg-amber-900/10' : ''
                                            }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                                                    {booking.customer_name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{booking.customer_name}</p>
                                                    <div className="flex items-center gap-3 text-slate-500 text-sm">
                                                        <span className="flex items-center gap-1">
                                                            <Mail size={12} />
                                                            {booking.customer_email}
                                                        </span>
                                                        {booking.customer_phone && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone size={12} />
                                                                {booking.customer_phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {booking.service_name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-white">
                                                    {format(parseISO(booking.start_time), 'MMM d, yyyy')}
                                                </p>
                                                <p className="text-slate-500 text-sm">
                                                    {format(parseISO(booking.start_time), 'HH:mm')}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            €{((booking.amount_cents || 0) / 100).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(booking)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {needsReview ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleMarkStatus(booking.id, 'completed', booking.customer_name)}
                                                            disabled={updating === booking.id}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                                        >
                                                            {updating === booking.id ? (
                                                                <Loader2 size={14} className="animate-spin" />
                                                            ) : (
                                                                <CheckCircle size={14} />
                                                            )}
                                                            Completed
                                                        </button>
                                                        <button
                                                            onClick={() => handleMarkStatus(booking.id, 'no_show', booking.customer_name)}
                                                            disabled={updating === booking.id}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                                        >
                                                            {updating === booking.id ? (
                                                                <Loader2 size={14} className="animate-spin" />
                                                            ) : (
                                                                <XCircle size={14} />
                                                            )}
                                                            No-Show
                                                        </button>
                                                    </>
                                                ) : booking.actual_status ? (
                                                    <span className="text-slate-500 text-sm">
                                                        Reviewed
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-600 text-sm">
                                                        Upcoming
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default BookingsPage;
