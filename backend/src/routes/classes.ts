import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getAll, getById, create, update, deleteClass, getStudents, getSubjects, bulkImport } from '../controllers/classes.controller';
import { upload } from '../utils/upload';

const router = Router();

router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getById);
router.get('/:id/students', getStudents);
router.get('/:id/subjects', getSubjects);
router.post('/bulk-import', authorize('SUPER_ADMIN', 'ADMIN'), upload.single('file'), bulkImport);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), create);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), update);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteClass);

export default router;
