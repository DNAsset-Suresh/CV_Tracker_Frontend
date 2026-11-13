import { Router } from 'express';
import {
  getAdminReports,
  getHRReports,
  getManagerReports,
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/admin', requireRole('Admin'), getAdminReports);
router.get('/hr', requireRole('Admin', 'HR'), getHRReports);
router.get('/manager', requireRole('Manager'), getManagerReports);

export default router;

