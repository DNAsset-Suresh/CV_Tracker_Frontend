import { Router } from 'express';
import {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  deleteUser,
  getManagersByClassification,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

// Endpoint for HR & Admin to retrieve managers belonging to a classification
router.get('/managers', getManagersByClassification);

// Admin-only user management endpoints
router.get('/', requireRole('Admin'), getUsers);
router.post('/', requireRole('Admin'), createUser);
router.get('/:id', requireRole('Admin'), getUserById);
router.put('/:id', requireRole('Admin'), updateUser);
router.patch('/:id/status', requireRole('Admin'), toggleUserStatus);
router.post('/:id/reset-password', requireRole('Admin'), resetUserPassword);
router.delete('/:id', requireRole('Admin'), deleteUser);

export default router;

