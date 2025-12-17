import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useUser } from '@/contexts/UserContext';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { Service, Language } from '@/types';

// Extended Service type for local usage if needed, or rely on imported type
// But types.ts service uses Record<Language, string> which is good.

const ServicesPage: React.FC = () => {
    const { profile } = useUser();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name_en: '',
        name_lv: '',
        name_ru: '',
        price: '',
        duration: '30',
        category: 'treatment'
    });

    useEffect(() => {
        if (profile?.clinic_id) {
            fetchServices();
        }
    }, [profile]);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('clinic_id', profile?.clinic_id)
                .order('category');

            if (error) throw error;

            // Transform DB format (snake_case, lowercase keys) to frontend format (camelCase, uppercase keys)
            const transformedData = (data || []).map((row: any) => ({
                id: row.id,
                name: {
                    EN: row.name?.en || row.name?.EN || '',
                    LV: row.name?.lv || row.name?.LV || '',
                    RU: row.name?.ru || row.name?.RU || ''
                },
                description: {
                    EN: row.description?.en || row.description?.EN || '',
                    LV: row.description?.lv || row.description?.LV || '',
                    RU: row.description?.ru || row.description?.RU || ''
                },
                price: row.price_cents || row.price || 0, // Keep in cents for display
                durationMinutes: row.duration_minutes || row.durationMinutes || 0,
                icon: row.icon || '',
                category: row.category || 'treatment'
            }));
            setServices(transformedData);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleEdit = (service: Service) => {
        setEditingService(service);
        setFormData({
            name_en: service.name.EN || '',
            name_lv: service.name.LV || '',
            name_ru: service.name.RU || '',
            price: (service.price / 100).toString(), // Convert cents to eur
            duration: service.durationMinutes.toString(),
            category: service.category
        });
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingService(null);
        setFormData({
            name_en: '',
            name_lv: '',
            name_ru: '',
            price: '',
            duration: '30',
            category: 'treatment'
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service?')) return;

        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error deleting service');
        } else {
            fetchServices();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.clinic_id) return;

        const payload = {
            clinic_id: profile.clinic_id,
            name: {
                EN: formData.name_en,
                LV: formData.name_lv,
                RU: formData.name_ru
            },
            description: { EN: '', LV: '', RU: '' }, // Default empty for now
            price_cents: Math.round(parseFloat(formData.price) * 100),
            duration_minutes: parseInt(formData.duration),
            category: formData.category,
            is_active: true
        };

        let error;
        if (editingService) {
            const { error: err } = await supabase
                .from('services')
                .update(payload)
                .eq('id', editingService.id);
            error = err;
        } else {
            const { error: err } = await supabase
                .from('services')
                .insert(payload);
            error = err;
        }

        if (error) {
            console.error('Error saving service:', error);
            alert('Failed to save service');
        } else {
            setIsModalOpen(false);
            fetchServices();
        }
    };

    if (loading) return <div className="p-8">Loading services...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Services</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your clinic's services and pricing</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    Add Service
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Service Name</th>
                            <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Category</th>
                            <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Duration</th>
                            <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Price</th>
                            <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {services.map((service) => (
                            <tr key={service.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="p-4">
                                    <div className="font-medium text-slate-900 dark:text-white">{service.name.LV || service.name.EN}</div>
                                    <div className="text-xs text-slate-400">{service.name.EN}</div>
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        {service.category}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-300">
                                    {service.durationMinutes} min
                                </td>
                                <td className="p-4 font-medium text-slate-900 dark:text-white">
                                    €{(service.price / 100).toFixed(2)}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(service)}
                                            className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(service.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold dark:text-white">{editingService ? 'Edit Service' : 'New Service'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name (English)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    value={formData.name_en}
                                    onChange={e => setFormData({ ...formData, name_en: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name (Latvian)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    value={formData.name_lv}
                                    onChange={e => setFormData({ ...formData, name_lv: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (min)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        value={formData.duration}
                                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                <select
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="preventive">Preventive</option>
                                    <option value="treatment">Treatment</option>
                                    <option value="surgery">Surgery</option>
                                    <option value="children">Children</option>
                                    <option value="prosthetics">Prosthetics</option>
                                </select>
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
                                    Save Service
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServicesPage;
