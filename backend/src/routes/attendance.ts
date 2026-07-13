import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getByClass, getByStudent, markBulk, getReport, getSummary, getDailySummary } from '../controllers/attendance.controller';

const router = Router();

router.use(authenticate);

router.get('/class', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getByClass);
router.get('/student', getByStudent);
router.get('/report', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getReport);
router.get('/summary', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getSummary);
router.get('/daily-summary', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getDailySummary);
router.post('/bulk', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), markBulk);

export default router;
