import { Router } from 'express';
import { getAdminDashboard, getTeacherDashboard, getStudentDashboard, getAccountantDashboard } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '../types/enums';

const router = Router();

router.use(authenticate);

router.get('/admin', authorize(Role.SUPER_ADMIN, Role.ADMIN), getAdminDashboard);
router.get('/teacher', authorize(Role.TEACHER), getTeacherDashboard);
router.get('/student', authorize(Role.STUDENT), getStudentDashboard);
router.get('/accountant', authorize(Role.SUPER_ADMIN, Role.ADMIN, 'ACCOUNTANT'), getAccountantDashboard);

export default router;
