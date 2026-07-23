import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    // Exact Matches First
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/students') return 'Student Directory';
    if (pathname === '/students/new') return 'Add New Student';
    if (pathname.match(/^\/students\/[^\/]+$/)) return 'Student Profile';
    if (pathname.match(/^\/students\/[^\/]+\/edit$/)) return 'Edit Student';
    
    if (pathname === '/teachers') return 'Teacher Directory';
    if (pathname === '/teachers/new') return 'Add New Teacher';
    if (pathname === '/teachers/students') return 'My Students';
    if (pathname === '/teachers/classes') return 'My Classes';
    if (pathname.match(/^\/teachers\/[^\/]+$/)) return 'Teacher Profile';
    if (pathname.match(/^\/teachers\/[^\/]+\/edit$/)) return 'Edit Teacher';
    
    if (pathname === '/classes') return 'Classes & Sections';
    if (pathname.match(/^\/classes\/[^\/]+$/)) return 'Class Details';
    
    if (pathname === '/subjects') return 'Subjects & Curriculum';
    
    // Attendance
    if (pathname === '/attendance') return 'Attendance Dashboard';
    if (pathname === '/attendance/mark') return 'Attendance Marking';
    if (pathname === '/attendance/report') return 'Attendance Reports';
    if (pathname === '/attendance/daily-report') return 'Daily Attendance Report';
    
    // Exams
    if (pathname === '/exams') return 'Examinations & Grades';
    if (pathname === '/exams/omr-scanner') return 'OMR Scanner';
    if (pathname.match(/^\/exams\/[^\/]+\/entry$/)) return 'Marks Entry';
    if (pathname.match(/^\/exams\/[^\/]+\/report-card\/[^\/]+$/)) return 'Report Card';
    
    // Question Bank
    if (pathname === '/question-bank') return 'Question Bank Dashboard';
    if (pathname === '/question-bank/dashboard') return 'Paper Generator Dashboard';
    if (pathname === '/question-bank/questions') return 'Question Bank';
    if (pathname === '/question-bank/papers/new') return 'Paper Generator';
    if (pathname.match(/^\/question-bank\/papers\/[^\/]+$/)) return 'Paper Details';
    
    if (pathname === '/timetable') return 'Class Timetables';
    if (pathname === '/finance') return 'Finance Dashboard';
    if (pathname === '/fee-payment') return 'Fee Payment';
    if (pathname.startsWith('/fees/collect')) return 'Collect Payment';
    
    if (pathname === '/announcements') return 'Notice Board';
    if (pathname === '/messages') return 'Real-time Messaging';
    if (pathname === '/reports') return 'Reports Generator';
    if (pathname === '/office-tools') return 'Office Tools';
    
    if (pathname === '/settings') return 'School Settings';
    if (pathname === '/roles') return 'Roles & Permissions';
    if (pathname === '/profile') return 'My Profile';
    
    if (pathname === '/gate-pass' || pathname === '/leave/gate-pass') return 'Gate Pass';
    if (pathname === '/leave/type') return 'Leave Types';
    if (pathname === '/leave/request-log') return 'Leave Request Log';
    if (pathname.startsWith('/leave')) return 'Leave Management';
    
    if (pathname === '/homework') return 'Homework Manager';
    if (pathname === '/teacher-attendance') return 'Staff Attendance';
    if (pathname === '/salary' || pathname === '/hr/salary') return 'Salary & Payroll';
    
    if (pathname.startsWith('/teacher/admit-cards')) return 'Teacher Admit Cards';
    if (pathname.startsWith('/student/admit-cards')) return 'Student Admit Cards';
    if (pathname.startsWith('/admit-card-view')) return 'Admit Card';
    
    return 'Dashboard';
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
