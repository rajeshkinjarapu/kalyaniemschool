import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

const pageLoader = (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
    <LoadingSpinner size="lg" />
  </div>
);

const withSuspense = (element: React.ReactElement) => (
  <Suspense fallback={pageLoader}>{element}</Suspense>
);

const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const StudentListPage = lazy(() => import('../pages/students/StudentListPage'));
const StudentFormPage = lazy(() => import('../pages/students/StudentFormPage'));
const StudentProfilePage = lazy(() => import('../pages/students/StudentProfilePage'));
const TeacherListPage = lazy(() => import('../pages/teachers/TeacherListPage'));
const TeacherFormPage = lazy(() => import('../pages/teachers/TeacherFormPage'));
const TeacherProfilePage = lazy(() => import('../pages/teachers/TeacherProfilePage'));
const TeacherStudentsPage = lazy(() => import('../pages/teachers/TeacherStudentsPage'));
const TeacherClassesPage = lazy(() => import('../pages/teachers/TeacherClassesPage'));
const ClassManagementPage = lazy(() => import('../pages/classes/ClassManagementPage'));
const ClassDetailPage = lazy(() => import('../pages/classes/ClassDetailPage'));
const SubjectPage = lazy(() => import('../pages/subjects/SubjectPage'));
const AttendanceMarkingPage = lazy(() => import('../pages/attendance/AttendanceMarkingPage'));
const MyAttendancePage = lazy(() => import('../pages/attendance/MyAttendancePage').then((mod) => ({ default: mod.MyAttendancePage })));
const AttendanceReportPage = lazy(() => import('../pages/attendance/AttendanceReportPage'));
const AttendanceDailyReportPage = lazy(() => import('../pages/attendance/AttendanceDailyReportPage'));
const ExamListPage = lazy(() => import('../pages/exams/ExamListPage'));
const MarksEntryPage = lazy(() => import('../pages/exams/MarksEntryPage'));
const ReportCardPage = lazy(() => import('../pages/exams/ReportCardPage'));
const PaperGeneratorDashboard = lazy(() => import('../pages/paper-generator/Dashboard').then((mod) => ({ default: mod.Dashboard })));
const QuestionBankPage = lazy(() => import('../pages/paper-generator/QuestionBank').then((mod) => ({ default: mod.QuestionBank })));
const PaperBuilderPage = lazy(() => import('../pages/paper-generator/PaperBuilder').then((mod) => ({ default: mod.PaperBuilder })));
const PaperDetailPage = lazy(() => import('../pages/paper-generator/PaperDetail').then((mod) => ({ default: mod.PaperDetail })));
const TimetablePage = lazy(() => import('../pages/timetable/TimetablePage'));
const FinancePage = lazy(() => import('../pages/fees/FinancePage'));
const FeePaymentsPage = lazy(() => import('../pages/fees/FeePaymentsPage'));
const AnnouncementsPage = lazy(() => import('../pages/announcements/AnnouncementsPage'));
const MessagesPage = lazy(() => import('../pages/messages/MessagesPage'));
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
const RolesPage = lazy(() => import('../pages/settings/RolesPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const LeaveTypePage = lazy(() => import('../pages/leave/LeaveTypePage'));
const LeaveRequestLogPage = lazy(() => import('../pages/leave/LeaveRequestLogPage'));
<<<<<<< HEAD
const GatePassPage = lazy(() => import('../pages/gate-pass/GatePassPage'));
const HomeworkPage = lazy(() => import('../pages/homework/HomeworkPage'));
const TeacherAttendancePage = lazy(() => import('../pages/teacher-attendance/TeacherAttendancePage'));
const SalaryPage = lazy(() => import('../pages/hr/SalaryPage'));
=======
const GatePassPage = lazy(() => import('../pages/leave/GatePassPage'));
>>>>>>> 3e5ae40 (Add colorful Gate Pass dashboard and route)

const AttendanceWrapper = () => {
  const { user } = useAuth();
  if (user?.role === 'STUDENT') {
    return <MyAttendancePage />;
  }
  return <AttendanceMarkingPage />;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(<LoginPage />),
  },
  {
    path: '/forgot-password',
    element: withSuspense(<ForgotPasswordPage />),
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
        element: withSuspense(<DashboardPage />),
      },
      {
        path: 'students',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <StudentListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'students/new',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <StudentFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'students/:id',
        element: withSuspense(<StudentProfilePage />),
      },
      {
        path: 'students/:id/edit',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <StudentFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teachers',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <TeacherListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teachers/new',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <TeacherFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teachers/:id',
        element: withSuspense(<TeacherProfilePage />),
      },
      {
        path: 'teachers/:id/edit',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <TeacherFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teachers/students',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['TEACHER', 'SUPER_ADMIN', 'ADMIN']}>
            <TeacherStudentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teachers/classes',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['TEACHER', 'SUPER_ADMIN', 'ADMIN']}>
            <TeacherClassesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'classes',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <ClassManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'classes/:id',
        element: withSuspense(<ClassDetailPage />),
      },
      {
        path: 'subjects',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <SubjectPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'attendance',
        element: withSuspense(<AttendanceWrapper />),
      },
      {
        path: 'attendance/report',
        element: withSuspense(<AttendanceReportPage />),
      },
      {
        path: 'attendance/daily-report',
        element: withSuspense(<AttendanceDailyReportPage />),
      },
      {
        path: 'exams',
        element: withSuspense(<ExamListPage />),
      },
      {
        path: 'exams/:id/entry',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <MarksEntryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams/:examId/report-card/:studentId',
        element: withSuspense(<ReportCardPage />),
      },
      {
        path: 'exams/paper-generator',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <PaperGeneratorDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams/paper-generator/questions',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <QuestionBankPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams/paper-generator/papers/new',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <PaperBuilderPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exams/paper-generator/papers/:id',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <PaperDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'timetable',
        element: withSuspense(<TimetablePage />),
      },
      {
        path: 'finance',
        element: withSuspense(<FinancePage />),
      },
      {
        path: 'fee-payment',
        element: withSuspense(<FeePaymentsPage />),
      },
      {
        path: 'announcements',
        element: withSuspense(<AnnouncementsPage />),
      },
      {
        path: 'messages',
        element: withSuspense(<MessagesPage />),
      },
      {
        path: 'reports',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'roles',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <RolesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: withSuspense(<ProfilePage />),
      },
      {
        path: 'leave/gate-pass',
        element: withSuspense(<GatePassPage />),
      },
      {
        path: 'leave/type',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <LeaveTypePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'leave/request-log',
        element: withSuspense(<LeaveRequestLogPage />),
      },
      {
        path: 'gate-pass',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']}>
            <GatePassPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'homework',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']}>
            <HomeworkPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teacher-attendance',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <TeacherAttendancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'hr/salary',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <SalaryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'salary',
        element: withSuspense(
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']}>
            <SalaryPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
export default router;
