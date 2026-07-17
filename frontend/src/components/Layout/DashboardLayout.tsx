import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/students')) return 'Students';
    if (pathname.startsWith('/teachers')) return 'Teachers';
    if (pathname.startsWith('/classes')) return 'Classes & Sections';
    if (pathname.startsWith('/subjects')) return 'Subjects & Curriculum';
    if (pathname.startsWith('/attendance')) return 'Attendance Marking';
    if (pathname.startsWith('/exams')) return 'Examinations & Grades';
    if (pathname.startsWith('/timetable')) return 'Class Timetables';
    if (pathname.startsWith('/finance') || pathname.startsWith('/fees')) return 'Fee Management';
    if (pathname.startsWith('/announcements')) return 'Notice Board';
    if (pathname.startsWith('/messages')) return 'Real-time Messaging';
    if (pathname.startsWith('/reports')) return 'Reports Generator';
    if (pathname.startsWith('/settings')) return 'School Settings';
    if (pathname.startsWith('/profile')) return 'My Profile';
    if (pathname.startsWith('/leave/gate-pass')) return 'Gate Pass';
    if (pathname.startsWith('/leave')) return 'Leave Management';
    if (pathname.startsWith('/gate-pass')) return 'Gate Pass';
    if (pathname.startsWith('/roles')) return 'Roles & Permissions';
    return 'JY SCHOOL';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-gray-950">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} title={getPageTitle(location.pathname)} />
        <main className="flex-1 overflow-y-auto px-5 py-5 lg:px-7 lg:py-6 animate-fade-in-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
