import { Response } from 'express';
import { prisma } from '../../utils/prisma';
import { AuthRequest } from '../../middlewares/auth';

// Get all papers
export const getPapers = async (req: AuthRequest, res: Response) => {
  try {
    const papers = await prisma.paper.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { name: true, role: true },
        },
      },
    });
    return res.json({ papers });
  } catch (error: any) {
    console.error('Error fetching papers:', error);
    return res.status(500).json({ error: 'Internal server error fetching papers' });
  }
};

// Get a single paper by ID and populate its sections with complete Question objects
export const getPaperById = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid paper ID' });
    }

    const paper = await prisma.paper.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { name: true, role: true },
        },
      },
    });

    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    // Parse sections
    const sections = JSON.parse(paper.sectionsJson);

    // Fetch all unique question IDs in the paper
    const allQuestionIds: number[] = [];
    sections.forEach((sec: any) => {
      if (Array.isArray(sec.questionIds)) {
        allQuestionIds.push(...sec.questionIds.map((id: any) => parseInt(id)));
      }
    });

    // Retrieve questions from database
    const questions = await prisma.question.findMany({
      where: {
        id: { in: allQuestionIds },
      },
    });

    // Map questions by ID for quick lookup
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Reconstruct sections with full question data
    const populatedSections = sections.map((sec: any) => {
      const fullQuestions = (sec.questionIds || [])
        .map((qid: any) => questionMap.get(parseInt(qid)))
        .filter((q: any) => q !== undefined);

      return {
        ...sec,
        questions: fullQuestions,
      };
    });

    return res.json({
      ...paper,
      sections: populatedSections,
    });
  } catch (error: any) {
    console.error('Error fetching paper details:', error);
    return res.status(500).json({ error: 'Internal server error fetching paper details' });
  }
};

// Create a paper manually or via auto-generation parameters
export const createPaper = async (req: AuthRequest, res: Response) => {
  try {
    const { title, duration, totalMarks, instructions, examDate, watermark, paperCode, sections, autoGenerate, className, instituteName, subHeader1, subHeader2, logoUrl } = req.body;

    if (!title || !duration || !totalMarks) {
      return res.status(400).json({ error: 'Missing title, duration, or totalMarks' });
    }

    let finalSectionsJson = '';

    if (autoGenerate) {
      // Auto-generation logic using rules
      // e.g. autoGenerate: { subjects: { Physics: 5, Chemistry: 5, Mathematics: 5 }, difficulty: 'mixed' }
      const rules = autoGenerate;
      const subjects = ['Physics', 'Chemistry', 'Mathematics'];
      const generatedSections: any[] = [];

      for (const subject of subjects) {
        const questionCount = rules.subjects?.[subject] || 25; // JEE Mains standard defaults to 25/30 questions per subject
        
        // Single-correct MCQs (Section A in JEE: usually 20 questions)
        const mcqCount = Math.min(Math.round(questionCount * 0.8), 20);
        // Numerical type (Section B in JEE: usually 10 questions, attempt 5)
        const numCount = Math.max(questionCount - mcqCount, 5);

        // Fetch MCQs randomly
        const mcqs = await prisma.question.findMany({
          where: {
            subject,
            type: { in: ['MCQ_SINGLE', 'MCQ_MULTI'] },
          },
          take: mcqCount * 2, // Take a larger pool to shuffle
        });

        // Fetch Numericals randomly
        const numericals = await prisma.question.findMany({
          where: {
            subject,
            type: 'NUMERICAL',
          },
          take: numCount * 2,
        });

        // Shuffle arrays
        const shuffle = (array: any[]) => array.sort(() => 0.5 - Math.random());
        const selectedMcqs = shuffle(mcqs).slice(0, mcqCount);
        const selectedNumericals = shuffle(numericals).slice(0, numCount);

        generatedSections.push({
          id: `${subject.toLowerCase()}_sec_a`,
          name: `${subject} - Section A (Single Correct MCQs)`,
          type: 'MCQ_SINGLE',
          questionIds: selectedMcqs.map((q) => q.id),
        });

        generatedSections.push({
          id: `${subject.toLowerCase()}_sec_b`,
          name: `${subject} - Section B (Numerical Answer Type)`,
          type: 'NUMERICAL',
          questionIds: selectedNumericals.map((q) => q.id),
        });
      }

      finalSectionsJson = JSON.stringify(generatedSections);
    } else {
      // Manual creation from sections passed by the client
      if (!sections || !Array.isArray(sections)) {
        return res.status(400).json({ error: 'Sections array is required for manual paper creation' });
      }

      // Convert sections with complete questions back to standard schema layout (storing only IDs)
      const sanitizedSections = sections.map((sec: any) => ({
        id: sec.id || Math.random().toString(36).substr(2, 9),
        name: sec.name || 'Untitled Section',
        type: sec.type || 'MCQ_SINGLE',
        questionIds: sec.questions
          ? sec.questions.map((q: any) => (typeof q === 'object' ? q.id : q))
          : (sec.questionIds || []),
      }));

      finalSectionsJson = JSON.stringify(sanitizedSections);
    }

    const paper = await prisma.paper.create({
      data: {
        title,
        duration: parseInt(duration),
        totalMarks: parseInt(totalMarks),
        instructions: instructions || 'Please read instructions carefully.',
        examDate: examDate || null,
        watermark: watermark || null,
        paperCode: paperCode || 'SET A',
        sectionsJson: finalSectionsJson,
        className: className || null,
        instituteName: instituteName || null,
        subHeader1: subHeader1 || null,
        subHeader2: subHeader2 || null,
        logoUrl: logoUrl || null,
        createdById: req.user!.id,
      },
    });

    return res.status(201).json({ message: 'Paper created successfully', paper });
  } catch (error: any) {
    console.error('Error creating paper:', error);
    return res.status(500).json({ error: 'Internal server error creating paper' });
  }
};

