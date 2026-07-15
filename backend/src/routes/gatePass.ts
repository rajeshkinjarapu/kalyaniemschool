import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { createGatePass, getGatePassById, listGatePasses, updateGatePass } from '../controllers/gatePass.controller';

const router = Router();
router.use(authenticate);

router.get('/', listGatePasses);
router.post('/', createGatePass);
router.get('/:id', getGatePassById);
router.patch('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateGatePass);

export default router;
