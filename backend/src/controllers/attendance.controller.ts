import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';
import { Role } from '../types/enums';

export const getByClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { classId, date } = req.query as { classId: string; date: string };
  if (!classId || !date) return next(createError('classId and date are required', 400));

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return next(createError('Class not found', 404));

  const targetDate = new Date(date);
  const students = await prisma.student.findMany({
    where: { classId },
    include: {
      user: { select: { name: true, photoUrl: true } },
      attendance: {
        where: { date: targetDate },
        take: 1,
      },
    },
    orderBy: { rollNo: 'asc' },
  });

  const result = students.map((s) => ({
    studentId: s.id,
    rollNo: s.rollNo,
    name: s.user.name,
    photoUrl: s.user.photoUrl,
    attendance: s.attendance[0] || null,
    status: s.attendance[0]?.status || null,
  }));

  successResponse(res, result, 'Attendance fetched');
};

export const getByStudent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { studentId, startDate, endDate } = req.query as { studentId: string; startDate?: string; endDate?: string };
  if (!studentId) return next(createError('studentId is required', 400));

  if (req.user?.role === Role.STUDENT) {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student || student.id !== studentId) return next(createError('You do not have permission to view this attendance', 403));
  }

  const where: any = { studentId };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const attendance = await prisma.attendance.findMany({
    where,
    orderBy: { date: 'desc' },
  });
  successResponse(res, attendance, 'Attendance fetched');
};

export const markBulk = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { classId, date, records } = req.body as {
    classId: string;
    date: string;
    records: { studentId: string; status: string; note?: string }[];
  };

  if (!classId || !date || !records?.length) return next(createError('classId, date, and records are required', 400));

  const teacher = await prisma.teacher.findFirst({ where: { userId: req.user!.id } });
  const targetDate = new Date(date);

  const upsertOps = records.map((r) =>
    prisma.attendance.upsert({
      where: { studentId_date: { studentId: r.studentId, date: targetDate } },
      update: { status: r.status as any, note: r.note, markedById: req.user!.id, teacherId: teacher?.id || null },
      create: {
        studentId: r.studentId,
        classId,
        date: targetDate,
        status: r.status as any,
        note: r.note,
        markedById: req.user!.id,
        teacherId: teacher?.id || null,
      },
    })
  );

  await prisma.$transaction(upsertOps);
  successResponse(res, null, `Attendance marked for ${records.length} students`);
};

export const getReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { classId, studentId, startDate, endDate } = req.query as {
    classId?: string; studentId?: string; startDate: string; endDate: string;
  };
  if (!startDate || !endDate) return next(createError('startDate and endDate are required', 400));

  const where: any = {
    date: { gte: new Date(startDate), lte: new Date(endDate) },
  };
  if (classId) where.classId = classId;
  if (studentId) where.studentId = studentId;

  const records = await prisma.attendance.findMany({
    where,
    include: { student: { include: { user: { select: { name: true } } } } },
  });

  // Group by student
  const map = new Map<string, { studentId: string; name: string; rollNo: string; total: number; present: number; absent: number; late: number; excused: number }>();
  for (const r of records) {
    const key = r.studentId;
    if (!map.has(key)) {
      map.set(key, { studentId: key, name: r.student.user.name, rollNo: r.student.rollNo, total: 0, present: 0, absent: 0, late: 0, excused: 0 });
    }
    const entry = map.get(key)!;
    entry.total++;
    if (r.status === 'PRESENT') entry.present++;
    else if (r.status === 'ABSENT') entry.absent++;
    else if (r.status === 'LATE') entry.late++;
    else if (r.status === 'EXCUSED') entry.excused++;
  }

  const result = Array.from(map.values()).map((e) => ({
    ...e,
    percentage: e.total > 0 ? parseFloat(((e.present / e.total) * 100).toFixed(2)) : 0,
  }));

  successResponse(res, result, 'Attendance report generated');
};

export const getSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { classId, month, year } = req.query as { classId: string; month: string; year: string };
  if (!classId || !month || !year) return next(createError('classId, month, and year are required', 400));

  const m = parseInt(month) - 1;
  const y = parseInt(year);
  const startDate = new Date(y, m, 1);
  const endDate = new Date(y, m + 1, 0, 23, 59, 59);

  const records = await prisma.attendance.findMany({
    where: { classId, date: { gte: startDate, lte: endDate } },
    orderBy: { date: 'asc' },
  });

  // Group by date
  const dayMap = new Map<string, { date: string; present: number; absent: number; late: number; excused: number; total: number }>();
  for (const r of records) {
    const dateStr = r.date.toISOString().split('T')[0];
    if (!dayMap.has(dateStr)) {
      dayMap.set(dateStr, { date: dateStr, present: 0, absent: 0, late: 0, excused: 0, total: 0 });
    }
    const entry = dayMap.get(dateStr)!;
    entry.total++;
    if (r.status === 'PRESENT') entry.present++;
    else if (r.status === 'ABSENT') entry.absent++;
    else if (r.status === 'LATE') entry.late++;
    else if (r.status === 'EXCUSED') entry.excused++;
  }

  successResponse(res, Array.from(dayMap.values()), 'Summary fetched');
};

export const getDailySummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { date } = req.query as { date: string };
  if (!date) return next(createError('date is required', 400));

  const targetDate = new Date(date);
  targetDate.setUTCHours(0,0,0,0);
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const records = await prisma.attendance.findMany({
    where: { date: { gte: targetDate, lt: nextDate } },
    include: {
      class: { select: { id: true, name: true, section: true } },
    },
  });

  const classMap = new Map<string, { classId: string; className: string; total: number; present: number; absent: number; late: number; excused: number }>();
  
  // Initialize with all classes to show 0 if no records
  const allClasses = await prisma.class.findMany({ select: { id: true, name: true, section: true, _count: { select: { students: true } } }});
  
  for (const cls of allClasses) {
    classMap.set(cls.id, {
      classId: cls.id,
      className: `${cls.name}-${cls.section}`,
      total: cls._count.students, // Using total students enrolled as base
      present: 0,
      absent: 0,
      late: 0,
      excused: 0
    });
  }

  for (const r of records) {
    if (r.classId) {
      const entry = classMap.get(r.classId);
      if (entry) {
        if (r.status === 'PRESENT') entry.present++;
        else if (r.status === 'ABSENT') entry.absent++;
        else if (r.status === 'LATE') entry.late++;
        else if (r.status === 'EXCUSED') entry.excused++;
      }
    }
  }

  // Adjust absent counts for students who weren't marked
  for (const entry of Array.from(classMap.values())) {
    const totalMarked = entry.present + entry.absent + entry.late + entry.excused;
    if (totalMarked < entry.total) {
      entry.absent += (entry.total - totalMarked);
    }
  }

  successResponse(res, Array.from(classMap.values()), 'Daily summary fetched');
};
