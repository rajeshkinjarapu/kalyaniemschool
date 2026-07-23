import { Router } from 'express';
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionMeta,
} from '../controllers/question-bank/question.controller';
import {
  getPapers,
  getPaperById,
  createPaper,
  updatePaper,
  deletePaper,
  getScrambledPaperSet,
} from '../controllers/question-bank/paper.controller';
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/question-bank/template.controller';
import { importQuestionFile } from '../controllers/question-bank/import.controller';
import { authenticate, authorize } from '../middlewares/auth';
import multer from 'multer';
import path from 'path';

const router = Router();

// Multer Storage Configuration (for question bank imports/uploads)
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  })
});

// ================= QUESTION BANK ROUTES =================
router.get('/questions', authenticate, getQuestions);
router.get('/questions/meta', authenticate, getQuestionMeta);
router.get('/questions/:id', authenticate, getQuestionById);
router.post('/questions', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), createQuestion);
router.put('/questions/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), updateQuestion);
router.delete('/questions/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), deleteQuestion);
router.post('/questions/import', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), upload.single('file'), importQuestionFile);

router.post('/questions/upload', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  return res.json({ imageUrl, message: 'Image uploaded successfully' });
});

// ================= QUESTION PAPER ROUTES =================
router.get('/papers', authenticate, getPapers);
router.get('/papers/:id', authenticate, getPaperById);
router.get('/papers/:id/scramble', authenticate, getScrambledPaperSet);
router.post('/papers', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), createPaper);
router.put('/papers/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), updatePaper);
router.delete('/papers/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), deletePaper);

// ================= BLUEPRINT TEMPLATE ROUTES =================
router.get('/templates', authenticate, getTemplates);
router.get('/templates/:id', authenticate, getTemplateById);
router.post('/templates', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), createTemplate);
router.put('/templates/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), updateTemplate);
router.delete('/templates/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), deleteTemplate);

export default router;