// Update an existing paper (manual changes or metadata adjustments)
export const updatePaper = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid paper ID' });
    }

    const { title, duration, totalMarks, instructions, examDate, watermark, paperCode, sections, className, instituteName, subHeader1, subHeader2, logoUrl } = req.body;

    const existingPaper = await prisma.paper.findUnique({ where: { id } });
    if (!existingPaper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    let finalSectionsJson = existingPaper.sectionsJson;
    if (sections && Array.isArray(sections)) {
      const sanitizedSections = sections.map((sec: any) => ({
        id: sec.id,
        name: sec.name,
        type: sec.type,
        questionIds: sec.questions
          ? sec.questions.map((q: any) => (typeof q === 'object' ? q.id : q))
          : (sec.questionIds || []),
      }));
      finalSectionsJson = JSON.stringify(sanitizedSections);
    }

    const updatedPaper = await prisma.paper.update({
      where: { id },
      data: {
        title: title ?? existingPaper.title,
        duration: duration !== undefined ? parseInt(duration) : existingPaper.duration,
        totalMarks: totalMarks !== undefined ? parseInt(totalMarks) : existingPaper.totalMarks,
        instructions: instructions ?? existingPaper.instructions,
        examDate: examDate !== undefined ? examDate : existingPaper.examDate,
        watermark: watermark !== undefined ? watermark : existingPaper.watermark,
        paperCode: paperCode ?? existingPaper.paperCode,
        sectionsJson: finalSectionsJson,
        className: className !== undefined ? className : existingPaper.className,
        instituteName: instituteName !== undefined ? instituteName : existingPaper.instituteName,
        subHeader1: subHeader1 !== undefined ? subHeader1 : existingPaper.subHeader1,
        subHeader2: subHeader2 !== undefined ? subHeader2 : existingPaper.subHeader2,
        logoUrl: logoUrl !== undefined ? logoUrl : existingPaper.logoUrl,
      },
    });

    return res.json({ message: 'Paper updated successfully', paper: updatedPaper });
  } catch (error: any) {
    console.error('Error updating paper:', error);
    return res.status(500).json({ error: 'Internal server error updating paper' });
  }
};

// Delete a paper
export const deletePaper = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid paper ID' });
    }

    const existingPaper = await prisma.paper.findUnique({ where: { id } });
    if (!existingPaper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    await prisma.paper.delete({ where: { id } });
    return res.json({ message: 'Paper deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting paper:', error);
    return res.status(500).json({ error: 'Internal server error deleting paper' });
  }
};

