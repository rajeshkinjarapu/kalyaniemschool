import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';
import { Role, Gender, AttendanceStatus } from '../types/enums';

// Simple in-memory cache to speed up the dashboard
const cache: { [key: string]: { data: any; expiry: number } } = {};

export const clearDashboardCache = () => {
  Object.keys(cache).forEach(key => delete cache[key]);
};

export const getAdminDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cacheKey = 'admin_dashboard';
    const nowMs = Date.now();
    if (cache[cacheKey] && cache[cacheKey].expiry > nowMs) {
      return successResponse(res, cache[cacheKey].data, 'Admin dashboard data fetched from cache');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Run independent database queries in parallel
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      revenueResult,
      classes,
      todayAttendance,
      payments,
      genderGroups,
      recentPayments,
      recentAnnouncements,
      weekAttendance
    ] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.feePayment.aggregate({ _sum: { amountPaid: true } }),
      prisma.class.findMany({ include: { _count: { select: { students: true } } } }),
      prisma.attendance.findMany({ where: { date: { gte: today, lt: tomorrow } } }),
      prisma.feePayment.findMany({ where: { paymentDate: { gte: twelveMonthsAgo } } }),
      prisma.student.groupBy({ by: ['gender'], _count: { _all: true } }),
      prisma.feePayment.findMany({
        take: 5,
        orderBy: { paymentDate: 'desc' },
        include: {
          student: { include: { user: { select: { name: true } } } },
          feeStructure: { select: { name: true } }
        }
      }),
      prisma.announcement.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        where: { isActive: true }
      }),
      prisma.attendance.findMany({ where: { date: { gte: sevenDaysAgo } } })
    ]);

    const totalRevenue = revenueResult._sum.amountPaid || 0;

    const enrollmentByClass = classes.map(c => ({
      name: `${c.name}-${c.section}`,
      count: c._count.students
    }));

    const totalMarked = todayAttendance.length;
    const presentMarked = todayAttendance.filter(a => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE).length;
    const attendanceToday = totalMarked > 0 ? Math.round((presentMarked / totalMarked) * 100) : 0;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCollectionMap: { [key: string]: number } = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      monthlyCollectionMap[key] = 0;
    }

    payments.forEach(p => {
      const d = new Date(p.paymentDate);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyCollectionMap[key] !== undefined) {
        monthlyCollectionMap[key] += p.amountPaid;
      }
    });

    const monthlyFeeCollection = Object.keys(monthlyCollectionMap)
      .map(month => ({ month, amount: monthlyCollectionMap[month] }))
      .reverse();

    const genderDistribution = { male: 0, female: 0, other: 0 };
    genderGroups.forEach(g => {
      if (g.gender === Gender.MALE) genderDistribution.male = g._count._all;
      else if (g.gender === Gender.FEMALE) genderDistribution.female = g._count._all;
      else if (g.gender === Gender.OTHER) genderDistribution.other = g._count._all;
    });

    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextDate = new Date(d);
      nextDate.setDate(nextDate.getDate() + 1);

      const records = weekAttendance.filter(a => a.date >= d && a.date < nextDate);
      const present = records.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE).length;
      const absent = records.filter(r => r.status === AttendanceStatus.ABSENT).length;
      
      attendanceTrend.push({
        date: `${d.getDate()} ${months[d.getMonth()]}`,
        present,
        absent
      });
    }

    const responseData = {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalRevenue,
      enrollmentByClass,
      attendanceToday,
      monthlyFeeCollection,
      genderDistribution,
      recentPayments,
      recentAnnouncements,
      attendanceTrend
    };

    // Cache for 3 minutes (180000 ms) to make dashboard lightning fast
    cache[cacheKey] = {
      data: responseData,
      expiry: Date.now() + 180000
    };

    successResponse(res, responseData, 'Admin dashboard data fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getTeacherDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user!.id }
    });
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher profile not found' });
      return;
    }

    // Assigned Classes with student count
    const assignedClasses = await prisma.classSubjectTeacher.findMany({
      where: { teacherId: teacher.id },
      include: {
        class: {
          include: {
            _count: { select: { students: true } }
          }
        },
        subject: true
      }
    });

    const classIds = Array.from(new Set(assignedClasses.map(ac => ac.classId)));

    const totalStudents = await prisma.student.count({
      where: { classId: { in: classIds } }
    });

    // Today's Attendance summary for assigned classes
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await prisma.attendance.findMany({
      where: {
        classId: { in: classIds },
        date: { gte: today, lt: tomorrow }
      }
    });

    const totalMarked = todayAttendance.length;
    const presentMarked = todayAttendance.filter(a => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE).length;
    const todayAttendanceSummary = {
      total: totalMarked,
      present: presentMarked,
      absent: totalMarked - presentMarked,
      rate: totalMarked > 0 ? Math.round((presentMarked / totalMarked) * 100) : 0
    };

    // Today's timetable slots
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];

    const timetableToday = await prisma.timetable.findMany({
      where: {
        teacherId: teacher.id,
        day: currentDay
      },
      include: {
        class: true,
        subject: true
      },
      orderBy: { startTime: 'asc' }
    });

    // Recent announcements targeted to Teachers
    const announcements = await prisma.announcement.findMany({
      take: 5,
      where: {
        isActive: true,
        targetRoles: { contains: Role.TEACHER }
      },
      orderBy: { createdAt: 'desc' }
    });

    successResponse(res, {
      assignedClasses: assignedClasses.map(ac => ({
        classId: ac.classId,
        className: `${ac.class.name}-${ac.class.section}`,
        subjectName: ac.subject.name,
        subjectCode: ac.subject.code,
        studentCount: ac.class._count.students
      })),
      totalStudents,
      todayAttendanceSummary,
      timetableToday,
      announcements
    }, 'Teacher dashboard data fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getStudentDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
      include: {
        class: true,
        user: { select: { name: true, email: true, phone: true, photoUrl: true } }
      }
    });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    // Attendance rate last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId: student.id,
        date: { gte: thirtyDaysAgo }
      }
    });

    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE).length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    // Recent Marks
    const recentMarks = await prisma.mark.findMany({
      where: { studentId: student.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        subject: true,
        exam: true
      }
    });

    // Upcoming Exams
    const upcomingExams = await prisma.exam.findMany({
      where: {
        classId: student.classId || '',
        examDate: { gte: new Date() }
      },
      take: 5,
      orderBy: { examDate: 'asc' }
    });

    // Fee Status
    let feeStatus = { totalDue: 0, totalPaid: 0, status: 'NO_FEES' };
    if (student.classId) {
      const structures = await prisma.feeStructure.findMany({
        where: { classId: student.classId }
      });
      const payments = await prisma.feePayment.findMany({
        where: { studentId: student.id }
      });

      const totalDue = structures.reduce((sum, s) => sum + s.amount, 0);
      const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);

      feeStatus = {
        totalDue,
        totalPaid,
        status: totalPaid === 0 && totalDue > 0 ? 'UNPAID' : totalPaid >= totalDue ? 'PAID' : 'PARTIAL'
      };
    }

    // Today's classes
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];

    const timetableToday = student.classId ? await prisma.timetable.findMany({
      where: {
        classId: student.classId,
        day: currentDay
      },
      include: {
        subject: true,
        teacher: { include: { user: { select: { name: true } } } }
      },
      orderBy: { startTime: 'asc' }
    }) : [];

    // Announcements
    const announcements = await prisma.announcement.findMany({
      take: 5,
      where: {
        isActive: true,
        targetRoles: { contains: Role.STUDENT }
      },
      orderBy: { createdAt: 'desc' }
    });

    const { medicalInfo, ...studentWithoutMedical } = student;

    successResponse(res, {
      student: studentWithoutMedical,
      attendancePercentage,
      recentMarks: recentMarks.map(m => ({
        examName: m.exam.name,
        subjectName: m.subject.name,
        marksObtained: m.marksObtained,
        maxMarks: m.maxMarks,
        grade: m.grade,
        remarks: m.remarks
      })),
      upcomingExams,
      feeStatus,
      timetableToday,
      announcements
    }, 'Student dashboard data fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getParentDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: req.user!.id },
      include: {
        children: {
          include: {
            user: { select: { name: true, photoUrl: true } },
            class: true
          }
        }
      }
    });

    if (!parent) {
      res.status(404).json({ success: false, message: 'Parent profile not found' });
      return;
    }

    const childrenData = [];
    for (const child of parent.children) {
      // Attendance last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          studentId: child.id,
          date: { gte: thirtyDaysAgo }
        }
      });

      const totalDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE).length;
      const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

      // Recent Marks
      const recentMarks = await prisma.mark.findMany({
        where: { studentId: child.id },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          subject: true,
          exam: true
        }
      });

      // Fee Status
      let feeStatus = { totalDue: 0, totalPaid: 0, status: 'NO_FEES' };
      if (child.classId) {
        const structures = await prisma.feeStructure.findMany({
          where: { classId: child.classId }
        });
        const payments = await prisma.feePayment.findMany({
          where: { studentId: child.id }
        });

        const totalDue = structures.reduce((sum, s) => sum + s.amount, 0);
        const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);

        feeStatus = {
          totalDue,
          totalPaid,
          status: totalPaid === 0 && totalDue > 0 ? 'UNPAID' : totalPaid >= totalDue ? 'PAID' : 'PARTIAL'
        };
      }

      childrenData.push({
        id: child.id,
        name: child.user.name,
        photoUrl: child.user.photoUrl,
        rollNo: child.rollNo,
        className: child.class ? `${child.class.name}-${child.class.section}` : 'N/A',
        attendancePercentage,
        feeStatus,
        recentMarks: recentMarks.map(m => ({
          examName: m.exam.name,
          subjectName: m.subject.name,
          marksObtained: m.marksObtained,
          maxMarks: m.maxMarks,
          grade: m.grade
        }))
      });
    }

    // Announcements
    const announcements = await prisma.announcement.findMany({
      take: 5,
      where: {
        isActive: true,
        targetRoles: { contains: Role.PARENT }
      },
      orderBy: { createdAt: 'desc' }
    });

    successResponse(res, {
      children: childrenData,
      announcements
    }, 'Parent dashboard data fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getAccountantDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const revenueResult = await prisma.feePayment.aggregate({
      _sum: { amountPaid: true }
    });
    const totalCollected = revenueResult._sum.amountPaid || 0;

    const structures = await prisma.feeStructure.findMany({
      include: { class: { include: { _count: { select: { students: true } } } } }
    });
    let totalExpected = 0;
    structures.forEach(fs => {
      const studentCount = fs.class?._count.students || 0;
      totalExpected += fs.amount * studentCount;
    });

    const pendingDues = Math.max(0, totalExpected - totalCollected);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const payments = await prisma.feePayment.findMany({
      where: { paymentDate: { gte: twelveMonthsAgo } }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCollectionMap: { [key: string]: number } = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      monthlyCollectionMap[key] = 0;
    }

    payments.forEach(p => {
      const d = new Date(p.paymentDate);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyCollectionMap[key] !== undefined) {
        monthlyCollectionMap[key] += p.amountPaid;
      }
    });

    const monthlyCollection = Object.keys(monthlyCollectionMap)
      .map(month => ({ month, amount: monthlyCollectionMap[month] }))
      .reverse();

    const cashCount = await prisma.feePayment.count({ where: { method: 'CASH' } });
    const onlineCount = await prisma.feePayment.count({ where: { method: 'ONLINE' } });
    const bankTransferCount = await prisma.feePayment.count({ where: { method: 'BANK_TRANSFER' } });
    const chequeCount = await prisma.feePayment.count({ where: { method: 'CHEQUE' } });

    const paymentModes = {
      cash: cashCount,
      online: onlineCount,
      bankTransfer: bankTransferCount,
      cheque: chequeCount
    };

    const recentPayments = await prisma.feePayment.findMany({
      take: 8,
      orderBy: { paymentDate: 'desc' },
      include: {
        student: { include: { user: { select: { name: true } } } },
        feeStructure: { select: { name: true } }
      }
    });

    const now = new Date();
    const overdueInvoicesCount = await prisma.feeStructure.count({
      where: { dueDate: { lt: now } }
    });

    // Top 5 overdue payments
    const overduePayments: any[] = [];
    const pastStructures = await prisma.feeStructure.findMany({
      where: { dueDate: { lt: now } },
      take: 5,
      include: { class: { select: { name: true, section: true } } }
    });
    for (const struct of pastStructures) {
      const studentsInClass = await prisma.student.findMany({
        where: { classId: struct.classId },
        include: { user: { select: { name: true } } }
      });
      for (const stud of studentsInClass) {
        const paidSum = await prisma.feePayment.aggregate({
          where: { studentId: stud.id, feeStructureId: struct.id },
          _sum: { amountPaid: true }
        });
        const paid = paidSum._sum.amountPaid || 0;
        if (paid < struct.amount) {
          overduePayments.push({
            studentId: stud.id,
            studentName: stud.user.name,
            rollNo: stud.rollNo,
            className: `${struct.class.name}-${struct.class.section}`,
            feeName: struct.name,
            amountDue: struct.amount - paid,
            dueDate: struct.dueDate
          });
        }
        if (overduePayments.length >= 5) break;
      }
      if (overduePayments.length >= 5) break;
    }

    // Fee Structure Collection Summary
    const structureSummary: any[] = [];
    const activeStructures = await prisma.feeStructure.findMany({
      include: { class: { select: { name: true, section: true } } }
    });
    for (const fs of activeStructures) {
      const totalPaid = await prisma.feePayment.aggregate({
        where: { feeStructureId: fs.id },
        _sum: { amountPaid: true }
      });
      const collected = totalPaid._sum.amountPaid || 0;
      const studentsCount = await prisma.student.count({ where: { classId: fs.classId } });
      const target = fs.amount * studentsCount;
      const pending = Math.max(0, target - collected);

      structureSummary.push({
        id: fs.id,
        name: fs.name,
        className: fs.class ? `${fs.class.name}-${fs.class.section}` : 'N/A',
        collected,
        pending,
        target
      });
    }

    successResponse(res, {
      totalCollected,
      pendingDues,
      totalExpected,
      monthlyCollection,
      paymentModes,
      recentPayments,
      overdueInvoicesCount,
      overduePayments,
      structureSummary
    }, 'Accountant dashboard data fetched successfully');
  } catch (error) {
    next(error);
  }
};
