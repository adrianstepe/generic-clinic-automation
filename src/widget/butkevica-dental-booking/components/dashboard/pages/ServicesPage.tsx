import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useUser } from '@/contexts/UserContext';
import { Plus, Pencil, Trash2, X, Save, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';

interface ServiceItem {
    id: string;
    name: { LV: string; EN: string; RU: string };
    price_cents: number;
    duration_minutes: number;
    category: string;
    is_active: boolean;
}

// Category translations to Latvian for display
const CATEGORY_LABELS: Record<string, string> = {
    'preventive': 'Profilakse',
    'children': 'Bērniem',
    'treatment': 'Ārstēšana',
    'surgery': 'Ķirurģija',
    'prosthetics': 'Protezēšana',
    'Vispārēji': 'Vispārēji',
    'Higiēna': 'Higiēna',
};

// Get Latvian label for category (fallback to original if not found)
const getCategoryLabel = (category: string): string => {
    return CATEGORY_LABELS[category.toLowerCase()] || CATEGORY_LABELS[category] || category;
};

const ServicesPage: React.FC = () => {
    const { profile } = useUser();
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<ServiceItem | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        nameLV: '', nameEN: '', nameRU: '',
        category: '', price: '', duration: '30'
    });

    useEffect(() => {
        if (profile?.clinic_id) {
            fetchServices();
        }
    }, [profile]);

    const fetchServices = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('clinic_id', profile?.clinic_id)
            .order('category', { ascending: true });

        if (!error && data) {
            // Transform DB format to match our interface
            const transformed = data.map((row: any) => ({
                id: row.id,
                name: {
                    LV: row.name?.lv || row.name?.LV || '',
                    EN: row.name?.en || row.name?.EN || '',
                    RU: row.name?.ru || row.name?.RU || ''
                },
                price_cents: row.price_cents || row.price || 0,
                duration_minutes: row.duration_minutes || 0,
                category: row.category || 'Citi',
                is_active: row.is_active !== false
            }));
            setServices(transformed);
        }
        setLoading(false);
    };

    const handleOpenModal = (service?: ServiceItem) => {
        if (service) {
            setEditingService(service);
            setFormData({
                nameLV: service.name.LV || '',
                nameEN: service.name.EN || '',
                nameRU: service.name.RU || '',
                category: service.category || 'Vispārēji',
                price: (service.price_cents / 100).toString(),
                duration: service.duration_minutes.toString()
            });
        } else {
            setEditingService(null);
            setFormData({ nameLV: '', nameEN: '', nameRU: '', category: '', price: '', duration: '30' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.nameLV || !formData.price) {
            alert('Lūdzu aizpildiet obligātos laukus!');
            return;
        }

        const payload = {
            clinic_id: profile?.clinic_id,
            name: { lv: formData.nameLV, en: formData.nameEN, ru: formData.nameRU },
            category: formData.category || 'Vispārēji',
            price_cents: Math.round(parseFloat(formData.price) * 100),
            duration_minutes: parseInt(formData.duration),
            is_active: true
        };

        let error;
        if (editingService) {
            const { error: updateError } = await supabase
                .from('services')
                .update(payload)
                .eq('id', editingService.id);
            error = updateError;
        } else {
            // Generate unique ID for new service
            const newId = `s_${crypto.randomUUID().slice(0, 8)}`;
            const { error: insertError } = await supabase
                .from('services')
                .insert([{ id: newId, ...payload }]);
            error = insertError;
        }

        if (error) {
            alert('Kļūda saglabājot: ' + error.message);
        } else {
            setIsModalOpen(false);
            fetchServices();
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Vai tiešām vēlaties dzēst šo pakalpojumu?')) return;

        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) alert('Kļūda dzēšot: ' + error.message);
        else fetchServices();
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('services')
            .update({ is_active: !currentStatus })
            .eq('id', id);

        if (error) {
            alert('Kļūda mainot statusu: ' + error.message);
        } else {
            fetchServices();
        }
    };

    // Get unique categories for grouping
    const categories: string[] = Array.from(new Set(services.map(s => s.category || 'Citi')));

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Pakalpojumi un Kategorijas</h1>
                    <p className="text-slate-500 dark:text-slate-400">Pārvaldiet klīnikas piedāvājumu un cenas</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                    <Plus size={20} />
                    Pievienot jaunu
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal-600" size={32} /></div>
            ) : services.length === 0 ? (
                <div className="text-center py-20 text-slate-500 dark:text-slate-400">
                    Nav atrasti pakalpojumi. Pievienojiet pirmo!
                </div>
            ) : (
                <div className="space-y-8">
                    {categories.map(cat => (
                        <div key={cat} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                            <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-3 border-b border-gray-200 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-300">
                                {getCategoryLabel(cat)}
                            </div>
                            <table className="w-full text-left">
                                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-700/30">
                                    <tr>
                                        <th className="px-6 py-3">Nosaukums (LV)</th>
                                        <th className="px-6 py-3">Ilgums</th>
                                        <th className="px-6 py-3">Cena</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Darbības</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {services.filter(s => (s.category || 'Citi') === cat).map(service => (
                                        <tr key={service.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900 dark:text-white">{service.name.LV}</div>
                                                {service.name.EN && <div className="text-xs text-slate-400">{service.name.EN}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{service.duration_minutes} min</td>
                                            <td className="px-6 py-4 text-teal-600 dark:text-teal-400 font-bold">€{(service.price_cents / 100).toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleActive(service.id, service.is_active)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${service.is_active
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                                        }`}
                                                    title={service.is_active ? 'Noklikšķiniet, lai deaktivizētu' : 'Noklikšķiniet, lai aktivizētu'}
                                                >
                                                    {service.is_active ? (
                                                        <><ToggleRight size={16} /> Aktīvs</>
                                                    ) : (
                                                        <><ToggleLeft size={16} /> Neaktīvs</>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button onClick={() => handleOpenModal(service)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1">
                                                    <Pencil size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(service.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                {editingService ? 'Rediģēt pakalpojumu' : 'Jauns pakalpojums'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategorija</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="piem. Higiēna"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ierakstiet jaunu vai esošu kategoriju</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cena (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ilgums (min)</label>
                                    <input
                                        type="number"
                                        value={formData.duration}
                                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-slate-700">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nosaukums (Latviski) *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nameLV}
                                        onChange={e => setFormData({ ...formData, nameLV: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nosaukums (Angliski)</label>
                                    <input
                                        type="text"
                                        value={formData.nameEN}
                                        onChange={e => setFormData({ ...formData, nameEN: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nosaukums (Krieviski)</label>
                                    <input
                                        type="text"
                                        value={formData.nameRU}
                                        onChange={e => setFormData({ ...formData, nameRU: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                            >
                                Atcelt
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                            >
                                <Save size={18} />
                                Saglabāt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServicesPage;
