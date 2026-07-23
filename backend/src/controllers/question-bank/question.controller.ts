import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';
import { AuthRequest } from '../../middlewares/auth';

// Get questions with advanced filtering, searching, and pagination
export const getQuestions = async (req: Request, res: Response) => {
  try {
    const { subject, chapter, topic, type, difficulty, search, tag } = req.query;

    const where: any = {};

    if (subject) where.subject = String(subject);
    if (chapter) where.chapter = String(chapter);
    if (topic) where.topic = String(topic);
    if (type) where.type = String(type);
    if (difficulty) where.difficulty = String(difficulty);

    if (tag) {
      where.tags = {
        contains: String(tag),
      };
    }

    if (search) {
      where.OR = [
        { questionText: { contains: String(search) } },
        { chapter: { contains: String(search) } },
        { topic: { contains: String(search) } },
        { tags: { contains: String(search) } },
      ];
    }

    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ questions });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({ error: 'Internal server error fetching questions' });
  }
};

export const getQuestionById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    return res.json({ question });
  } catch (error: any) {
    console.error('Error fetching question:', error);
    return res.status(500).json({ error: 'Internal server error fetching question' });
  }
};

export const createQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const {
      subject,
      chapter,
      topic,
      type,
      difficulty,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      solution,
      marks,
      negativeMarks,
      imageUrl,
      tags,
    } = req.body;

    if (!subject || !chapter || !topic || !type || !difficulty || !questionText || !correctAnswer || !solution) {
      return res.status(400).json({ error: 'Missing required question fields' });
    }

    const newQuestion = await prisma.question.create({
      data: {
        subject,
        chapter,
        topic,
        type,
        difficulty,
        questionText,
        optionA: type.startsWith('MCQ') ? optionA : null,
        optionB: type.startsWith('MCQ') ? optionB : null,
        optionC: type.startsWith('MCQ') ? optionC : null,
        optionD: type.startsWith('MCQ') ? optionD : null,
        correctAnswer,
        solution,
        marks: marks ? parseInt(marks) : 4,
        negativeMarks: negativeMarks ? parseInt(negativeMarks) : -1,
        imageUrl: imageUrl || null,
        tags: tags || '',
        createdById: req.user?.id,
      },
    });

    return res.status(201).json({ message: 'Question created successfully', question: newQuestion });
  } catch (error: any) {
    console.error('Error creating question:', error);
    return res.status(500).json({ error: 'Internal server error creating question' });
  }
};

export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    const {
      subject,
      chapter,
      topic,
      type,
      difficulty,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      solution,
      marks,
      negativeMarks,
      imageUrl,
      tags,
    } = req.body;

    const existingQuestion = await prisma.question.findUnique({ where: { id } });
    if (!existingQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        subject: subject ?? existingQuestion.subject,
        chapter: chapter ?? existingQuestion.chapter,
        topic: topic ?? existingQuestion.topic,
        type: type ?? existingQuestion.type,
        difficulty: difficulty ?? existingQuestion.difficulty,
        questionText: questionText ?? existingQuestion.questionText,
        optionA: type && !type.startsWith('MCQ') ? null : (optionA ?? existingQuestion.optionA),
        optionB: type && !type.startsWith('MCQ') ? null : (optionB ?? existingQuestion.optionB),
        optionC: type && !type.startsWith('MCQ') ? null : (optionC ?? existingQuestion.optionC),
        optionD: type && !type.startsWith('MCQ') ? null : (optionD ?? existingQuestion.optionD),
        correctAnswer: correctAnswer ?? existingQuestion.correctAnswer,
        solution: solution ?? existingQuestion.solution,
        marks: marks !== undefined ? parseInt(marks) : existingQuestion.marks,
        negativeMarks: negativeMarks !== undefined ? parseInt(negativeMarks) : existingQuestion.negativeMarks,
        imageUrl: imageUrl !== undefined ? imageUrl : existingQuestion.imageUrl,
        tags: tags ?? existingQuestion.tags,
      },
    });

    return res.json({ message: 'Question updated successfully', question: updatedQuestion });
  } catch (error: any) {
    console.error('Error updating question:', error);
    return res.status(500).json({ error: 'Internal server error updating question' });
  }
};

export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    const existingQuestion = await prisma.question.findUnique({ where: { id } });
    if (!existingQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await prisma.question.delete({ where: { id } });
    return res.json({ message: 'Question deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting question:', error);
    return res.status(500).json({ error: 'Internal server error deleting question' });
  }
};

// Retrieve unique chapters/topics by subject
export const getQuestionMeta = async (req: Request, res: Response) => {
  try {
    const questions = await prisma.question.findMany({
      select: {
        subject: true,
        chapter: true,
        topic: true,
      },
    });

    // Group items by subject
    const subjectsMeta: { [key: string]: { chapters: Set<string>; topics: Set<string> } } = {
      Physics: { chapters: new Set(), topics: new Set() },
      Chemistry: { chapters: new Set(), topics: new Set() },
      Mathematics: { chapters: new Set(), topics: new Set() },
    };

    questions.forEach((q) => {
      const sub = q.subject;
      if (subjectsMeta[sub]) {
        subjectsMeta[sub].chapters.add(q.chapter);
        subjectsMeta[sub].topics.add(q.topic);
      }
    });

    const meta = Object.keys(subjectsMeta).reduce((acc: any, key) => {
      acc[key] = {
        chapters: Array.from(subjectsMeta[key].chapters),
        topics: Array.from(subjectsMeta[key].topics),
      };
      return acc;
    }, {});

    return res.json({ meta });
  } catch (error: any) {
    console.error('Error fetching question metadata:', error);
    return res.status(500).json({ error: 'Internal server error fetching metadata' });
  }
};
export const bulkCreateQuestions = async (req: Request, res: Response) => {
  try {
    const { questions } = req.body;
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'Questions array is required.' });
    }

    // Assign createdBy if available
    const questionsToInsert = questions.map(q => ({
      ...q,
      createdById: (req as any).user?.id || undefined,
      tags: q.tags || 'AI-Generated',
    }));

    const result = await prisma.question.createMany({
      data: questionsToInsert,
    });

    return res.status(201).json({ message: `Successfully created ${result.count} questions.` });
  } catch (error: any) {
    console.error('Bulk create error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};
