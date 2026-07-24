import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { 
  getAllGeneratedPapers, 
  getGeneratedPaperById, 
  createGeneratedPaper, 
  updateGeneratedPaper, 
  deleteGeneratedPaper 
} from '../controllers/generatedPapers.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllGeneratedPapers);
router.get('/:id', getGeneratedPaperById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), createGeneratedPaper);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), updateGeneratedPaper);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteGeneratedPaper);

export default router;
