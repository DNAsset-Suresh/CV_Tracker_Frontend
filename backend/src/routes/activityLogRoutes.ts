import { Router } from 'express';
import { getActivityLogs } from '../controllers/activityLogController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.get('/', requireRole('Admin'), getActivityLogs);

export default router;

