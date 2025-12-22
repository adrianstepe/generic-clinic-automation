import React from 'react';
import { X, Calendar, Clock, User, FileText, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { lv } from 'date-fns/locale';
import { DashboardBooking } from '../../../hooks/useDashboardData';

interface AppointmentDetailsModalProps {
    booking: DashboardBooking | null;
    onClose: () => void;
    onUpdateStatus: (id: string, status: string) => void;
}

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({ booking, onClose, onUpdateStatus }) => {
    if (!booking) return null;

    const date = parseISO(booking.start_time);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Pieraksta detaļas</h3>
                        <p className="text-sm text-slate-500">ID: {booking.id.slice(0, 8)}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status Badge */}
                    <div className="flex justify-center">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold capitalize
                            ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                        'bg-yellow-100 text-yellow-700'}`}
                        >
                            {booking.status}
                        </span>
                    </div>

                    {/* Patient Info */}
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="p-3 bg-white rounded-full shadow-sm text-teal-600">
                            <User size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">{booking.customer_name}</h4>
                            <p className="text-sm text-slate-500">{booking.customer_email}</p>
                            {/* Phone would go here if available in the type */}
                        </div>
                    </div>

                    {/* Time & Service */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border border-gray-100 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Calendar size={16} />
                                <span className="text-xs font-medium uppercase">Datums</span>
                            </div>
                            <p className="font-bold text-slate-800">{format(date, 'd. MMMM yyyy', { locale: lv })}</p>
                        </div>
                        <div className="p-4 border border-gray-100 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Clock size={16} />
                                <span className="text-xs font-medium uppercase">Laiks</span>
                            </div>
                            <p className="font-bold text-slate-800">{format(date, 'HH:mm')}</p>
                        </div>
                    </div>

                    <div className="p-4 border border-gray-100 rounded-xl">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <FileText size={16} />
                            <span className="text-xs font-medium uppercase">Pakalpojums</span>
                        </div>
                        <p className="font-bold text-slate-800">{booking.service_name}</p>
                        <p className="text-sm text-slate-500 mt-1">
                            Speciālists: <span className="font-medium text-slate-700">{booking.doctor_name || 'Nav norādīts'}</span>
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                    {booking.status !== 'confirmed' && booking.status !== 'completed' && (
                        <button
                            onClick={() => { onUpdateStatus(booking.id, 'confirmed'); onClose(); }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-sm shadow-teal-200"
                        >
                            <CheckCircle size={18} />
                            Apstiprināt
                        </button>
                    )}

                    {booking.status !== 'cancelled' && (
                        <button
                            onClick={() => { onUpdateStatus(booking.id, 'cancelled'); onClose(); }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-slate-700 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                        >
                            <XCircle size={18} />
                            Atcelt
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentDetailsModal;
