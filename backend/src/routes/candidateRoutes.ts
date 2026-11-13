import { Router } from 'express';
import {
  getCandidates,
  getCandidateById,
  updateCandidate,
  verifyCandidate,
  updateCandidateStatus,
  getCandidateResumeUrl,
  deleteCandidate,
  archiveCandidate,
  exportCandidatesCSV,
} from '../controllers/candidateController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole, verifyCandidateAccess } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

// CSV Export (Admin and HR)
router.get('/export/csv', requireRole('Admin', 'HR'), exportCandidatesCSV);

// Candidate listing (Role-aware inside controller: managers only see their assigned)
router.get('/', getCandidates);

// Single candidate inspection (Enforces verifyCandidateAccess: managers only see their assigned!)
router.get('/:id', verifyCandidateAccess, getCandidateById);
router.get('/:id/resume', verifyCandidateAccess, getCandidateResumeUrl);

// Update extracted details and status
router.put('/:id', requireRole('Admin', 'HR'), updateCandidate);
router.patch('/:id/verify', requireRole('Admin', 'HR'), verifyCandidate);
router.patch('/:id/status', updateCandidateStatus); // Managers can update status of assigned candidates
router.delete('/:id', requireRole('Admin'), deleteCandidate);

export default router;

