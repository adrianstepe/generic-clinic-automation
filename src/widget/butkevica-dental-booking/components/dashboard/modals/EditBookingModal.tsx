import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Phone, FileText, Save, Loader2 } from 'lucide-react';
import { format, parseISO, addMinutes } from 'date-fns';
import { supabase } from '../../../supabaseClient';

interface Service {
    id: string;
    name_en: string;
    name_lv: string;
    name_ru?: string;
    duration_minutes: number;
    price_cents: number;
}

interface EditBookingModalProps {
    booking: {
        id: string;
        customer_name: string;
        customer_email: string;
        customer_phone?: string;
        start_time: string;
        end_time?: string;
        service_id?: string;
        service_name?: string;
        notes?: string;
        status: string;
    } | null;
    onClose: () => void;
    onSave: (id: string, updates: BookingUpdates) => Promise<void>;
}

export interface BookingUpdates {
    start_time: string;
    end_time: string;
    service_id: string;
    service_name: string;
    customer_phone: string;
    notes: string;
}

const EditBookingModal: React.FC<EditBookingModalProps> = ({ booking, onClose, onSave }) => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');

    // Available time slots
    const timeSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];

    useEffect(() => {
        if (booking) {
            const date = parseISO(booking.start_time);
            setSelectedDate(format(date, 'yyyy-MM-dd'));
            setSelectedTime(format(date, 'HH:mm'));
            setSelectedServiceId(booking.service_id || '');
            setPhone(booking.customer_phone || '');
            setNotes(booking.notes || '');
        }
        fetchServices();
    }, [booking]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('clinic_services')
                .select('id, name_en, name_lv, name_ru, duration_minutes, price_cents')
                .eq('is_active', true)
                .order('display_order');

            if (error) throw error;
            setServices(data || []);
        } catch (err) {
            console.error('Error fetching services:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!booking || !selectedDate || !selectedTime || !selectedServiceId) return;

        setSaving(true);
        try {
            const selectedService = services.find(s => s.id === selectedServiceId);
            const duration = selectedService?.duration_minutes || 60;

            const startTime = new Date(`${selectedDate}T${selectedTime}:00`);
            const endTime = addMinutes(startTime, duration);

            await onSave(booking.id, {
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                service_id: selectedServiceId,
                service_name: selectedService?.name_lv || selectedService?.name_en || '',
                customer_phone: phone,
                notes: notes
            });

            onClose();
        } catch (err) {
            console.error('Error saving booking:', err);
            alert('Neizdevās saglabāt izmaiņas');
        } finally {
            setSaving(false);
        }
    };

    if (!booking) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Rediģēt pierakstu</h3>
                        <p className="text-sm text-slate-500">{booking.customer_name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Calendar size={16} className="text-slate-400" />
                                Datums
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={format(new Date(), 'yyyy-MM-dd')}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Clock size={16} className="text-slate-400" />
                                Laiks
                            </label>
                            <select
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all appearance-none bg-white"
                            >
                                {timeSlots.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Service */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                            <FileText size={16} className="text-slate-400" />
                            Pakalpojums
                        </label>
                        {loading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 size={20} className="animate-spin text-teal-600" />
                            </div>
                        ) : (
                            <select
                                value={selectedServiceId}
                                onChange={(e) => setSelectedServiceId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all appearance-none bg-white"
                            >
                                <option value="">Izvēlieties pakalpojumu</option>
                                {services.map(service => (
                                    <option key={service.id} value={service.id}>
                                        {service.name_lv || service.name_en} — €{(service.price_cents / 100).toFixed(0)} ({service.duration_minutes} min)
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                            <Phone size={16} className="text-slate-400" />
                            Tālruņa numurs
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+371 20000000"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                            <FileText size={16} className="text-slate-400" />
                            Piezīmes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Pievienojiet piezīmes par pacientu vai vizīti..."
                            rows={3}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-slate-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                        Atcelt
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !selectedDate || !selectedTime || !selectedServiceId}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-sm shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Saglabā...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Saglabāt
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditBookingModal;
