import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { X, Save, Loader2, Copy, Palette } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

interface Clinic {
    id: string;
    name: string;
    domain?: string;
    clinic_email?: string;
    logo_url?: string;
    theme?: {
        primaryColor?: string;
    };
    settings?: {
        currency?: string;
        timezone?: string;
    };
    is_active: boolean;
    created_at: string;
}

interface ClinicFormModalProps {
    clinic: Clinic | null;
    existingClinics: Clinic[];
    onClose: () => void;
    onSuccess: (clinicId: string, isNew: boolean) => void;
}

const CURRENCIES = ['EUR', 'USD', 'GBP', 'PLN', 'SEK', 'NOK', 'DKK'];
const TIMEZONES = [
    'Europe/Riga',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Paris',
    'Europe/Warsaw',
    'Europe/Stockholm',
    'America/New_York',
    'America/Los_Angeles',
];

const PRESET_COLORS = [
    '#0d9488', // Teal (default)
    '#8b5cf6', // Purple
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#f97316', // Orange
    '#22c55e', // Green
    '#ec4899', // Pink
    '#6366f1', // Indigo
];

// Generate a slug from clinic name
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 30);
}

const ClinicFormModal: React.FC<ClinicFormModalProps> = ({ clinic, existingClinics, onClose, onSuccess }) => {
    const { user } = useUser();
    const isEditing = !!clinic;

    const [formData, setFormData] = useState({
        id: clinic?.id || '',
        name: clinic?.name || '',
        clinic_email: clinic?.clinic_email || '',
        domain: clinic?.domain || '',
        logo_url: clinic?.logo_url || '',
        primaryColor: clinic?.theme?.primaryColor || '#0d9488',
        currency: clinic?.settings?.currency || 'EUR',
        timezone: clinic?.settings?.timezone || 'Europe/Riga',
    });

    const [copyFromClinic, setCopyFromClinic] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-generate slug when name changes (only for new clinics)
    useEffect(() => {
        if (!isEditing && formData.name) {
            setFormData(prev => ({ ...prev, id: generateSlug(formData.name) }));
        }
    }, [formData.name, isEditing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            // Validate required fields
            if (!formData.id || !formData.name) {
                throw new Error('Clinic ID and Name are required');
            }

            // Check for duplicate ID on new clinic
            if (!isEditing && existingClinics.some(c => c.id === formData.id)) {
                throw new Error('A clinic with this ID already exists');
            }

            const payload = {
                id: formData.id,
                name: formData.name,
                clinic_email: formData.clinic_email || null,
                domain: formData.domain || null,
                logo_url: formData.logo_url || null,
                theme: { primaryColor: formData.primaryColor },
                settings: {
                    currency: formData.currency,
                    timezone: formData.timezone
                },
                is_active: true,
                created_by: user?.email || 'unknown',
            };

            if (isEditing) {
                // Update existing clinic
                const { error: updateError } = await supabase
                    .from('clinics')
                    .update({
                        name: payload.name,
                        clinic_email: payload.clinic_email,
                        domain: payload.domain,
                        logo_url: payload.logo_url,
                        theme: payload.theme,
                        settings: payload.settings,
                    })
                    .eq('id', clinic.id);

                if (updateError) throw updateError;
            } else {
                // Insert new clinic
                const { error: insertError } = await supabase
                    .from('clinics')
                    .insert([payload]);

                if (insertError) throw insertError;

                // If copy from clinic is selected, copy services and specialists
                if (copyFromClinic) {
                    await copyServicesFromClinic(copyFromClinic, formData.id);
                    await copySpecialistsFromClinic(copyFromClinic, formData.id);
                }
            }

            onSuccess(formData.id, !isEditing);
        } catch (err: any) {
            console.error('[ClinicFormModal] Error saving:', err);
            setError(err.message || 'Failed to save clinic');
        } finally {
            setSaving(false);
        }
    };

    const copyServicesFromClinic = async (sourceClinicId: string, targetClinicId: string) => {
        // Fetch source services
        const { data: sourceServices, error: fetchError } = await supabase
            .from('services')
            .select('*')
            .eq('clinic_id', sourceClinicId);

        if (fetchError) throw fetchError;
        if (!sourceServices || sourceServices.length === 0) return;

        // Create new services for target clinic
        const newServices = sourceServices.map((s, index) => ({
            id: `${targetClinicId}_s${index + 1}`,
            clinic_id: targetClinicId,
            name: s.name,
            description: s.description,
            price_cents: s.price_cents,
            duration_minutes: s.duration_minutes,
            category: s.category,
            icon: s.icon,
            is_active: true,
        }));

        const { error: insertError } = await supabase
            .from('services')
            .insert(newServices);

        if (insertError) throw insertError;
        console.log(`[ClinicFormModal] Copied ${newServices.length} services from ${sourceClinicId} to ${targetClinicId}`);
    };

    const copySpecialistsFromClinic = async (sourceClinicId: string, targetClinicId: string) => {
        // Fetch source specialists
        const { data: sourceSpecialists, error: fetchError } = await supabase
            .from('specialists')
            .select('*')
            .eq('clinic_id', sourceClinicId);

        if (fetchError) throw fetchError;
        if (!sourceSpecialists || sourceSpecialists.length === 0) return;

        // Create new specialists for target clinic
        // Note: We need to update specialties array to point to new service IDs
        const newSpecialists = sourceSpecialists.map((s, index) => ({
            id: `${targetClinicId}_d${index + 1}`,
            clinic_id: targetClinicId,
            name: s.name,
            role: s.role,
            photo_url: s.photo_url,
            // Update specialty IDs to match new clinic prefix
            specialties: s.specialties?.map((specId: string) =>
                specId.replace(sourceClinicId, targetClinicId)
            ) || [],
            is_active: true,
        }));

        const { error: insertError } = await supabase
            .from('specialists')
            .insert(newSpecialists);

        if (insertError) throw insertError;
        console.log(`[ClinicFormModal] Copied ${newSpecialists.length} specialists from ${sourceClinicId} to ${targetClinicId}`);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-xl border border-slate-700 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800">
                    <h3 className="text-lg font-bold text-white">
                        {isEditing ? 'Edit Clinic' : 'Add New Clinic'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        {error && (
                            <div className="bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Clinic Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Clinic Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Modern Dental Clinic"
                            />
                        </div>

                        {/* Clinic ID (Slug) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Clinic ID (Slug) *
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={formData.id}
                                    onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                    disabled={isEditing}
                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                                    placeholder="modern-dental"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Used for VITE_CLINIC_ID environment variable
                            </p>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Clinic Email
                            </label>
                            <input
                                type="email"
                                value={formData.clinic_email}
                                onChange={(e) => setFormData({ ...formData, clinic_email: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
                                placeholder="contact@moderndental.com"
                            />
                        </div>

                        {/* Domain */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Domain
                            </label>
                            <input
                                type="text"
                                value={formData.domain}
                                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
                                placeholder="moderndental.com"
                            />
                        </div>

                        {/* Logo URL */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Logo URL
                            </label>
                            <input
                                type="url"
                                value={formData.logo_url}
                                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
                                placeholder="https://example.com/logo.png"
                            />
                        </div>

                        {/* Primary Color */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                                <Palette size={16} />
                                Primary Brand Color
                            </label>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-2">
                                    {PRESET_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, primaryColor: color })}
                                            className={`w-8 h-8 rounded-lg transition-transform ${formData.primaryColor === color
                                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110'
                                                    : 'hover:scale-105'
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <input
                                    type="color"
                                    value={formData.primaryColor}
                                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                                />
                                <code className="text-slate-400 text-sm">{formData.primaryColor}</code>
                            </div>
                        </div>

                        {/* Currency & Timezone */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                    Currency
                                </label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
                                >
                                    {CURRENCIES.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                    Timezone
                                </label>
                                <select
                                    value={formData.timezone}
                                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
                                >
                                    {TIMEZONES.map((tz) => (
                                        <option key={tz} value={tz}>{tz}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Copy Services Template (only for new clinics) */}
                        {!isEditing && existingClinics.length > 0 && (
                            <div className="pt-4 border-t border-slate-700">
                                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                                    <Copy size={16} />
                                    Copy Services & Specialists From
                                </label>
                                <select
                                    value={copyFromClinic}
                                    onChange={(e) => setCopyFromClinic(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="">Start fresh (no template)</option>
                                    {existingClinics.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.id})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">
                                    Copies all services and specialists from selected clinic as a starting template
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-slate-700/30 flex justify-end gap-3 sticky bottom-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-slate-300 font-medium hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <><Loader2 className="animate-spin" size={18} /> Saving...</>
                            ) : (
                                <><Save size={18} /> {isEditing ? 'Save Changes' : 'Create Clinic'}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClinicFormModal;
