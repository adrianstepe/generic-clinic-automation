import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useUser } from '@/contexts/UserContext';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { Specialist, Language } from '@/types';

const SpecialistsPage: React.FC = () => {
    const { profile } = useUser();
    const [specialists, setSpecialists] = useState<Specialist[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        role_en: '',
        role_lv: '',
        role_ru: '',
        photo_url: '',
        specialities: '' // Comma separated
    });

    useEffect(() => {
        if (profile?.clinic_id) {
            fetchSpecialists();
        }
    }, [profile]);

    const fetchSpecialists = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('specialists')
                .select('*')
                .eq('clinic_id', profile?.clinic_id);

            if (error) throw error;

            // Transform DB format (snake_case, lowercase keys) to frontend format
            const transformedData = (data || []).map((row: any) => ({
                id: row.id,
                name: row.name || '',
                role: {
                    EN: row.role?.en || row.role?.EN || '',
                    LV: row.role?.lv || row.role?.LV || '',
                    RU: row.role?.ru || row.role?.RU || ''
                },
                photoUrl: row.photo_url || row.photoUrl || '',
                specialties: row.specialties || []
            }));
            setSpecialists(transformedData);
        } catch (error) {
            console.error('Error fetching specialists:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleEdit = (s: Specialist) => {
        setEditingId(s.id);
        setFormData({
            name: s.name,
            role_en: s.role.EN || '',
            role_lv: s.role.LV || '',
            role_ru: s.role.RU || '',
            photo_url: s.photoUrl || '',
            specialities: s.specialties ? s.specialties.join(', ') : ''
        });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingId(null);
        setFormData({
            name: '',
            role_en: '',
            role_lv: '',
            role_ru: '',
            photo_url: '',
            specialities: ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this specialist?')) return;

        const { error } = await supabase
            .from('specialists')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error deleting specialist');
        } else {
            fetchSpecialists();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.clinic_id) return;

        const payload = {
            clinic_id: profile.clinic_id,
            name: formData.name,
            role: {
                EN: formData.role_en,
                LV: formData.role_lv,
                RU: formData.role_ru
            },
            photo_url: formData.photo_url,
            specialties: formData.specialities.split(',').map(s => s.trim()).filter(Boolean),
            is_active: true
        };

        let result;
        if (editingId) {
            result = await supabase
                .from('specialists')
                .update(payload)
                .eq('id', editingId);
        } else {
            result = await supabase
                .from('specialists')
                .insert(payload);
        }

        if (result.error) {
            console.error('Error saving specialist:', result.error);
            alert('Failed to save specialist');
        } else {
            setIsModalOpen(false);
            fetchSpecialists();
        }
    };

    if (loading) return <div className="p-8">Loading specialists...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Specialists</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your clinic's team</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    Add Specialist
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {specialists.map((specialist) => (
                    <div key={specialist.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-gray-100">
                            {specialist.photoUrl ? (
                                <img src={specialist.photoUrl} alt={specialist.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">No Photo</div>
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{specialist.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{specialist.role.LV || specialist.role.EN}</p>

                        <div className="flex flex-wrap gap-2 justify-center mb-6">
                            {specialist.specialties?.map((tag, idx) => (
                                <span key={idx} className="px-2 py-1 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 rounded text-xs">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-2 mt-auto w-full">
                            <button
                                onClick={() => handleEdit(specialist)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                            >
                                <Edit2 size={16} /> Edit
                            </button>
                            <button
                                onClick={() => handleDelete(specialist.id)}
                                className="flex items-center justify-center px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold dark:text-white">{editingId ? 'Edit Specialist' : 'New Specialist'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role (English)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    value={formData.role_en}
                                    onChange={e => setFormData({ ...formData, role_en: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role (Latvian)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    value={formData.role_lv}
                                    onChange={e => setFormData({ ...formData, role_lv: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Photo URL</label>
                                <input
                                    type="url"
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    value={formData.photo_url}
                                    onChange={e => setFormData({ ...formData, photo_url: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Specialties (comma separated)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    value={formData.specialities}
                                    onChange={e => setFormData({ ...formData, specialities: e.target.value })}
                                    placeholder="Endodontija, Protezēšana"
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpecialistsPage;
