import { Router } from 'express';
import {
  getManagerDashboard,
  getManagerCandidates,
  getManagerCandidateEvaluation,
  getManagerEvaluations,
  submitFeedback,
  scheduleInterview,
} from '../controllers/managerController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('Manager'));

router.get('/dashboard', getManagerDashboard);
router.get('/candidates', getManagerCandidates);
router.get('/candidates/:candidateId/evaluate', getManagerCandidateEvaluation);
router.get('/evaluations', getManagerEvaluations);
router.post('/feedback', submitFeedback);
router.post('/interview', scheduleInterview);

export default router;

