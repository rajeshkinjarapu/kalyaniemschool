import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllQuestionPapers = async (req: Request, res: Response) => {
  try {
    const papers = await prisma.questionPaper.findMany({
      include: {
        class: true,
        subject: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(papers);
  } catch (error) {
    console.error('Error fetching question papers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createQuestionPaper = async (req: Request, res: Response) => {
  try {
    const { title, classId, subjectId, fileUrl } = req.body;

    const paper = await prisma.questionPaper.create({
      data: {
        title,
        classId,
        subjectId,
        fileUrl
      },
      include: {
        class: true,
        subject: true
      }
    });

    res.status(201).json(paper);
  } catch (error) {
    console.error('Error creating question paper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteQuestionPaper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.questionPaper.delete({
      where: { id }
    });
    res.json({ message: 'Question paper deleted successfully' });
  } catch (error) {
    console.error('Error deleting question paper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
