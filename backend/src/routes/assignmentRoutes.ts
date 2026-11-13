import { Router } from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignmentStatus,
} from '../controllers/assignmentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

// HR and Admin can create assignments
router.post('/', requireRole('Admin', 'HR'), createAssignment);

// Role-aware list and details
router.get('/', getAssignments);
router.get('/:id', getAssignmentById);
router.patch('/:id/status', updateAssignmentStatus);

export default router;

