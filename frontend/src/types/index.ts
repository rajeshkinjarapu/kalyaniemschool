export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  photoUrl?: string;
  isActive: boolean;
  createdAt: string;
  student?: Student;
  teacher?: Teacher;
}

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'ACCOUNTANT';

export interface Student {
  id: string;
  userId: string;
  user: User;
  rollNo: string;
  classId?: string;
  class?: Class;
  dob?: string;
  gender?: string;
  address?: string;
  bloodGroup?: string;
  medicalInfo?: string;
  admissionDate: string;
}

export interface Teacher {
  id: string;
  userId: string;
  user: User;
  employeeId: string;
  qualification?: string;
  specialization?: string;
  joiningDate: string;
}


export interface Class {
  id: string;
  name: string;
  section: string;
  academicYear: string;
  capacity: number;
  classTeacher?: Teacher;
  _count?: {
    students: number;
  };
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  classId: string;
  class?: Class;
}

export interface Attendance {
  id: string;
  studentId: string;
  student?: Student;
  classId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  note?: string;
}

export interface Exam {
  id: string;
  name: string;
  classId: string;
  class?: Class;
  term: string;
  examDate: string;
  maxMarks: number;
  passingMarks: number;
}

export interface Mark {
  id: string;
  studentId: string;
  student?: Student;
  examId: string;
  exam?: Exam;
  subjectId: string;
  subject?: Subject;
  marksObtained: number;
  maxMarks: number;
  grade?: string;
  remarks?: string;
}

export interface FeeStructure {
  id: string;
  classId: string;
  class?: Class;
  term: string;
  name: string;
  amount: number;
  dueDate: string;
}

export interface FeePayment {
  id: string;
  studentId: string;
  student?: Student;
  feeStructureId: string;
  feeStructure?: FeeStructure;
  amountPaid: number;
  paymentDate: string;
  method: string;
  status: string;
  receiptNo: string;
  remarks?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRoles: string; // Comma separated e.g. "STUDENT,TEACHER"
  createdById: string;
  createdBy?: User;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  sender?: User;
  receiverId: string;
  receiver?: User;
  content: string;
  readStatus: 'READ' | 'UNREAD';
  sentAt: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  targetRoles: string;
}

export interface SchoolSettings {
  id: string;
  schoolName: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  currentYear: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AdminDashboard {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalRevenue: number;
  enrollmentByClass: { name: string; count: number }[];
  attendanceToday: number;
  monthlyFeeCollection: { month: string; amount: number }[];
  genderDistribution: { male: number; female: number; other: number };
  recentPayments: FeePayment[];
  recentAnnouncements: Announcement[];
  attendanceTrend: { date: string; present: number; absent: number }[];
}
