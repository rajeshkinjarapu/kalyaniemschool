import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse, paginatedResponse } from '../utils/response';
import bcrypt from 'bcryptjs';

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || '';
  const role = (req.query.role as string) || '';
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true,
        phone: true, photoUrl: true, isActive: true, createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  paginatedResponse(res, users, total, page, limit, 'Users fetched');
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true,
      phone: true, photoUrl: true, isActive: true, createdAt: true,
    },
  });
  if (!user) return next(createError('User not found', 404));
  successResponse(res, user, 'User fetched');
};

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password || !role) {
    return next(createError('Name, email, password and role are required', 400));
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return next(createError('Email / User ID already exists', 409));

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      phone,
    },
    select: { id: true, name: true, email: true, role: true, phone: true, isActive: true }
  });

  if (role === 'TEACHER') {
    const count = await prisma.teacher.count();
    const year = new Date().getFullYear().toString().slice(-2);
    const employeeId = `EMP${year}${String(count + 1).padStart(4, '0')}`;
    await prisma.teacher.create({
      data: {
        userId: user.id,
        employeeId,
      }
    });
  } else if (role === 'STUDENT') {
    const count = await prisma.student.count();
    const year = new Date().getFullYear().toString().slice(-2);
    const rollNo = `JY${year}-${String(count + 1).padStart(4, '0')}`;
    await prisma.student.create({
      data: {
        userId: user.id,
        rollNo,
      }
    });
  }

  successResponse(res, user, 'User created successfully', 201);
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { name, email, password, role, phone, photoUrl } = req.body;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return next(createError('User not found', 404));

  if (email && email !== existing.email) {
    const duplicate = await prisma.user.findFirst({ where: { email, NOT: { id } } });
    if (duplicate) return next(createError('Email / User ID already in use', 409));
  }

  const updateData: any = { name, phone, photoUrl };
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (password) {
    updateData.password = await bcrypt.hash(password, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, phone: true, photoUrl: true, isActive: true },
  });

  if (role && role !== existing.role) {
    if (role === 'TEACHER') {
      const hasTeacher = await prisma.teacher.findUnique({ where: { userId: id } });
      if (!hasTeacher) {
        const count = await prisma.teacher.count();
        const year = new Date().getFullYear().toString().slice(-2);
        await prisma.teacher.create({ data: { userId: id, employeeId: `EMP${year}${String(count + 1).padStart(4, '0')}` } });
      }
    } else if (role === 'STUDENT') {
      const hasStudent = await prisma.student.findUnique({ where: { userId: id } });
      if (!hasStudent) {
        const count = await prisma.student.count();
        const year = new Date().getFullYear().toString().slice(-2);
        await prisma.student.create({ data: { userId: id, rollNo: `JY${year}-${String(count + 1).padStart(4, '0')}` } });
      }
    }
  }

  successResponse(res, user, 'User updated successfully');
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return next(createError('User not found', 404));
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  successResponse(res, null, 'User deactivated');
};
