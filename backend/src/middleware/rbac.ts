import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { UserRole, ManagerClassification } from '../models/User.js';
import { Assignment } from '../models/Assignment.js';

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${roles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};

export const requireManagerClassification = (...classifications: ManagerClassification[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (req.user.role !== 'Manager') {
      res.status(403).json({ success: false, message: 'Requires Manager role' });
      return;
    }

    if (
      !req.user.managerClassification ||
      !classifications.includes(req.user.managerClassification)
    ) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Classification restricted to [${classifications.join(', ')}]`,
      });
      return;
    }

    next();
  };
};

/**
 * Access control middleware for candidate details:
 * - Admin has full access to all candidates.
 * - HR has full access to recruitment candidates.
 * - Manager ONLY has access if the candidate is explicitly assigned to them!
 */
export const verifyCandidateAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (req.user.role === 'Admin' || req.user.role === 'HR') {
      next();
      return;
    }

    if (req.user.role === 'Manager') {
      const candidateId = req.params.id || req.params.candidateId;
      if (!candidateId) {
        res.status(400).json({ success: false, message: 'Candidate identifier missing' });
        return;
      }

      // Check if assignment exists for this manager
      const assignment = await Assignment.findOne({
        candidateId,
        managerId: req.user._id,
      });

      if (!assignment) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: You may only view candidates assigned directly to you.',
        });
        return;
      }

      next();
      return;
    }

    res.status(403).json({ success: false, message: 'Unauthorized role' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

