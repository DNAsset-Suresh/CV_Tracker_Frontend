import { Response } from 'express';
import { Assignment } from '../models/Assignment.js';
import { Candidate } from '../models/Candidate.js';
import { Feedback } from '../models/Feedback.js';
import { Interview } from '../models/Interview.js';
import { MatchResult } from '../models/MatchResult.js';
import { Resume } from '../models/Resume.js';
import { notificationService } from '../services/notification/notificationService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logActivity } from '../middleware/audit.js';

export const getManagerDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const managerId = req.user?._id;

    const assignments = await Assignment.find({ managerId })
      .populate('candidateId')
      .populate('requirementId')
      .sort({ assignedAt: -1 });

    const totalAssigned = assignments.length;
    const newAssignments = assignments.filter((a) => a.assignmentStatus === 'Assigned').length;
    const pendingReviews = assignments.filter(
      (a) => a.assignmentStatus === 'Assigned' || a.assignmentStatus === 'Under Review'
    ).length;
    const shortlisted = assignments.filter((a) => a.assignmentStatus === 'Shortlisted').length;
    const rejected = assignments.filter((a) => a.assignmentStatus === 'Rejected').length;
    const interviewScheduled = assignments.filter((a) => a.assignmentStatus === 'Interview Scheduled').length;
    const selected = assignments.filter((a) => a.assignmentStatus === 'Selected').length;

    // Upcoming interviews
    const upcomingInterviews = await Interview.find({
      assignmentId: { $in: assignments.map((a) => a._id) },
      interviewDate: { $gte: new Date() },
      interviewStatus: 'Scheduled',
    })
      .populate('candidateId', 'personalInformation candidateId')
      .populate('requirementId', 'title department')
      .sort({ interviewDate: 1 })
      .limit(5);

    res.status(200).json({
      success: true,
      metrics: {
        totalAssigned,
        newAssignments,
        pendingReviews,
        shortlisted,
        rejected,
        interviewScheduled,
        selected,
      },
      manager: {
        name: req.user?.name,
        classification: req.user?.managerClassification,
      },
      recentAssignments: assignments.slice(0, 8),
      upcomingInterviews,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getManagerCandidates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const managerId = req.user?._id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 15;
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const assignmentFilter: any = { managerId };
    if (status) assignmentFilter.assignmentStatus = status;

    const assignments = await Assignment.find(assignmentFilter)
      .populate('candidateId')
      .populate('requirementId', 'requirementId title department')
      .sort({ assignedAt: -1 });

    let candidateRecords = assignments
      .map((a: any) => ({
        assignment: a,
        candidate: a.candidateId,
        requirement: a.requirementId,
      }))
      .filter((item) => item.candidate !== null);

    if (search) {
      const searchLower = (search as string).toLowerCase();
      candidateRecords = candidateRecords.filter(
        (item: any) =>
          item.candidate.personalInformation?.fullName?.toLowerCase().includes(searchLower) ||
          item.candidate.personalInformation?.email?.toLowerCase().includes(searchLower) ||
          item.requirement?.title?.toLowerCase().includes(searchLower)
      );
    }

    const total = candidateRecords.length;
    const paginated = candidateRecords.slice(skip, skip + limit);

    // Attach match score if available
    const enriched = await Promise.all(
      paginated.map(async (item: any) => {
        const match = await MatchResult.findOne({
          candidateId: item.candidate._id,
          requirementId: item.requirement._id,
        }).select('overallScore recommendation');

        return {
          ...item,
          matchScore: match ? match.overallScore : null,
          matchRecommendation: match ? match.recommendation : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      candidates: enriched,
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

export const getManagerCandidateEvaluation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const managerId = req.user?._id;
    const { candidateId } = req.params;

    const assignment = await Assignment.findOne({
      managerId,
      candidateId,
    })
      .populate('candidateId')
      .populate('requirementId');

    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found for this candidate and manager' });
      return;
    }

    const candidate: any = assignment.candidateId;
    let rawExtractedText = '';
    if (candidate && candidate.resumeId) {
      const resume = await Resume.findById(candidate.resumeId).select('rawExtractedText');
      if (resume && resume.rawExtractedText) {
        rawExtractedText = resume.rawExtractedText;
      }
    }

    // Match result if available
    const match = await MatchResult.findOne({
      candidateId: candidate?._id,
      requirementId: (assignment.requirementId as any)?._id,
    }).select('overallScore recommendation');

    res.status(200).json({
      success: true,
      assignment,
      candidate,
      requirement: assignment.requirementId,
      rawExtractedText,
      matchScore: match ? match.overallScore : null,
      matchRecommendation: match ? match.recommendation : null,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getManagerEvaluations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const managerId = req.user?._id;
    const { status, search } = req.query;

    const filter: any = { managerId };
    if (status && status !== 'All') {
      filter.evaluationStatus = status;
    }

    const feedbacks = await Feedback.find(filter)
      .populate({
        path: 'candidateId',
        select: 'candidateId personalInformation totalExperienceYears skills education recruitmentStatus hrReviewStatus',
      })
      .populate({
        path: 'assignmentId',
        populate: {
          path: 'requirementId',
          select: 'requirementId title department role',
        },
      })
      .sort({ createdAt: -1 });

    let results = feedbacks;
    if (search) {
      const q = (search as string).toLowerCase();
      results = results.filter((fb: any) => {
        const name = fb.candidateId?.personalInformation?.fullName?.toLowerCase() || '';
        const email = fb.candidateId?.personalInformation?.email?.toLowerCase() || '';
        const reqTitle = fb.assignmentId?.requirementId?.title?.toLowerCase() || '';
        const comments = fb.comments?.toLowerCase() || '';
        return name.includes(q) || email.includes(q) || reqTitle.includes(q) || comments.includes(q);
      });
    }

    res.status(200).json({
      success: true,
      evaluations: results,
      total: results.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitFeedback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      candidateId,
      assignmentId,
      evaluationStatus,
      comments,
      ratings,
      strengths,
      weaknesses,
      rejectionReason,
    } = req.body;

    if (!candidateId || !assignmentId || !evaluationStatus || !comments) {
      res.status(400).json({
        success: false,
        message: 'Candidate ID, Assignment ID, Evaluation Status, and Comments are required',
      });
      return;
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment || assignment.managerId.toString() !== req.user?._id.toString()) {
      res.status(403).json({ success: false, message: 'You can only submit feedback for your own assignments' });
      return;
    }

    const feedback = await Feedback.create({
      candidateId,
      assignmentId,
      managerId: req.user._id,
      ratings,
      evaluationStatus,
      comments,
      strengths,
      weaknesses,
      rejectionReason,
    });

    // Map evaluationStatus to candidate recruitment status
    const statusMap: Record<string, any> = {
      Shortlist: 'Shortlisted',
      Reject: 'Rejected',
      Hold: 'On Hold',
      'Recommend Next Round': 'Under Manager Review',
    };
    const newStatus = statusMap[evaluationStatus] || 'Under Manager Review';

    assignment.assignmentStatus = newStatus === 'Under Manager Review' ? 'Under Review' : newStatus;
    assignment.history.push({
      status: assignment.assignmentStatus,
      updatedBy: req.user._id as any,
      note: `Manager Feedback: ${evaluationStatus}. Comments: ${comments}`,
      timestamp: new Date(),
    });
    await assignment.save();

    const candidate = await Candidate.findById(candidateId);
    if (candidate) {
      candidate.recruitmentStatus = newStatus;
      candidate.statusHistory.push({
        previousStatus: candidate.recruitmentStatus,
        newStatus,
        updatedBy: req.user._id as any,
        comments: `Feedback submitted by ${req.user.name}: ${evaluationStatus}. ${comments}`,
        timestamp: new Date(),
      });
      await candidate.save();
    }

    // Notify HR / Assigning user
    await notificationService.sendNotification({
      userId: assignment.assignedBy,
      title: `Manager Feedback Received: ${evaluationStatus}`,
      message: `${req.user.name} evaluated candidate ${candidate?.personalInformation?.fullName} as "${evaluationStatus}".`,
      notificationType: 'status_updated',
      entityType: 'candidate',
      entityId: candidateId,
    });

    await logActivity(req, 'MANAGER_FEEDBACK_SUBMITTED', 'Feedback', (feedback._id as any).toString(), {
      candidateId,
      assignmentId,
      evaluationStatus,
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully and candidate status updated',
      feedback,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const scheduleInterview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      candidateId,
      assignmentId,
      requirementId,
      interviewDate,
      interviewType,
      mode,
      meetingLink,
      location,
      interviewer,
    } = req.body;

    if (!candidateId || !assignmentId || !requirementId || !interviewDate) {
      res.status(400).json({ success: false, message: 'Candidate, assignment, requirement, and date are required' });
      return;
    }

    const count = await Interview.countDocuments();
    const interviewId = `INT-2026-${String(count + 1).padStart(4, '0')}`;

    const interview = await Interview.create({
      interviewId,
      candidateId,
      assignmentId,
      requirementId,
      interviewDate: new Date(interviewDate),
      interviewType: interviewType || 'Technical',
      mode: mode || 'Virtual',
      meetingLink,
      location,
      interviewer: interviewer || req.user?.name,
      interviewStatus: 'Scheduled',
      scheduledBy: req.user?._id,
    });

    // Update assignment and candidate status
    await Assignment.findByIdAndUpdate(assignmentId, {
      assignmentStatus: 'Interview Scheduled',
    });

    const candidate = await Candidate.findById(candidateId);
    if (candidate) {
      candidate.recruitmentStatus = 'Interview Scheduled';
      candidate.statusHistory.push({
        newStatus: 'Interview Scheduled',
        updatedBy: req.user?._id as any,
        comments: `${interviewType} interview scheduled on ${new Date(interviewDate).toLocaleString()} by ${req.user?.name}`,
        timestamp: new Date(),
      });
      await candidate.save();
    }

    await notificationService.sendNotification({
      userId: req.user?._id as any,
      title: 'Interview Scheduled',
      message: `Interview scheduled with ${candidate?.personalInformation.fullName} on ${new Date(interviewDate).toLocaleDateString()}`,
      notificationType: 'interview_scheduled',
      entityType: 'interview',
      entityId: interview._id as any,
    });

    await logActivity(req, 'INTERVIEW_SCHEDULED', 'Interview', (interview._id as any).toString(), {
      interviewId,
      candidateId,
      interviewDate,
    });

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      interview,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

