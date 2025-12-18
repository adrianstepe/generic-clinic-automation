import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { useUser } from '@/contexts/UserContext';
import { Plus, Edit2, Trash2, X, Upload, Loader2 } from 'lucide-react';
import { Specialist, Language } from '@/types';

const SpecialistsPage: React.FC = () => {
    const { profile } = useUser();
    const [specialists, setSpecialists] = useState<Specialist[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        role_en: '',
        role_lv: '',
        role_ru: '',
        photo_url: '',
        specialities: '' // Comma separated
    });
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

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

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Lūdzu izvēlieties attēla failu');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Attēls nedrīkst būt lielāks par 5MB');
                return;
            }
            setPhotoFile(file);
            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setPhotoPreview(previewUrl);
        }
    };

    const uploadPhoto = async (file: File, specialistId: string): Promise<string | null> => {
        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile?.clinic_id}/${specialistId}.${fileExt}`;

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('specialist-photos')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error('Upload error:', error);
                // If bucket doesn't exist, fall back to returning null
                if (error.message.includes('Bucket not found')) {
                    alert('Attēlu krātuve nav konfigurēta. Lūdzu sazinieties ar administratoru.');
                    return null;
                }
                throw error;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('specialist-photos')
                .getPublicUrl(fileName);

            return urlData.publicUrl;
        } catch (error) {
            console.error('Error uploading photo:', error);
            return null;
        } finally {
            setUploading(false);
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
        setPhotoPreview(s.photoUrl || null);
        setPhotoFile(null);
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
        setPhotoPreview(null);
        setPhotoFile(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Vai tiešām vēlaties dzēst šo speciālistu?')) return;

        const { error } = await supabase
            .from('specialists')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Kļūda dzēšot speciālistu');
        } else {
            fetchSpecialists();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.clinic_id) return;

        let photoUrl = formData.photo_url;
        const specialistId = editingId || `sp_${crypto.randomUUID().slice(0, 8)}`;

        // Upload photo if a new file was selected
        if (photoFile) {
            const uploadedUrl = await uploadPhoto(photoFile, specialistId);
            if (uploadedUrl) {
                photoUrl = uploadedUrl;
            }
        }

        const payload = {
            clinic_id: profile.clinic_id,
            name: formData.name,
            role: {
                en: formData.role_en,
                lv: formData.role_lv,
                ru: formData.role_ru
            },
            photo_url: photoUrl,
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
                .insert({ id: specialistId, ...payload });
        }

        if (result.error) {
            console.error('Error saving specialist:', result.error);
            alert('Kļūda saglabājot speciālistu');
        } else {
            setIsModalOpen(false);
            setPhotoFile(null);
            setPhotoPreview(null);
            fetchSpecialists();
        }
    };

    if (loading) return <div className="p-8">Ielādē speciālistus...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Speciālisti</h1>
                    <p className="text-slate-500 dark:text-slate-400">Pārvaldiet klīnikas komandu</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    Pievienot speciālistu
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {specialists.map((specialist) => (
                    <div key={specialist.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-gray-100 dark:bg-slate-700">
                            {specialist.photoUrl ? (
                                <img src={specialist.photoUrl} alt={specialist.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-500">Nav foto</div>
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
                                className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium dark:text-white"
                            >
                                <Edit2 size={16} /> Rediģēt
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
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold dark:text-white">{editingId ? 'Rediģēt speciālistu' : 'Jauns speciālists'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Photo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fotogrāfija</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-700 flex-shrink-0">
                                        {photoPreview ? (
                                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-500 text-xs">Nav foto</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoSelect}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm dark:text-white"
                                        >
                                            <Upload size={16} />
                                            {photoFile ? 'Mainīt foto' : 'Augšupielādēt foto'}
                                        </button>
                                        {photoFile && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{photoFile.name}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vārds, Uzvārds *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amats (Latviski) *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    value={formData.role_lv}
                                    onChange={e => setFormData({ ...formData, role_lv: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amats (Angliski)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    value={formData.role_en}
                                    onChange={e => setFormData({ ...formData, role_en: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amats (Krieviski)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    value={formData.role_ru}
                                    onChange={e => setFormData({ ...formData, role_ru: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Specializācijas (atdalītas ar komatu)</label>
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
                                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    Atcelt
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {uploading && <Loader2 size={16} className="animate-spin" />}
                                    Saglabāt
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
