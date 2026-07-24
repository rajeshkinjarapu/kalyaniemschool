import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllGeneratedPapers = async (req: Request, res: Response) => {
  try {
    const papers = await prisma.generatedPaper.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(papers);
  } catch (error) {
    console.error('Error fetching generated papers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getGeneratedPaperById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const paper = await prisma.generatedPaper.findUnique({
      where: { id }
    });
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }
    res.json(paper);
  } catch (error) {
    console.error('Error fetching generated paper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createGeneratedPaper = async (req: Request, res: Response) => {
  try {
    const { examName, examSubject, examDate, time, instructions, content } = req.body;
    const paper = await prisma.generatedPaper.create({
      data: {
        examName,
        examSubject,
        examDate,
        time,
        instructions: Array.isArray(instructions) ? JSON.stringify(instructions) : instructions,
        content
      }
    });
    res.status(201).json(paper);
  } catch (error) {
    console.error('Error creating generated paper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateGeneratedPaper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { examName, examSubject, examDate, time, instructions, content } = req.body;
    
    const paper = await prisma.generatedPaper.update({
      where: { id },
      data: {
        examName,
        examSubject,
        examDate,
        time,
        instructions: Array.isArray(instructions) ? JSON.stringify(instructions) : instructions,
        content
      }
    });
    res.json(paper);
  } catch (error) {
    console.error('Error updating generated paper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteGeneratedPaper = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.generatedPaper.delete({
      where: { id }
    });
    res.json({ message: 'Generated paper deleted successfully' });
  } catch (error) {
    console.error('Error deleting generated paper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
