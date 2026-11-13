import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopNavbar } from '../components/common/TopNavbar';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-800">
      {/* Clean Top Navigation Bar (Zero Left Sidebar) */}
      <TopNavbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
};
