import { Response } from 'express';
import { Candidate, RecruitmentStatus } from '../models/Candidate.js';
import { Resume } from '../models/Resume.js';
import { Assignment } from '../models/Assignment.js';
import { Feedback } from '../models/Feedback.js';
import { Interview } from '../models/Interview.js';
import { MatchResult } from '../models/MatchResult.js';
import { storageService } from '../services/storage/storageService.js';
import { notificationService } from '../services/notification/notificationService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logActivity } from '../middleware/audit.js';

export const getCandidates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 15;
    const skip = (page - 1) * limit;

    const {
      search,
      status,
      minExp,
      maxExp,
      skill,
      location,
      qualification,
      requirementId,
      managerId,
      isVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter: any = { isArchived: { $ne: true } };

    // Role-based restrictions:
    // If Manager, only show candidates assigned to this manager!
    if (req.user?.role === 'Manager') {
      const myAssignments = await Assignment.find({ managerId: req.user._id });
      const candidateIds = myAssignments.map((a) => a.candidateId);
      filter._id = { $in: candidateIds };
    } else if (managerId) {
      const managerAssignments = await Assignment.find({ managerId });
      const candidateIds = managerAssignments.map((a) => a.candidateId);
      filter._id = { $in: candidateIds };
    }

    if (status) filter.recruitmentStatus = status;
    if (isVerified !== undefined) filter.isVerifiedByHR = isVerified === 'true';
    if (req.query.hrReviewStatus) filter.hrReviewStatus = req.query.hrReviewStatus;

    if (minExp !== undefined || maxExp !== undefined) {
      filter['professionalInformation.totalExperienceYears'] = {};
      if (minExp !== undefined) filter['professionalInformation.totalExperienceYears'].$gte = Number(minExp);
      if (maxExp !== undefined) filter['professionalInformation.totalExperienceYears'].$lte = Number(maxExp);
    }

    if (location) {
      filter['personalInformation.currentLocation'] = { $regex: location, $options: 'i' };
    }

    if (qualification) {
      filter['education.degree'] = { $regex: qualification, $options: 'i' };
    }

    if (skill) {
      filter.$or = [
        { 'skills.technicalSkills': { $in: [new RegExp(skill as string, 'i')] } },
        { 'skills.programmingLanguages': { $in: [new RegExp(skill as string, 'i')] } },
      ];
    }

    if (requirementId) {
      filter.primaryRequirementId = requirementId;
    }

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      filter.$or = [
        { candidateId: searchRegex },
        { 'personalInformation.fullName': searchRegex },
        { 'personalInformation.email': searchRegex },
        { 'personalInformation.phone': searchRegex },
        { 'professionalInformation.currentDesignation': searchRegex },
        { 'professionalInformation.currentCompany': searchRegex },
        { 'skills.technicalSkills': { $in: [searchRegex] } },
      ];
    }

    const sortOption: any = {};
    sortOption[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const total = await Candidate.countDocuments(filter);
    const candidates = await Candidate.find(filter)
      .populate('primaryRequirementId', 'requirementId title department')
      .populate('assignedManagerId', 'name email managerClassification')
      .populate('resumeId', 'originalFileName storageKey processingStatus')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      candidates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCandidateById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('primaryRequirementId')
      .populate('assignedManagerId', 'name email role managerClassification phone')
      .populate('verifiedBy', 'name email role')
      .populate('resumeId')
      .populate('statusHistory.updatedBy', 'name email role')
      .populate('auditHistory.modifiedBy', 'name email role');

    if (!candidate) {
      res.status(404).json({ success: false, message: 'Candidate not found' });
      return;
    }

    // Related assignments, feedbacks, and interviews
    const assignments = await Assignment.find({ candidateId: candidate._id })
      .populate('requirementId', 'requirementId title department vacancies status')
      .populate('managerId', 'name email managerClassification')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    const feedbacks = await Feedback.find({ candidateId: candidate._id })
      .populate('managerId', 'name email managerClassification')
      .sort({ createdAt: -1 });

    const interviews = await Interview.find({ candidateId: candidate._id })
      .populate('requirementId', 'title department')
      .sort({ interviewDate: -1 });

    const matchResults = await MatchResult.find({ candidateId: candidate._id })
      .populate('requirementId', 'title department requirementId')
      .sort({ computedAt: -1 });

    res.status(200).json({
      success: true,
      candidate,
      assignments,
      feedbacks,
      interviews,
      matchResults,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCandidate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Candidate not found' });
      return;
    }

    const {
      personalInformation,
      professionalInformation,
      skills,
      education,
      hrReviewStatus,
      hrEvaluationNotes,
      suitabilityDecision,
      primaryRequirementId,
    } = req.body;

    // Track audit modifications
    const auditEntries = [];

    if (hrReviewStatus) {
      candidate.hrReviewStatus = hrReviewStatus;
      if (hrReviewStatus === 'Suitable') {
        candidate.recruitmentStatus = 'Screened';
      } else if (hrReviewStatus === 'Not Suitable') {
        candidate.recruitmentStatus = 'Rejected';
      } else if (hrReviewStatus === 'Needs Review') {
        candidate.recruitmentStatus = 'Needs Review';
      }
    }
    if (hrEvaluationNotes !== undefined) candidate.hrEvaluationNotes = hrEvaluationNotes;
    if (suitabilityDecision !== undefined) candidate.suitabilityDecision = suitabilityDecision;
    if (primaryRequirementId) candidate.primaryRequirementId = primaryRequirementId;
    if (personalInformation) {
      auditEntries.push({
        modifiedAt: new Date(),
        modifiedBy: req.user?._id as any,
        field: 'personalInformation',
        previousValue: candidate.personalInformation,
        newValue: personalInformation,
      });
      candidate.personalInformation = { ...candidate.personalInformation, ...personalInformation };
    }

    if (professionalInformation) {
      auditEntries.push({
        modifiedAt: new Date(),
        modifiedBy: req.user?._id as any,
        field: 'professionalInformation',
        previousValue: candidate.professionalInformation,
        newValue: professionalInformation,
      });
      candidate.professionalInformation = { ...candidate.professionalInformation, ...professionalInformation };
    }

    if (skills) {
      auditEntries.push({
        modifiedAt: new Date(),
        modifiedBy: req.user?._id as any,
        field: 'skills',
        previousValue: candidate.skills,
        newValue: skills,
      });
      candidate.skills = { ...candidate.skills, ...skills };
    }

    if (education) {
      auditEntries.push({
        modifiedAt: new Date(),
        modifiedBy: req.user?._id as any,
        field: 'education',
        previousValue: candidate.education,
        newValue: education,
      });
      candidate.education = education;
    }

    candidate.auditHistory.push(...auditEntries);
    await candidate.save();

    await logActivity(req, 'CANDIDATE_RECORD_EDITED', 'Candidate', (candidate._id as any).toString(), {
      candidateId: candidate.candidateId,
      name: candidate.personalInformation.fullName,
      updatedSections: Object.keys(req.body),
    });

    res.status(200).json({
      success: true,
      message: 'Candidate profile updated successfully with audit history',
      candidate,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyCandidate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Candidate not found' });
      return;
    }

    candidate.isVerifiedByHR = true;
    candidate.verifiedBy = req.user?._id as any;
    if (candidate.recruitmentStatus === 'Needs Review') {
      candidate.recruitmentStatus = 'Screened';
    }
    await candidate.save();

    await logActivity(req, 'CANDIDATE_VERIFIED_BY_HR', 'Candidate', (candidate._id as any).toString());

    res.status(200).json({
      success: true,
      message: 'Candidate details verified by HR',
      candidate,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCandidateStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, comments } = req.body;
    const validStatuses: RecruitmentStatus[] = [
      'New',
      'Processing',
      'Needs Review',
      'Screened',
      'Unassigned',
      'Assigned',
      'Under Manager Review',
      'Shortlisted',
      'Rejected',
      'Interview Scheduled',
      'Interview Completed',
      'Selected',
      'On Hold',
      'Withdrawn',
    ];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: `Invalid status: ${status}` });
      return;
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Candidate not found' });
      return;
    }

    const previousStatus = candidate.recruitmentStatus;
    candidate.recruitmentStatus = status;
    candidate.statusHistory.push({
      previousStatus,
      newStatus: status,
      updatedBy: req.user?._id as any,
      comments: comments || `Status updated from ${previousStatus} to ${status}`,
      timestamp: new Date(),
    });

    await candidate.save();

    await logActivity(req, 'CANDIDATE_STATUS_CHANGED', 'Candidate', (candidate._id as any).toString(), {
      previousStatus,
      newStatus: status,
      comments,
    });

    // Notify uploader or relevant manager
    if (candidate.assignedManagerId) {
      await notificationService.sendNotification({
        userId: candidate.assignedManagerId,
        title: 'Candidate Status Updated',
        message: `${candidate.personalInformation.fullName} status updated to ${status}.`,
        notificationType: 'status_updated',
        entityType: 'candidate',
        entityId: candidate._id as any,
      });
    }

    res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      candidate,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCandidateResumeUrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('resumeId');
    if (!candidate || !candidate.resumeId) {
      res.status(404).json({ success: false, message: 'Resume record not found for candidate' });
      return;
    }

    const resume: any = candidate.resumeId;
    const retentionNotice = storageService.getDataRetentionNotice();

    res.status(200).json({
      success: true,
      isRetained: false,
      retentionNotice: retentionNotice.policy,
      fileName: resume.originalFileName,
      mimeType: resume.mimeType,
      rawExtractedText: resume.rawExtractedText || null,
      message: 'Original document was processed and removed per enterprise data retention policy. Parsed information and extracted text are preserved below.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCandidate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Candidate not found' });
      return;
    }

    const candidateId = candidate._id;
    const resumeId = candidate.resumeId;

    // Permanently remove linked resumes
    if (resumeId) {
      await Resume.findByIdAndDelete(resumeId);
    }
    await Resume.deleteMany({ candidateId });

    // Permanently remove related assignments, feedbacks, interviews, match results
    await Assignment.deleteMany({ candidateId });
    await Feedback.deleteMany({ candidateId });
    await Interview.deleteMany({ candidateId });
    await MatchResult.deleteMany({ candidateId });

    // Permanently delete candidate from database
    await Candidate.findByIdAndDelete(candidateId);

    await logActivity(req, 'CANDIDATE_DELETED_PERMANENTLY', 'Candidate', (candidateId as any).toString(), {
      candidateId: candidate.candidateId,
      fullName: candidate.personalInformation?.fullName,
    });

    res.status(200).json({ success: true, message: 'Candidate and extracted data permanently deleted from database' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const archiveCandidate = deleteCandidate;

export const exportCandidatesCSV = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const candidates = await Candidate.find({ isArchived: { $ne: true } })
      .populate('primaryRequirementId', 'title department')
      .populate('assignedManagerId', 'name managerClassification');

    let csv = 'Candidate ID,Full Name,Email,Phone,Current Designation,Experience (Yrs),Location,Primary Skills,Status,Assigned Manager,Created Date\n';

    for (const c of candidates) {
      const skills = (c.skills?.technicalSkills || []).slice(0, 5).join('; ');
      const manager: any = c.assignedManagerId;
      csv += `"${c.candidateId}","${c.personalInformation.fullName}","${c.personalInformation.email}","${c.personalInformation.phone}","${c.professionalInformation?.currentDesignation || ''}","${c.professionalInformation?.totalExperienceYears || 0}","${c.personalInformation.currentLocation || ''}","${skills}","${c.recruitmentStatus}","${manager ? manager.name : 'Unassigned'}","${c.createdAt.toISOString()}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="talentflow-candidates.csv"');
    res.status(200).send(csv);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

