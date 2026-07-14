import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { upload } from '../utils/upload';
import {
  getAll, getById, create, update, deleteStudent,
  bulkImport, exportCsv, getMyProfile, bulkUploadPhotos, getTemplate
} from '../controllers/students.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'ACCOUNTANT'), getAll);
router.get('/my-profile', authorize('STUDENT'), getMyProfile);
router.get('/export', authorize('SUPER_ADMIN', 'ADMIN'), exportCsv);
router.get('/template', authorize('SUPER_ADMIN', 'ADMIN'), getTemplate);
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), create);
router.post('/bulk-import', authorize('SUPER_ADMIN', 'ADMIN'), upload.single('file'), bulkImport);
router.post('/bulk-photos', authorize('SUPER_ADMIN', 'ADMIN'), upload.single('file'), bulkUploadPhotos);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), update);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteStudent);

export default router;
