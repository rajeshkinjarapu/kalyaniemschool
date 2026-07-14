import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getAllSlipTests, createSlipTest, deleteSlipTest, updateSlipTestMarks } from '../controllers/slipTests.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllSlipTests);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), createSlipTest);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteSlipTest);
router.post('/:id/marks', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), updateSlipTestMarks);

export default router;
