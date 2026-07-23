import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getByClass, getByStudent, markBulk, getReport, getSummary, getDailySummary, getDashboardStats } from '../controllers/attendance.controller';

const router = Router();

router.use(authenticate);

router.get('/class', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getByClass);
router.get('/student', getByStudent);
router.get('/report', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getReport);
router.get('/summary', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getSummary);
router.get('/daily-summary', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getDailySummary);
router.get('/dashboard-stats', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getDashboardStats);
router.post('/bulk', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), markBulk);

export default router;

