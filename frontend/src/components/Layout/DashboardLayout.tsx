import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/students')) return 'Total Students';
    if (pathname.startsWith('/teachers')) return 'Teachers';
    if (pathname.startsWith('/classes')) return 'Classes & Sections';
    if (pathname.startsWith('/subjects')) return 'Subjects & Curriculum';
    if (pathname.startsWith('/attendance')) return 'Attendance Marking';
    if (pathname.startsWith('/exams')) return 'Examinations & Grades';
    if (pathname.startsWith('/timetable')) return 'Class Timetables';
    if (pathname.startsWith('/fees/collect') || pathname.startsWith('/fee-payment')) return 'Collect Payment';
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
    if (pathname.startsWith('/teacher-attendance')) return 'Staff Attendance';
    if (pathname.startsWith('/homework')) return 'Homework Manager';
    return 'JY SCHOOL';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-[#1e1b4b] dark:via-[#2e1065] dark:to-[#312e81]">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} title={getPageTitle(location.pathname)} />
        <main className="flex-1 overflow-y-auto p-0 md:p-5 lg:p-7 animate-fade-in-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
