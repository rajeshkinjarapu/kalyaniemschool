import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse, paginatedResponse } from '../utils/response';
import * as XLSX from 'xlsx';

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = (req.query.search as string) || '';
  const academicYear = (req.query.academicYear as string) || '';
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) where.name = { contains: search };
  if (academicYear) where.academicYear = academicYear;

  const [classes, total] = await Promise.all([
    prisma.class.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ name: 'asc' }, { section: 'asc' }],
      include: {
        _count: { select: { students: true } },
        classTeacher: { include: { user: { select: { name: true } } } },
      },
    }),
    prisma.class.count({ where }),
  ]);

  paginatedResponse(res, classes, total, page, limit, 'Classes fetched');
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      students: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { rollNo: 'asc' },
      },
      subjects: true,
      classSubjectTeachers: {
        include: {
          subject: true,
          teacher: { include: { user: { select: { name: true } } } },
        },
      },
      classTeacher: { include: { user: { select: { name: true } } } },
    },
  });
  if (!cls) return next(createError('Class not found', 404));
  successResponse(res, cls, 'Class fetched');
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { name, section, academicYear, capacity, classTeacherId } = req.body;

  const existing = await prisma.class.findFirst({ where: { name, section: section || '', academicYear } });
  if (existing) return next(createError('Class already exists', 409));

  const cls = await prisma.class.create({
    data: { name, section: section || '', academicYear, capacity: capacity || 40, classTeacherId: classTeacherId || null },
  });
  successResponse(res, cls, 'Class created', 201);
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { name, section, academicYear, capacity, classTeacherId } = req.body;

  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) return next(createError('Class not found', 404));

  const cls = await prisma.class.update({
    where: { id },
    data: { name, section: section !== undefined ? section || '' : undefined, academicYear, capacity, classTeacherId: classTeacherId !== undefined ? classTeacherId || null : undefined },
  });
  successResponse(res, cls, 'Class updated');
};

export const deleteClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) return next(createError('Class not found', 404));

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Unassign all students from this class
      await tx.student.updateMany({
        where: { classId: id },
        data: { classId: null },
      });

      // 2. Delete all ClassSubjectTeacher mapping for this class
      await tx.classSubjectTeacher.deleteMany({
        where: { classId: id },
      });

      // 3. Delete all Timetable slots for this class
      await tx.timetable.deleteMany({
        where: { classId: id },
      });

      // 4. Delete all Attendance records for this class
      await tx.attendance.deleteMany({
        where: { classId: id },
      });

      // 5. Delete all Exam marks and Exams for this class
      const exams = await tx.exam.findMany({
        where: { classId: id },
        select: { id: true },
      });
      const examIds = exams.map(e => e.id);
      if (examIds.length > 0) {
        await tx.mark.deleteMany({
          where: { examId: { in: examIds } },
        });
      }
      await tx.exam.deleteMany({
        where: { classId: id },
      });

      // 6. Delete all FeePayments and FeeStructures for this class
      const feeStructures = await tx.feeStructure.findMany({
        where: { classId: id },
        select: { id: true },
      });
      const feeStructureIds = feeStructures.map(f => f.id);
      if (feeStructureIds.length > 0) {
        await tx.feePayment.deleteMany({
          where: { feeStructureId: { in: feeStructureIds } },
        });
      }
      await tx.feeStructure.deleteMany({
        where: { classId: id },
      });

      // 7. Delete all Subjects for this class
      await tx.subject.deleteMany({
        where: { classId: id },
      });

      // 8. Finally delete the Class itself
      await tx.class.delete({
        where: { id },
      });
    });

    successResponse(res, null, 'Class deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getStudents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) return next(createError('Class not found', 404));

  const students = await prisma.student.findMany({
    where: { classId: id },
    include: { user: { select: { name: true, email: true, phone: true, photoUrl: true } } },
    orderBy: { rollNo: 'asc' },
  });
  successResponse(res, students, 'Class students fetched');
};

export const getSubjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) return next(createError('Class not found', 404));

  const subjects = await prisma.subject.findMany({
    where: { classId: id },
    include: {
      classSubjectTeachers: {
        where: { classId: id },
        include: { teacher: { include: { user: { select: { name: true } } } } },
      },
    },
  });
  successResponse(res, subjects, 'Class subjects fetched');
};

export const bulkImport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) return next(createError('Excel or CSV file required', 400));

  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const results = XLSX.utils.sheet_to_json<any>(sheet);

    let success = 0;
    const failed: any[] = [];

    for (const row of results) {
      try {
        const name = row.Name || row.name || String(row.Class || row.class);
        const section = row.Section || row.section || '';
        const academicYear = row['Academic Year'] || row.academicYear || '2024-2025';
        const capacity = parseInt(row.Capacity || row.capacity) || 40;

        if (!name) {
          failed.push({ row, reason: 'Class Name is required' });
          continue;
        }

        const existing = await prisma.class.findFirst({ where: { name, section, academicYear } });
        if (existing) {
          failed.push({ row, reason: 'Class already exists' });
          continue;
        }

        await prisma.class.create({
          data: { name, section, academicYear, capacity },
        });
        success++;
      } catch (e: any) {
        failed.push({ row, reason: e.message });
      }
    }

    try {
      require('fs').unlinkSync(filePath);
    } catch (e) {
      console.error('Failed to delete uploaded file', e);
    }

    successResponse(res, { success, failed, total: results.length }, 'Bulk import completed');
  } catch (error) {
    next(createError('Failed to process file', 500));
  }
};
