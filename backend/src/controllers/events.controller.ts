import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../utils/prisma';
import { successResponse } from '../utils/response';
import { Role } from '../types/enums';

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const role = req.user?.role;

    const where: any = {};

    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    if (role && role !== Role.SUPER_ADMIN && role !== Role.ADMIN) {
      where.targetRoles = {
        has: role
      };
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' }
    });

    successResponse(res, events, 'Events fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, startDate, endDate, allDay, targetRoles } = req.body;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        allDay: allDay || false,
        targetRoles: targetRoles || [Role.STUDENT, Role.TEACHER]
      }
    });

    successResponse(res, event, 'Event created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, description, startDate, endDate, allDay, targetRoles } = req.body;

    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        allDay: allDay !== undefined ? allDay : undefined,
        targetRoles: targetRoles || undefined
      }
    });

    successResponse(res, event, 'Event updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    await prisma.event.delete({ where: { id } });

    successResponse(res, null, 'Event deleted successfully');
  } catch (error) {
    next(error);
  }
};
