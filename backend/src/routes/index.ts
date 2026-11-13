import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import requirementRoutes from './requirementRoutes.js';
import resumeRoutes from './resumeRoutes.js';
import candidateRoutes from './candidateRoutes.js';
import aiRoutes from './aiRoutes.js';
import assignmentRoutes from './assignmentRoutes.js';
import managerRoutes from './managerRoutes.js';
import reportRoutes from './reportRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import activityLogRoutes from './activityLogRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/requirements', requirementRoutes);
router.use('/resumes', resumeRoutes);
router.use('/candidates', candidateRoutes);
router.use('/ai', aiRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/manager', managerRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activity-logs', activityLogRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'TalentFlow AI Core Engine',
    version: '1.0.0',
  });
});

export default router;

