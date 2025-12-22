import React from 'react';
import { CalendarCheck, Users, Clock, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { DashboardStats } from '../../hooks/useDashboardData';

interface KPICardsProps {
    stats: DashboardStats;
}

const KPICards: React.FC<KPICardsProps> = ({ stats }) => {
    const kpiData = [
        {
            label: 'Šodienas pieraksti',
            value: stats.appointmentsToday.toString(),
            change: 'Tiešraide',
            trend: 'neutral',
            icon: CalendarCheck,
            color: 'bg-blue-500',
        },
        {
            label: 'Gaidošie pacienti',
            value: stats.patientsWaiting.toString(),
            change: 'Laikā',
            trend: 'neutral',
            icon: Users,
            color: 'bg-teal-500',
        },
        {
            label: 'Gaidošie pieprasījumi',
            value: stats.pendingRequests.toString(),
            change: 'Nepieciešama darbība',
            trend: stats.pendingRequests > 0 ? 'down' : 'neutral',
            icon: Clock,
            color: 'bg-amber-500',
        },
        {
            label: 'Ieņēmumi (aptuveni)',
            value: `€${stats.revenue}`,
            change: 'Kopā',
            trend: 'up',
            icon: CreditCard,
            color: 'bg-indigo-500',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpiData.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10 dark:bg-opacity-20`}>
                                <Icon size={20} className={`text-${stat.color.replace('bg-', '')} dark:text-${stat.color.replace('bg-', '')}-400`} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            {stat.trend === 'up' && <TrendingUp size={16} className="text-green-500" />}
                            {stat.trend === 'down' && <TrendingDown size={16} className="text-red-500" />}
                            <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                                stat.trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'
                                }`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default KPICards;
