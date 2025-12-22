import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useUser } from '@/contexts/UserContext';
import { Clock, Save, Loader2, User, Stethoscope } from 'lucide-react';

interface DaySchedule {
    day_of_week: number;
    is_available: boolean;
    start_time: string;
    end_time: string;
}

interface Specialist {
    id: string;
    name: string;
    specialties: string[];
}

interface Service {
    id: string;
    name: { lv?: string; en?: string };
}

const DAY_NAMES_LV = ['Svētdiena', 'Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturtdiena', 'Piektdiena', 'Sestdiena'];

const DEFAULT_SCHEDULE: DaySchedule[] = [
    { day_of_week: 0, is_available: false, start_time: '09:00', end_time: '18:00' },
    { day_of_week: 1, is_available: true, start_time: '09:00', end_time: '18:00' },
    { day_of_week: 2, is_available: true, start_time: '09:00', end_time: '18:00' },
    { day_of_week: 3, is_available: true, start_time: '09:00', end_time: '18:00' },
    { day_of_week: 4, is_available: true, start_time: '09:00', end_time: '18:00' },
    { day_of_week: 5, is_available: true, start_time: '09:00', end_time: '18:00' },
    { day_of_week: 6, is_available: false, start_time: '09:00', end_time: '18:00' },
];

const DoctorSchedulePage: React.FC = () => {
    const { profile } = useUser();
    const clinicId = import.meta.env.VITE_CLINIC_ID;
    const isAdmin = profile?.role === 'admin';

    const [specialists, setSpecialists] = useState<Specialist[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedSpecialistId, setSelectedSpecialistId] = useState<string>('');
    const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
    const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch specialists and services on mount
    useEffect(() => {
        if (clinicId) {
            fetchSpecialists();
            fetchServices();
        }
    }, [clinicId]);

    // For doctors, auto-select their own specialist ID
    useEffect(() => {
        if (!isAdmin && profile?.specialist_id) {
            setSelectedSpecialistId(profile.specialist_id);
        }
    }, [isAdmin, profile]);

    // Fetch schedule when specialist changes
    useEffect(() => {
        if (selectedSpecialistId) {
            fetchSchedule(selectedSpecialistId);
            const specialist = specialists.find(s => s.id === selectedSpecialistId);
            if (specialist) {
                setSelectedSpecialties(specialist.specialties || []);
            }
        }
    }, [selectedSpecialistId, specialists]);

    const fetchSpecialists = async () => {
        try {
            const { data, error } = await supabase
                .from('specialists')
                .select('id, name, specialties')
                .eq('clinic_id', clinicId)
                .order('name');

            if (error) throw error;
            setSpecialists(data || []);

            // Auto-select first for admin if not already set
            if (data && data.length > 0 && !selectedSpecialistId && isAdmin) {
                setSelectedSpecialistId(data[0].id);
            }
        } catch (error) {
            console.error('[DoctorSchedulePage] Error fetching specialists:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const { data, error } = await supabase
                .from('services')
                .select('id, name')
                .eq('clinic_id', clinicId);

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('[DoctorSchedulePage] Error fetching services:', error);
        }
    };

    const fetchSchedule = async (specialistId: string) => {
        try {
            const { data, error } = await supabase
                .from('specialist_working_hours')
                .select('day_of_week, is_available, start_time, end_time')
                .eq('specialist_id', specialistId)
                .order('day_of_week');

            if (error) throw error;

            if (data && data.length > 0) {
                const scheduleData = data.map(row => ({
                    day_of_week: row.day_of_week,
                    is_available: row.is_available,
                    start_time: row.start_time?.substring(0, 5) || '09:00',
                    end_time: row.end_time?.substring(0, 5) || '18:00',
                }));
                setSchedule(scheduleData);
            } else {
                setSchedule(DEFAULT_SCHEDULE);
            }
        } catch (error) {
            console.error('[DoctorSchedulePage] Error fetching schedule:', error);
        }
    };

    const handleDayToggle = (dayOfWeek: number) => {
        setSchedule(prev =>
            prev.map(day =>
                day.day_of_week === dayOfWeek ? { ...day, is_available: !day.is_available } : day
            )
        );
    };

    const handleTimeChange = (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
        setSchedule(prev =>
            prev.map(day =>
                day.day_of_week === dayOfWeek ? { ...day, [field]: value } : day
            )
        );
    };

    const handleSpecialtyToggle = (serviceId: string) => {
        setSelectedSpecialties(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const handleSave = async () => {
        if (!selectedSpecialistId) return;

        setSaving(true);
        setMessage(null);

        try {
            // Save schedule
            for (const day of schedule) {
                const { error } = await supabase
                    .from('specialist_working_hours')
                    .upsert({
                        specialist_id: selectedSpecialistId,
                        day_of_week: day.day_of_week,
                        is_available: day.is_available,
                        start_time: day.start_time,
                        end_time: day.end_time,
                        updated_at: new Date().toISOString(),
                    }, {
                        onConflict: 'specialist_id,day_of_week'
                    });

                if (error) throw error;
            }

            // Update specialist specialties
            const { error: specialtiesError } = await supabase
                .from('specialists')
                .update({ specialties: selectedSpecialties })
                .eq('id', selectedSpecialistId);

            if (specialtiesError) throw specialtiesError;

            // Update local state
            setSpecialists(prev =>
                prev.map(s =>
                    s.id === selectedSpecialistId ? { ...s, specialties: selectedSpecialties } : s
                )
            );

            setMessage({ type: 'success', text: 'Grafiks un specializācijas saglabātas!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            console.error('[DoctorSchedulePage] Error saving:', error);
            setMessage({ type: 'error', text: error.message || 'Kļūda saglabājot' });
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

    const selectedSpecialist = specialists.find(s => s.id === selectedSpecialistId);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <Loader2 className="animate-spin text-teal-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <Clock className="text-teal-500" size={28} />
                    {isAdmin ? 'Speciālistu Grafiks' : 'Mans Grafiks'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    {isAdmin ? 'Pārvaldiet speciālistu darba laikus un specializācijas' : 'Pārvaldiet savu darba grafiku'}
                </p>
            </div>

            {/* Specialist Selector (Admin only) */}
            {isAdmin && specialists.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <User size={16} />
                        Izvēlieties speciālistu
                    </label>
                    <select
                        value={selectedSpecialistId}
                        onChange={(e) => setSelectedSpecialistId(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white focus:ring-teal-500 focus:border-teal-500"
                    >
                        {specialists.map(spec => (
                            <option key={spec.id} value={spec.id}>
                                {spec.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Display selected specialist name for non-admin */}
            {!isAdmin && selectedSpecialist && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                            <User className="text-teal-600 dark:text-teal-400" size={24} />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-slate-800 dark:text-white">{selectedSpecialist.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Ārsts</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Message */}
            {message && (
                <div className={`mb-6 px-4 py-3 rounded-lg ${message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            {selectedSpecialistId && (
                <>
                    {/* Specialties Section */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden mb-6">
                        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                <Stethoscope size={20} className="text-teal-500" />
                                Specializācijas
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Izvēlieties pakalpojumus, ko šis speciālists var veikt</p>
                        </div>
                        <div className="p-4">
                            <div className="flex flex-wrap gap-3">
                                {services.map(service => {
                                    const isSelected = selectedSpecialties.includes(service.id);
                                    const serviceName = service.name?.lv || service.name?.en || service.id;
                                    return (
                                        <button
                                            key={service.id}
                                            onClick={() => handleSpecialtyToggle(service.id)}
                                            className={`px-4 py-2 rounded-lg border transition-all ${isSelected
                                                ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-500 text-teal-700 dark:text-teal-300'
                                                : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-teal-300'
                                                }`}
                                        >
                                            {isSelected && <span className="mr-2">✓</span>}
                                            {serviceName}
                                        </button>
                                    );
                                })}
                            </div>
                            {services.length === 0 && (
                                <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                                    Nav pieejamu pakalpojumu
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Schedule Grid */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Darba Grafiks</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Iestatiet darba laikus katrai dienai</p>
                        </div>

                        <div className="divide-y divide-gray-200 dark:divide-slate-700">
                            {schedule.map((day) => (
                                <div
                                    key={day.day_of_week}
                                    className={`p-4 flex items-center gap-4 ${!day.is_available ? 'bg-gray-50 dark:bg-slate-900/50' : ''}`}
                                >
                                    {/* Toggle */}
                                    <button
                                        onClick={() => handleDayToggle(day.day_of_week)}
                                        className={`w-14 h-8 rounded-full relative transition-colors ${day.is_available ? 'bg-teal-600' : 'bg-gray-300 dark:bg-slate-600'
                                            }`}
                                    >
                                        <div
                                            className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow ${day.is_available ? 'left-7' : 'left-1'
                                                }`}
                                        />
                                    </button>

                                    {/* Day Name */}
                                    <div className="w-28">
                                        <span className={`font-medium ${day.is_available ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                                            {DAY_NAMES_LV[day.day_of_week]}
                                        </span>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="w-24">
                                        <span className={`text-xs px-2 py-1 rounded ${day.is_available
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                            : 'bg-gray-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                            }`}>
                                            {day.is_available ? 'Strādā' : 'Brīvs'}
                                        </span>
                                    </div>

                                    {/* Time Pickers */}
                                    {day.is_available && (
                                        <div className="flex items-center gap-3 flex-1">
                                            <select
                                                value={day.start_time}
                                                onChange={(e) => handleTimeChange(day.day_of_week, 'start_time', e.target.value)}
                                                className="px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:ring-teal-500 focus:border-teal-500"
                                            >
                                                {timeOptions.map(time => (
                                                    <option key={time} value={time}>{time}</option>
                                                ))}
                                            </select>
                                            <span className="text-slate-400">līdz</span>
                                            <select
                                                value={day.end_time}
                                                onChange={(e) => handleTimeChange(day.day_of_week, 'end_time', e.target.value)}
                                                className="px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:ring-teal-500 focus:border-teal-500"
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
                        <div className="p-4 bg-gray-50 dark:bg-slate-700/30 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving || !selectedSpecialistId}
                                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
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

                    {/* Schedule Preview */}
                    <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Grafika Pārskats</h3>
                        <div className="flex flex-wrap gap-2">
                            {schedule.map(day => (
                                <div
                                    key={day.day_of_week}
                                    className={`px-3 py-2 rounded-lg text-sm ${day.is_available
                                        ? 'bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-500/30 text-teal-700 dark:text-teal-300'
                                        : 'bg-gray-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500'
                                        }`}
                                >
                                    <span className="font-medium">{DAY_NAMES_LV[day.day_of_week].slice(0, 3)}</span>
                                    {day.is_available && (
                                        <span className="ml-2 text-xs opacity-75">
                                            {day.start_time}-{day.end_time}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {!selectedSpecialistId && specialists.length === 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-6 text-center">
                    <p className="text-yellow-700 dark:text-yellow-400">
                        Nav pievienotu speciālistu. Lūdzu vispirms pievienojiet speciālistus.
                    </p>
                </div>
            )}
        </div>
    );
};

export default DoctorSchedulePage;
