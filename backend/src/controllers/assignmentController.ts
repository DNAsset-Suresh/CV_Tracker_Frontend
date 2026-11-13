import { Response } from 'express';
import { Assignment } from '../models/Assignment.js';
import { Candidate } from '../models/Candidate.js';
import { Requirement } from '../models/Requirement.js';
import { User } from '../models/User.js';
import { notificationService } from '../services/notification/notificationService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logActivity } from '../middleware/audit.js';

export const createAssignment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { candidateId, requirementId, managerId, notes, interviewDate, interviewTime } = req.body;

    if (!candidateId || !requirementId || !managerId) {
      res.status(400).json({
        success: false,
        message: 'Candidate ID, Requirement ID, and Manager ID are mandatory for assignment',
      });
      return;
    }

    // 1. Verify Candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Candidate not found' });
      return;
    }

    // 2. Verify Requirement
    const requirement = await Requirement.findById(requirementId);
    if (!requirement) {
      res.status(404).json({ success: false, message: 'Job requirement not found' });
      return;
    }

    // 3. Verify Manager and Classification match
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'Manager' || manager.accountStatus !== 'Active') {
      res.status(400).json({ success: false, message: 'Invalid or inactive Manager specified' });
      return;
    }

    const classificationMap: Record<string, string> = {
      'IT Development': 'IT Development Manager',
      'Advocate': 'Advocate Manager',
      'Field Executive': 'Field Executive Manager',
    };

    const expectedClassification = classificationMap[requirement.department];
    if (manager.managerClassification !== expectedClassification) {
      res.status(400).json({
        success: false,
        message: `Department Mismatch: Requirement belongs to '${requirement.department}' but selected manager has classification '${manager.managerClassification}'. Candidate can only be assigned to a '${expectedClassification}'.`,
      });
      return;
    }

    // 4. Prevent duplicate active assignment
    const existingActiveAssignment = await Assignment.findOne({
      candidateId,
      requirementId,
      assignmentStatus: { $in: ['Assigned', 'Under Review', 'Shortlisted', 'Interview Scheduled'] },
    });

    if (existingActiveAssignment) {
      res.status(409).json({
        success: false,
        message: `This candidate already has an active assignment (${existingActiveAssignment.assignmentId}) for requirement "${requirement.title}".`,
      });
      return;
    }

    // 5. Generate Assignment ID
    const count = await Assignment.countDocuments();
    const assignmentId = `ASN-2026-${String(count + 1).padStart(4, '0')}`;

    const assignment = await Assignment.create({
      assignmentId,
      candidateId: candidate._id,
      requirementId: requirement._id,
      managerId: manager._id,
      assignedBy: req.user?._id,
      assignmentStatus: 'Assigned',
      assignedAt: new Date(),
      notes,
      interviewDate: interviewDate || undefined,
      interviewTime: interviewTime || undefined,
      history: [
        {
          status: 'Assigned',
          updatedBy: req.user?._id,
          note: notes || 'Assigned by HR for review',
          timestamp: new Date(),
        },
      ],
    });

    // 6. Update Candidate
    candidate.recruitmentStatus = 'Assigned';
    candidate.assignedManagerId = manager._id as any;
    candidate.primaryRequirementId = requirement._id as any;
    candidate.statusHistory.push({
      previousStatus: candidate.recruitmentStatus,
      newStatus: 'Assigned',
      updatedBy: req.user?._id as any,
      comments: `Assigned to manager ${manager.name} (${manager.managerClassification}) for requirement "${requirement.title}"`,
      timestamp: new Date(),
    });
    await candidate.save();

    // 7. Dispatch Notification to Manager
    await notificationService.sendNotification({
      userId: manager._id as any,
      title: 'New Candidate Assigned for Review',
      message: `HR assigned ${candidate.personalInformation.fullName} for requirement "${requirement.title}". ${interviewDate ? `Interview planned: ${interviewDate} ${interviewTime || ''}` : ''}`,
      notificationType: 'candidate_assigned',
      entityType: 'assignment',
      entityId: assignment._id as any,
      metadata: {
        assignmentId: assignment.assignmentId,
        candidateName: candidate.personalInformation.fullName,
        jobTitle: requirement.title,
        interviewDate: interviewDate || null,
        interviewTime: interviewTime || null,
      },
    });

    await logActivity(req, 'CANDIDATE_ASSIGNED_TO_MANAGER', 'Assignment', (assignment._id as any).toString(), {
      assignmentId,
      candidateId: candidate.candidateId,
      requirementId: requirement.requirementId,
      managerName: manager.name,
      classification: manager.managerClassification,
    });

    res.status(201).json({
      success: true,
      message: `Candidate successfully assigned to ${manager.name} (${manager.managerClassification})`,
      assignment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAssignments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 15;
    const skip = (page - 1) * limit;

    const { status, managerId, requirementId, candidateId } = req.query;
    const filter: any = {};

    // Managers can only see assignments assigned directly to them
    if (req.user?.role === 'Manager') {
      filter.managerId = req.user._id;
    } else if (managerId) {
      filter.managerId = managerId;
    }

    if (status) filter.assignmentStatus = status;
    if (requirementId) filter.requirementId = requirementId;
    if (candidateId) filter.candidateId = candidateId;

    const total = await Assignment.countDocuments(filter);
    const assignments = await Assignment.find(filter)
      .populate('candidateId', 'candidateId personalInformation professionalInformation recruitmentStatus skills')
      .populate('requirementId', 'requirementId title department vacancies status')
      .populate('managerId', 'name email managerClassification')
      .populate('assignedBy', 'name email')
      .sort({ assignedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      assignments,
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

export const getAssignmentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('candidateId')
      .populate('requirementId')
      .populate('managerId', 'name email managerClassification')
      .populate('assignedBy', 'name email')
      .populate('history.updatedBy', 'name email role');

    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }

    // Role check: Manager cannot inspect other managers' assignments
    if (req.user?.role === 'Manager' && assignment.managerId._id.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: 'Access denied: Assignment belongs to another manager' });
      return;
    }

    res.status(200).json({ success: true, assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAssignmentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, note } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }

    if (req.user?.role === 'Manager' && assignment.managerId.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: 'Access denied: Assignment belongs to another manager' });
      return;
    }

    assignment.assignmentStatus = status;
    assignment.history.push({
      status,
      updatedBy: req.user?._id as any,
      note,
      timestamp: new Date(),
    });
    await assignment.save();

    // Sync candidate status
    await Candidate.findByIdAndUpdate(assignment.candidateId, {
      recruitmentStatus: status === 'Under Review' ? 'Under Manager Review' : status,
    });

    await logActivity(req, 'ASSIGNMENT_STATUS_UPDATED', 'Assignment', (assignment._id as any).toString(), {
      status,
      note,
    });

    res.status(200).json({ success: true, message: `Assignment status updated to ${status}`, assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

