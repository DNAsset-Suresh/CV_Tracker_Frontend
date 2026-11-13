import { Router } from 'express';
import {
  getRequirements,
  createRequirement,
  getRequirementById,
  updateRequirement,
  updateRequirementStatus,
} from '../controllers/requirementController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

// Viewable by Admin, HR, Manager
router.get('/', getRequirements);
router.get('/:id', getRequirementById);

// Created and modified by Admin and HR
router.post('/', requireRole('Admin', 'HR'), createRequirement);
router.put('/:id', requireRole('Admin', 'HR'), updateRequirement);
router.patch('/:id/status', requireRole('Admin', 'HR'), updateRequirementStatus);

export default router;

