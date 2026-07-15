import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse, paginatedResponse } from '../utils/response';

const getGatePassFilters = (req: AuthRequest) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = (req.query.status as string) || '';
  const skip = (page - 1) * limit;
  const where: any = {};

  if (status) where.status = status;

  return { page, limit, skip, where };
};

export const listGatePasses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip, where } = getGatePassFilters(req);
    const user = req.user!;

    if (user.role === 'STUDENT') {
      const student = await prisma.student.findFirst({ where: { userId: user.id } });
      where.studentId = student?.id;
    } else if (user.role === 'TEACHER') {
      where.requesterId = user.id;
    }

    const [items, total] = await Promise.all([
      prisma.gatePass.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
          student: { include: { user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } }, class: true } },
          approvedBy: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
        },
      }),
      prisma.gatePass.count({ where }),
    ]);

    paginatedResponse(res, items, total, page, limit, 'Gate passes fetched');
  } catch (error) {
    next(error);
  }
};

export const createGatePass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { reason, destination, exitTime, returnTime, notes, requestType, studentId } = req.body;

    const studentRecord = studentId ? await prisma.student.findUnique({ where: { id: studentId } }) : null;
    if (studentId && !studentRecord) return next(createError('Student not found', 404));

    const slipNumber = `GP-${Date.now().toString().slice(-6)}`;

    const gatePass = await prisma.gatePass.create({
      data: {
        requesterId: user.id,
        studentId: studentRecord?.id || null,
        requestType: requestType || (user.role === 'TEACHER' ? 'TEACHER' : 'STUDENT'),
        reason,
        destination,
        exitTime,
        returnTime,
        notes,
        slipNumber,
      },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
        student: { include: { user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } }, class: true } },
      },
    });

    successResponse(res, gatePass, 'Gate pass requested successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateGatePass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const user = req.user!;

    const gatePass = await prisma.gatePass.findUnique({ where: { id } });
    if (!gatePass) return next(createError('Gate pass not found', 404));

    const updated = await prisma.gatePass.update({
      where: { id },
      data: {
        status,
        approvedById: user.id,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
        student: { include: { user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } }, class: true } },
        approvedBy: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
      },
    });

    successResponse(res, updated, 'Gate pass updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getGatePassById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const gatePass = await prisma.gatePass.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
        student: { include: { user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } }, class: true } },
        approvedBy: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
      },
    });

    if (!gatePass) return next(createError('Gate pass not found', 404));
    successResponse(res, gatePass, 'Gate pass fetched');
  } catch (error) {
    next(error);
  }
};
