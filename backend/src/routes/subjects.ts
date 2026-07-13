import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getAll, create, update, deleteSubject, assignTeacher, bulkImport } from '../controllers/subjects.controller';
import { upload } from '../utils/upload';

const router = Router();

router.use(authenticate);

router.get('/', getAll);
router.post('/bulk-import', authorize('SUPER_ADMIN', 'ADMIN'), upload.single('file'), bulkImport);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), create);
router.post('/assign-teacher', authorize('SUPER_ADMIN', 'ADMIN'), assignTeacher);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), update);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteSubject);

export default router;
