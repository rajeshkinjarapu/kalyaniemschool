import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/Layout/DashboardLayout';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

// Dashboards Page (combines all dashboards into one dynamic routing entry)
import DashboardPage from '../pages/dashboard/DashboardPage';

// Students
import StudentListPage from '../pages/students/StudentListPage';
import StudentFormPage from '../pages/students/StudentFormPage';
import StudentProfilePage from '../pages/students/StudentProfilePage';

// Teachers
import TeacherListPage from '../pages/teachers/TeacherListPage';
import TeacherFormPage from '../pages/teachers/TeacherFormPage';
import TeacherProfilePage from '../pages/teachers/TeacherProfilePage';

// Classes
import ClassManagementPage from '../pages/classes/ClassManagementPage';
import ClassDetailPage from '../pages/classes/ClassDetailPage';

// Subjects
import SubjectPage from '../pages/subjects/SubjectPage';

// Attendance
import AttendanceMarkingPage from '../pages/attendance/AttendanceMarkingPage';
import AttendanceReportPage from '../pages/attendance/AttendanceReportPage';

// Exams
import ExamListPage from '../pages/exams/ExamListPage';
import MarksEntryPage from '../pages/exams/MarksEntryPage';
import ReportCardPage from '../pages/exams/ReportCardPage';

// Paper Generator
import { Dashboard as PaperGeneratorDashboard } from '../pages/paper-generator/Dashboard';
import { QuestionBank as QuestionBankPage } from '../pages/paper-generator/QuestionBank';
import { PaperBuilder as PaperBuilderPage } from '../pages/paper-generator/PaperBuilder';
import { PaperDetail as PaperDetailPage } from '../pages/paper-generator/PaperDetail';

// Timetable
import TimetablePage from '../pages/timetable/TimetablePage';

// Finance & Fees
import FinancePage from '../pages/fees/FinancePage';
import { FeePaymentsPage } from '../pages/fees/FeePaymentsPage';

// Announcements
import AnnouncementsPage from '../pages/announcements/AnnouncementsPage';

// Messages
import MessagesPage from '../pages/messages/MessagesPage';

// Reports
import ReportsPage from '../pages/reports/ReportsPage';

// Settings
import SettingsPage from '../pages/settings/SettingsPage';
import RolesPage from '../pages/settings/RolesPage';

// Profile
import ProfilePage from '../pages/profile/ProfilePage';

// Leave
import LeaveTypePage from '../pages/leave/LeaveTypePage';
import LeaveRequestLogPage from '../pages/leave/LeaveRequestLogPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'students',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <StudentListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'students/new',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <StudentFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'students/:id',
        element: <StudentProfilePage />,
      },
      {
        path: 'students/:id/edit',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <StudentFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teachers',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <TeacherListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teachers/new',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <TeacherFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teachers/:id',
        element: <TeacherProfilePage />,
      },
      {
        path: 'teachers/:id/edit',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <TeacherFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'classes',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <ClassManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'classes/:id',
        element: <ClassDetailPage />,
      },
      {
        path: 'subjects',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <SubjectPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'attendance',
        element: <AttendanceMarkingPage />,
      },
      {
        path: 'attendance/report',
        element: <AttendanceReportPage />,
      },
      {
        path: 'exams',
        element: <ExamListPage />,
      },
      {
        path: 'exams/:id/entry',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <MarksEntryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams/:examId/report-card/:studentId',
        element: <ReportCardPage />,
      },
      {
        path: 'exams/paper-generator',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <PaperGeneratorDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams/paper-generator/questions',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <QuestionBankPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams/paper-generator/papers/new',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <PaperBuilderPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams/paper-generator/papers/:id',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <PaperDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'timetable',
        element: <TimetablePage />,
      },
      {
        path: 'finance',
        element: <FinancePage />,
      },
      {
        path: 'fee-payment',
        element: <FeePaymentsPage />,
      },
      {
        path: 'announcements',
        element: <AnnouncementsPage />,
      },
      {
        path: 'messages',
        element: <MessagesPage />,
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'roles',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <RolesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'leave/type',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <LeaveTypePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'leave/request-log',
        element: <LeaveRequestLogPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
export default router;
