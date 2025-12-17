import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Users, Briefcase, Settings } from 'lucide-react';

const Sidebar: React.FC = () => {
    const navItems = [
        { icon: Home, label: 'Pārskats', path: '/dashboard', end: true },
        { icon: Calendar, label: 'Kalendārs', path: '/dashboard/calendar' },
        { icon: Briefcase, label: 'Pakalpojumi', path: '/dashboard/services' },
        { icon: Users, label: 'Speciālisti', path: '/dashboard/specialists' },
    ];

    return (
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 hidden md:flex flex-col">
            <div className="p-6">
                <h2 className="text-xl font-bold text-teal-600 dark:text-teal-400 flex items-center gap-2">
                    Admin Portal
                </h2>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => (
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
                    v1.2.0 • SaaS Edition
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
