import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';
import { calculateGrade } from '../utils/helpers';

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  const classId = (req.query.classId as string) || '';
  const term = (req.query.term as string) || '';

  const where: any = {};
  if (classId) where.classId = classId;
  if (term) where.term = term;

  const exams = await prisma.exam.findMany({
    where,
    include: {
      class: { select: { name: true, section: true } },
      _count: { select: { marks: true } },
    },
    orderBy: { examDate: 'desc' },
  });
  successResponse(res, exams, 'Exams fetched');
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      class: { select: { name: true, section: true } },
      marks: {
        include: {
          student: { include: { user: { select: { name: true } } } },
          subject: { select: { name: true } },
        },
      },
    },
  });
  if (!exam) return next(createError('Exam not found', 404));
  successResponse(res, exam, 'Exam fetched');
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, classIds, term, examDate, maxMarks, passingMarks, subjects } = req.body;

    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      return next(createError('Please provide at least one class', 400));
    }

    // Deduplicate classIds just in case frontend sent duplicates
    const uniqueClassIds = [...new Set(classIds)];

    // Verify all classes exist
    const classes = await prisma.class.findMany({ where: { id: { in: uniqueClassIds } } });
    if (classes.length !== uniqueClassIds.length) {
      return next(createError('One or more classes not found', 404));
    }

    // Create an exam for each selected class
    const createdExams = [];
    for (const classId of uniqueClassIds) {
      const exam = await prisma.exam.create({
        data: {
          name,
          classId,
          term: term || '',
          examDate: new Date(examDate),
          maxMarks: maxMarks || 100,
          passingMarks: passingMarks || 40,
          subjects: subjects || [],
        },
      });
      createdExams.push(exam);
    }

    successResponse(res, createdExams, 'Exams created', 201);
  } catch (error: any) {
    console.error("EXAM CREATE ERROR:", error);
    next(error);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { name, term, examDate, maxMarks, passingMarks, subjects } = req.body;

  const existing = await prisma.exam.findUnique({ where: { id } });
  if (!existing) return next(createError('Exam not found', 404));

  const exam = await prisma.exam.update({
    where: { id },
    data: {
      name, term,
      examDate: examDate ? new Date(examDate) : undefined,
      maxMarks, passingMarks,
      subjects: subjects !== undefined ? subjects : existing.subjects,
    },
  });
  successResponse(res, exam, 'Exam updated');
};

export const deleteExam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const existing = await prisma.exam.findUnique({ where: { id } });
  if (!existing) return next(createError('Exam not found', 404));
  await prisma.exam.delete({ where: { id } });
  successResponse(res, null, 'Exam deleted');
};

export const getResults = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      marks: {
        include: {
          student: { include: { user: { select: { name: true } } } },
          subject: { select: { name: true, code: true } },
        },
      },
    },
  }) as any;
  if (!exam) return next(createError('Exam not found', 404));

  // Group marks by student
  const studentMap = new Map<string, { studentId: string; name: string; rollNo: string; marks: any[]; total: number; percentage: number; grade: string }>();
  for (const mark of exam.marks) {
    const key = mark.studentId;
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        studentId: key,
        name: mark.student.user.name,
        rollNo: mark.student.rollNo,
        marks: [],
        total: 0,
        percentage: 0,
        grade: '',
      });
    }
    const entry = studentMap.get(key)!;
    entry.marks.push({ subject: mark.subject.name, obtained: mark.marksObtained, max: mark.maxMarks, grade: mark.grade });
    entry.total += mark.marksObtained;
  }

  const results = Array.from(studentMap.values()).map((s) => {
    const totalMax = s.marks.reduce((sum, m) => sum + m.max, 0);
    const percentage = totalMax > 0 ? parseFloat(((s.total / totalMax) * 100).toFixed(2)) : 0;
    return { ...s, percentage, grade: calculateGrade(s.total, totalMax) };
  });

  // Sort by total desc and add rank
  results.sort((a, b) => b.total - a.total);
  const ranked = results.map((r, i) => ({ ...r, rank: i + 1 }));

  successResponse(res, ranked, 'Exam results fetched');
};
