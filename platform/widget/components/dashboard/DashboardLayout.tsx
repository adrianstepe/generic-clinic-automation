import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-slate-900">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
