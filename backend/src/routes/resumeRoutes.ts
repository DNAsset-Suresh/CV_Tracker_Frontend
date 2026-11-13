import { Router } from 'express';
import {
  uploadSingleResume,
  uploadBulkResumes,
  getResumes,
  getBatchStatus,
  getResumeStatus,
  retryResumeProcessing,
  downloadResume,
} from '../controllers/resumeController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { uploadSingle, uploadBulk } from '../middleware/upload.js';

const router = Router();

// Secure resume download (can use query token for download links or Bearer auth)
router.get('/download/:key', authenticate, downloadResume);

// Protected routes
router.use(authenticate);

router.get('/', requireRole('Admin', 'HR'), getResumes);
router.post('/upload', requireRole('Admin', 'HR'), uploadSingle, uploadSingleResume);
router.post('/bulk-upload', requireRole('Admin', 'HR'), uploadBulk, uploadBulkResumes);
router.get('/batch/:batchId', requireRole('Admin', 'HR'), getBatchStatus);
router.get('/:id/status', requireRole('Admin', 'HR'), getResumeStatus);
router.post('/:id/retry', requireRole('Admin', 'HR'), retryResumeProcessing);

export default router;

