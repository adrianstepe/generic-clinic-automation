import React from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';

const SuperAdminLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-slate-900 overflow-hidden">
            <SuperAdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-900">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default SuperAdminLayout;
