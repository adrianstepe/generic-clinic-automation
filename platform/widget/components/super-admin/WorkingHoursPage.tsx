import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Clock, Save, Loader2, RefreshCw, Building2 } from 'lucide-react';

interface DayConfig {
    day_of_week: number;
    is_open: boolean;
    open_time: string;
    close_time: string;
}

interface Clinic {
    id: string;
    name: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_HOURS: DayConfig[] = [
    { day_of_week: 0, is_open: false, open_time: '09:00', close_time: '18:00' },
    { day_of_week: 1, is_open: true, open_time: '09:00', close_time: '18:00' },
    { day_of_week: 2, is_open: true, open_time: '09:00', close_time: '18:00' },
    { day_of_week: 3, is_open: true, open_time: '09:00', close_time: '18:00' },
    { day_of_week: 4, is_open: true, open_time: '09:00', close_time: '18:00' },
    { day_of_week: 5, is_open: true, open_time: '09:00', close_time: '18:00' },
    { day_of_week: 6, is_open: false, open_time: '09:00', close_time: '18:00' },
];

const WorkingHoursPage: React.FC = () => {
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [selectedClinicId, setSelectedClinicId] = useState<string>('');
    const [workingHours, setWorkingHours] = useState<DayConfig[]>(DEFAULT_HOURS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch clinics on mount
    useEffect(() => {
        fetchClinics();
    }, []);

    // Fetch working hours when clinic changes
    useEffect(() => {
        if (selectedClinicId) {
            fetchWorkingHours(selectedClinicId);
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
            console.error('[WorkingHoursPage] Error fetching clinics:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkingHours = async (clinicId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clinic_working_hours')
                .select('day_of_week, is_open, open_time, close_time')
                .eq('clinic_id', clinicId)
                .order('day_of_week');

            if (error) throw error;

            if (data && data.length > 0) {
                // Map database format to component format
                const hours = data.map(row => ({
                    day_of_week: row.day_of_week,
                    is_open: row.is_open,
                    open_time: row.open_time?.substring(0, 5) || '09:00',
                    close_time: row.close_time?.substring(0, 5) || '18:00',
                }));
                setWorkingHours(hours);
            } else {
                // No config exists, use defaults
                setWorkingHours(DEFAULT_HOURS);
            }
        } catch (error) {
            console.error('[WorkingHoursPage] Error fetching working hours:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDayToggle = (dayOfWeek: number) => {
        setWorkingHours(prev =>
            prev.map(day =>
                day.day_of_week === dayOfWeek ? { ...day, is_open: !day.is_open } : day
            )
        );
    };

    const handleTimeChange = (dayOfWeek: number, field: 'open_time' | 'close_time', value: string) => {
        setWorkingHours(prev =>
            prev.map(day =>
                day.day_of_week === dayOfWeek ? { ...day, [field]: value } : day
            )
        );
    };

    const handleSave = async () => {
        if (!selectedClinicId) return;

        setSaving(true);
        setMessage(null);

        try {
            // Upsert all days
            for (const day of workingHours) {
                const { error } = await supabase
                    .from('clinic_working_hours')
                    .upsert({
                        clinic_id: selectedClinicId,
                        day_of_week: day.day_of_week,
                        is_open: day.is_open,
                        open_time: day.open_time,
                        close_time: day.close_time,
                        updated_at: new Date().toISOString(),
                    }, {
                        onConflict: 'clinic_id,day_of_week'
                    });

                if (error) throw error;
            }

            setMessage({ type: 'success', text: 'Working hours saved successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            console.error('[WorkingHoursPage] Error saving:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to save working hours' });
        } finally {
            setSaving(false);
        }
    };

    const generateTimeOptions = () => {
        const options = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                options.push(time);
            }
        }
        return options;
    };

    const timeOptions = generateTimeOptions();

    if (loading && clinics.length === 0) {
        return (
            <div className="p-8 flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Clock className="text-purple-400" size={28} />
                        Working Hours
                    </h1>
                    <p className="text-slate-400 mt-1">Configure when customers can book appointments</p>
                </div>
                <button
                    onClick={() => fetchWorkingHours(selectedClinicId)}
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

            {/* Message */}
            {message && (
                <div className={`mb-6 px-4 py-3 rounded-lg ${message.type === 'success'
                    ? 'bg-green-900/30 border border-green-500/30 text-green-400'
                    : 'bg-red-900/30 border border-red-500/30 text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Working Hours Grid */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                    <h2 className="text-lg font-semibold text-white">Weekly Schedule</h2>
                    <p className="text-sm text-slate-400">Toggle days on/off and set opening hours</p>
                </div>

                <div className="divide-y divide-slate-700">
                    {workingHours.map((day) => (
                        <div
                            key={day.day_of_week}
                            className={`p-4 flex items-center gap-4 ${!day.is_open ? 'bg-slate-900/50' : ''}`}
                        >
                            {/* Toggle */}
                            <button
                                onClick={() => handleDayToggle(day.day_of_week)}
                                className={`w-14 h-8 rounded-full relative transition-colors ${day.is_open ? 'bg-purple-600' : 'bg-slate-600'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${day.is_open ? 'left-7' : 'left-1'
                                        }`}
                                />
                            </button>

                            {/* Day Name */}
                            <div className="w-28">
                                <span className={`font-medium ${day.is_open ? 'text-white' : 'text-slate-500'}`}>
                                    {DAY_NAMES[day.day_of_week]}
                                </span>
                            </div>

                            {/* Status Badge */}
                            <div className="w-20">
                                <span className={`text-xs px-2 py-1 rounded ${day.is_open
                                    ? 'bg-green-900/30 text-green-400'
                                    : 'bg-slate-700 text-slate-400'
                                    }`}>
                                    {day.is_open ? 'Open' : 'Closed'}
                                </span>
                            </div>

                            {/* Time Pickers */}
                            {day.is_open && (
                                <div className="flex items-center gap-3 flex-1">
                                    <select
                                        value={day.open_time}
                                        onChange={(e) => handleTimeChange(day.day_of_week, 'open_time', e.target.value)}
                                        className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        {timeOptions.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                    <span className="text-slate-500">to</span>
                                    <select
                                        value={day.close_time}
                                        onChange={(e) => handleTimeChange(day.day_of_week, 'close_time', e.target.value)}
                                        className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        {timeOptions.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Save Button */}
                <div className="p-4 bg-slate-700/30 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving || !selectedClinicId}
                        className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Working Hours
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Preview Card */}
            <div className="mt-6 bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Schedule Preview</h3>
                <div className="flex flex-wrap gap-2">
                    {workingHours.map(day => (
                        <div
                            key={day.day_of_week}
                            className={`px-3 py-2 rounded-lg text-sm ${day.is_open
                                ? 'bg-purple-900/30 border border-purple-500/30 text-purple-300'
                                : 'bg-slate-700/50 text-slate-500'
                                }`}
                        >
                            <span className="font-medium">{DAY_NAMES[day.day_of_week].slice(0, 3)}</span>
                            {day.is_open && (
                                <span className="ml-2 text-xs opacity-75">
                                    {day.open_time}-{day.close_time}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WorkingHoursPage;