// Scramble a paper to generate Set A, B, C, or D deterministically or randomly
// Shuffles question order within sections AND shuffles options for MCQs (with tracking of the correct key)
export const getScrambledPaperSet = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const setCode = String(req.query.set || 'A').toUpperCase(); // A, B, C, or D

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid paper ID' });
    }

    const paper = await prisma.paper.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { name: true, role: true },
        },
      },
    });

    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    const sections = JSON.parse(paper.sectionsJson);
    const allQuestionIds: number[] = [];
    sections.forEach((sec: any) => {
      if (Array.isArray(sec.questionIds)) {
        allQuestionIds.push(...sec.questionIds.map((qid: any) => parseInt(qid)));
      }
    });

    const questions = await prisma.question.findMany({
      where: { id: { in: allQuestionIds } },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Seed-based shuffling so that "Set B" is always scrambled in the same order
    // Simple LCG pseudo-random number generator based on setCode seed
    const createSeededRandom = (seedString: string) => {
      let seed = 0;
      for (let i = 0; i < seedString.length; i++) {
        seed += seedString.charCodeAt(i);
      }
      return () => {
        // Linear Congruential Generator parameters
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    };

    // Instantiate generator based on paper ID and Set code
    const seededRandom = createSeededRandom(`paper-${id}-set-${setCode}`);

    // Seeded shuffle helper
    const seededShuffle = (array: any[]) => {
      const copy = [...array];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        const temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
      }
      return copy;
    };

    const scrambledSections = sections.map((sec: any) => {
      const fullQuestions = (sec.questionIds || [])
        .map((qid: any) => questionMap.get(parseInt(qid)))
        .filter((q: any) => q !== undefined);

      // Scramble question order in the section
      const shuffledQuestions = seededShuffle(fullQuestions);

      // For MCQ questions, scramble the options (A, B, C, D) but maintain correct answer integrity
      const processedQuestions = shuffledQuestions.map((q: any) => {
        if (!q.type.startsWith('MCQ') || !q.optionA) return q;

        // Map original options
        const originalOptions = [
          { label: 'A', text: q.optionA },
          { label: 'B', text: q.optionB },
          { label: 'C', text: q.optionC },
          { label: 'D', text: q.optionD },
        ];

        // Shuffle the options
        const shuffledOpts = seededShuffle(originalOptions);

        // Find the new correct answer
        // Check single correct vs multi-correct
        let newCorrectAnswer = '';
        if (q.type === 'MCQ_SINGLE') {
          const originalCorrect = q.correctAnswer.trim(); // e.g. "A"
          const matchingIndex = shuffledOpts.findIndex((opt) => opt.label === originalCorrect);
          newCorrectAnswer = String.fromCharCode(65 + matchingIndex); // 0->A, 1->B, etc.
        } else {
          // MCQ_MULTI (e.g. "A,C")
          const correctLabels = q.correctAnswer.split(',').map((x: string) => x.trim());
          const newLabels: string[] = [];
          shuffledOpts.forEach((opt, idx) => {
            if (correctLabels.includes(opt.label)) {
              newLabels.push(String.fromCharCode(65 + idx));
            }
          });
          newCorrectAnswer = newLabels.sort().join(',');
        }

        return {
          ...q,
          optionA: shuffledOpts[0].text,
          optionB: shuffledOpts[1].text,
          optionC: shuffledOpts[2].text,
          optionD: shuffledOpts[3].text,
          correctAnswer: newCorrectAnswer,
          // Track original ID & option mappings for auditing/answer key if necessary
          originalCorrectAnswer: q.correctAnswer,
        };
      });

      return {
        ...sec,
        questions: processedQuestions,
      };
    });

    return res.json({
      ...paper,
      paperCode: `SET ${setCode}`,
      sections: scrambledSections,
    });
  } catch (error: any) {
    console.error('Error scrambling paper:', error);
    return res.status(500).json({ error: 'Internal server error scrambling paper' });
  }
};
