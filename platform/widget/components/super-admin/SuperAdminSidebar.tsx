import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, LogOut, Shield } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

interface NavItem {
    icon: React.ElementType;
    label: string;
    path: string;
    end?: boolean;
}

const SuperAdminSidebar: React.FC = () => {
    const { user, signOut } = useUser();
    const navigate = useNavigate();

    const navItems: NavItem[] = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/super-admin', end: true },
        { icon: Building2, label: 'Clinics', path: '/super-admin/clinics' },
    ];

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <aside className="w-64 bg-slate-800 border-r border-slate-700 hidden md:flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Super Admin</h2>
                        <p className="text-xs text-slate-400">Platform Management</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                            ${isActive
                                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                            }
                        `}
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {user?.email?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{user?.email}</p>
                            <p className="text-xs text-slate-500">Super Admin</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>

            {/* Version */}
            <div className="px-4 pb-4">
                <div className="text-xs text-slate-600 text-center">
                    v1.0.0 • Platform Admin
                </div>
            </div>
        </aside>
    );
};

export default SuperAdminSidebar;
