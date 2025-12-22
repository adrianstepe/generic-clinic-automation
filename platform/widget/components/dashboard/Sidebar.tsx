import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Users, Stethoscope, Clock } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

interface NavItem {
    icon: React.ElementType;
    label: string;
    path: string;
    end?: boolean;
    adminOnly?: boolean; // Hide from doctors
}

const Sidebar: React.FC = () => {
    const { profile } = useUser();
    const isDoctor = profile?.role === 'doctor';

    const navItems: NavItem[] = [
        { icon: Home, label: 'Pārskats', path: '/dashboard', end: true },
        { icon: Calendar, label: 'Kalendārs', path: '/dashboard/calendar' },
        { icon: Clock, label: 'Grafiks', path: '/dashboard/schedule' },
        { icon: Stethoscope, label: 'Pakalpojumi', path: '/dashboard/services', adminOnly: true },
        { icon: Users, label: 'Speciālisti', path: '/dashboard/specialists', adminOnly: true },
    ];

    // Filter items based on role
    const visibleItems = navItems.filter(item => !item.adminOnly || !isDoctor);

    // Dynamic title based on role
    const portalTitle = isDoctor ? 'Ārsta Panelis' : 'Admin Panelis';

    return (
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 hidden md:flex flex-col">
            <div className="p-6">
                <h2 className="text-xl font-bold text-teal-600 dark:text-teal-400 flex items-center gap-2">
                    {portalTitle}
                </h2>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {visibleItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                            ${isActive
                                ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}
                        `}
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                <div className="text-xs text-slate-400 text-center">
                    v1.3.0 • {isDoctor ? 'Ārsta' : 'Admin'} Edition
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
