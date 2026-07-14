import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllSlipTests = async (req: Request, res: Response) => {
  try {
    const slipTests = await prisma.slipTest.findMany({
      include: {
        class: true,
        subject: true,
        marks: {
          include: { student: { include: { user: true } } }
        }
      },
      orderBy: { date: 'desc' }
    });
    res.json(slipTests);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createSlipTest = async (req: Request, res: Response) => {
  try {
    const { name, date, maxMarks, classId, subjectId } = req.body;
    const slipTest = await prisma.slipTest.create({
      data: {
        name,
        date: new Date(date),
        maxMarks: Number(maxMarks) || 25,
        classId,
        subjectId
      },
      include: {
        class: true,
        subject: true
      }
    });
    res.status(201).json(slipTest);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteSlipTest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.slipTest.delete({ where: { id } });
    res.json({ message: 'Slip Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateSlipTestMarks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { marks } = req.body; // marks is an array of { studentId, marksObtained }
    
    // Use transaction to delete old and insert new
    await prisma.$transaction(async (tx) => {
      await tx.slipTestMark.deleteMany({ where: { slipTestId: id } });
      if (marks && marks.length > 0) {
        await tx.slipTestMark.createMany({
          data: marks.map((m: any) => ({
            slipTestId: id,
            studentId: m.studentId,
            marksObtained: Number(m.marksObtained)
          }))
        });
      }
    });

    res.json({ message: 'Marks updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
