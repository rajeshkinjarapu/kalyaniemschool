import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getStructures, createStructure, updateStructure, deleteStructure,
  getPayments, createPayment, updateFeePayment, getStudentFeeStatus, getOverdue, downloadInvoice, deleteFeePayment, applyFeeDiscount
} from '../controllers/fees.controller';

const router = Router();

router.use(authenticate);

// Fee Structures
router.get('/structures', getStructures);
router.post('/structures', authorize('SUPER_ADMIN', 'ADMIN'), createStructure);
router.put('/structures/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateStructure);
router.delete('/structures/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteStructure);

import { upload } from '../utils/upload';
import { bulkImportFees } from '../controllers/fees.controller';
router.post('/structures/bulk-import', authorize('SUPER_ADMIN', 'ADMIN'), upload.single('file'), bulkImportFees);

// Payments
router.get('/payments', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), getPayments);
router.post('/payments', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), createPayment);
router.put('/payments/:id', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), updateFeePayment);
router.delete('/payments/:id', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), deleteFeePayment);
router.post('/discounts', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), applyFeeDiscount);
router.get('/payments/:paymentId/invoice', downloadInvoice);

// Student fee status
router.get('/student/:studentId', getStudentFeeStatus);
router.get('/overdue', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), getOverdue);

export default router;
