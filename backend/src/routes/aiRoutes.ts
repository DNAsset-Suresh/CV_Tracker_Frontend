import { Router } from 'express';
import {
  reExtractCandidateData,
  matchCandidateWithRequirement,
  getMatchResult,
} from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { uploadSingle } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.post('/extract/:resumeId', requireRole('Admin', 'HR'), uploadSingle, reExtractCandidateData);
router.post('/match/:candidateId/:requirementId', requireRole('Admin', 'HR'), matchCandidateWithRequirement);
router.get('/match/:candidateId/:requirementId', getMatchResult);

export default router;

