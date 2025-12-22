import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, Building2, Copy, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import ClinicFormModal from './ClinicFormModal';

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
    created_by?: string;
    servicesCount?: number;
    specialistsCount?: number;
}

const ClinicsPage: React.FC = () => {
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
    const [showDeployInstructions, setShowDeployInstructions] = useState<string | null>(null);

    const fetchClinics = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                // Enrich with counts
                const enrichedClinics = await Promise.all(
                    data.map(async (clinic) => {
                        const [servicesRes, specialistsRes] = await Promise.all([
                            supabase
                                .from('services')
                                .select('*', { count: 'exact', head: true })
                                .eq('clinic_id', clinic.id),
                            supabase
                                .from('specialists')
                                .select('*', { count: 'exact', head: true })
                                .eq('clinic_id', clinic.id)
                        ]);

                        return {
                            ...clinic,
                            is_active: clinic.is_active !== false,
                            servicesCount: servicesRes.count || 0,
                            specialistsCount: specialistsRes.count || 0
                        };
                    })
                );
                setClinics(enrichedClinics);
            }
        } catch (error) {
            console.error('[ClinicsPage] Error fetching clinics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClinics();
    }, []);

    const handleOpenModal = (clinic?: Clinic) => {
        setEditingClinic(clinic || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClinic(null);
    };

    const handleSaveSuccess = (clinicId: string, isNew: boolean) => {
        handleCloseModal();
        fetchClinics();
        if (isNew) {
            setShowDeployInstructions(clinicId);
        }
    };

    const handleToggleActive = async (clinic: Clinic) => {
        try {
            const { error } = await supabase
                .from('clinics')
                .update({ is_active: !clinic.is_active })
                .eq('id', clinic.id);

            if (error) throw error;
            fetchClinics();
        } catch (error) {
            console.error('[ClinicsPage] Error toggling status:', error);
            alert('Failed to update clinic status');
        }
    };

    const handleDelete = async (clinic: Clinic) => {
        if (!window.confirm(`Are you sure you want to delete "${clinic.name}"?\n\nThis will also delete all associated services and specialists. This action cannot be undone.`)) {
            return;
        }

        try {
            const { error } = await supabase.from('clinics').delete().eq('id', clinic.id);
            if (error) throw error;
            fetchClinics();
        } catch (error) {
            console.error('[ClinicsPage] Error deleting clinic:', error);
            alert('Failed to delete clinic');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

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
                    <h1 className="text-3xl font-bold text-white">Clinics</h1>
                    <p className="text-slate-400 mt-1">
                        Manage all clinics on the platform
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                    <Plus size={20} />
                    Add New Clinic
                </button>
            </div>

            {/* Clinics Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {clinics.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <Building2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No clinics yet</h3>
                        <p className="text-slate-500 mb-6">Create your first clinic to start onboarding customers</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <Plus size={18} />
                            Create First Clinic
                        </button>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-700/50">
                            <tr className="text-left text-slate-400 text-xs uppercase">
                                <th className="px-6 py-4">Clinic</th>
                                <th className="px-6 py-4">ID (Slug)</th>
                                <th className="px-6 py-4">Resources</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {clinics.map((clinic) => (
                                <tr key={clinic.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                                style={{ backgroundColor: clinic.theme?.primaryColor || '#8b5cf6' }}
                                            >
                                                {clinic.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{clinic.name}</p>
                                                <p className="text-slate-500 text-sm">{clinic.clinic_email || 'No email'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <code className="text-purple-400 bg-purple-900/20 px-2 py-1 rounded text-sm">
                                                {clinic.id}
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(clinic.id)}
                                                className="text-slate-500 hover:text-white transition-colors"
                                                title="Copy ID"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-4 text-sm">
                                            <span className="text-slate-400">
                                                {clinic.servicesCount} services
                                            </span>
                                            <span className="text-slate-400">
                                                {clinic.specialistsCount} specialists
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleActive(clinic)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${clinic.is_active
                                                    ? 'bg-green-900/30 text-green-400 border border-green-500/30 hover:bg-green-900/50'
                                                    : 'bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600'
                                                }`}
                                        >
                                            {clinic.is_active ? (
                                                <><ToggleRight size={14} /> Active</>
                                            ) : (
                                                <><ToggleLeft size={14} /> Inactive</>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-sm">
                                        {format(new Date(clinic.created_at), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setShowDeployInstructions(clinic.id)}
                                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="Deploy Instructions"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal(clinic)}
                                                className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-900/20 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(clinic)}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Clinic Form Modal */}
            {isModalOpen && (
                <ClinicFormModal
                    clinic={editingClinic}
                    existingClinics={clinics}
                    onClose={handleCloseModal}
                    onSuccess={handleSaveSuccess}
                />
            )}

            {/* Deploy Instructions Modal */}
            {showDeployInstructions && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-lg border border-slate-700">
                        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Deployment Instructions</h3>
                            <button
                                onClick={() => setShowDeployInstructions(null)}
                                className="text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
                                <p className="text-green-400 font-medium">✅ Clinic created successfully!</p>
                            </div>

                            <h4 className="text-white font-medium mb-3">Next Steps:</h4>
                            <ol className="space-y-4 text-slate-300">
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center flex-shrink-0">1</span>
                                    <span>Go to <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Cloudflare Pages Dashboard</a></span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center flex-shrink-0">2</span>
                                    <span>Create a new Pages project</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center flex-shrink-0">3</span>
                                    <span>Set build command: <code className="bg-slate-700 px-2 py-1 rounded text-sm">npm run build</code></span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center flex-shrink-0">4</span>
                                    <div>
                                        <span>Add environment variable:</span>
                                        <div className="mt-2 bg-slate-900 rounded-lg p-3 font-mono text-sm">
                                            <div className="flex justify-between items-center">
                                                <span>
                                                    <span className="text-purple-400">VITE_CLINIC_ID</span>
                                                    <span className="text-slate-500"> = </span>
                                                    <span className="text-green-400">{showDeployInstructions}</span>
                                                </span>
                                                <button
                                                    onClick={() => copyToClipboard(`VITE_CLINIC_ID=${showDeployInstructions}`)}
                                                    className="text-slate-500 hover:text-white"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center flex-shrink-0">5</span>
                                    <span>Deploy!</span>
                                </li>
                            </ol>
                        </div>
                        <div className="px-6 py-4 bg-slate-700/30 flex justify-end">
                            <button
                                onClick={() => setShowDeployInstructions(null)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicsPage;
