import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getAllQuestionPapers, createQuestionPaper, deleteQuestionPaper } from '../controllers/questionPapers.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllQuestionPapers);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), createQuestionPaper);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteQuestionPaper);

export default router;
