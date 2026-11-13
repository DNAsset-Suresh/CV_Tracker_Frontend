import { Response } from 'express';
import { Requirement } from '../models/Requirement.js';
import { Candidate } from '../models/Candidate.js';
import { Assignment } from '../models/Assignment.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logActivity } from '../middleware/audit.js';

export const getRequirements = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 15;
    const skip = (page - 1) * limit;

    const { department, status, search } = req.query;
    const filter: any = {};

    if (department) filter.department = department;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { requirementId: { $regex: search, $options: 'i' } },
        { requiredSkills: { $in: [new RegExp(search as string, 'i')] } },
      ];
    }

    const total = await Requirement.countDocuments(filter);
    const requirements = await Requirement.find(filter)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      requirements,
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

export const createRequirement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      department,
      jobDescription,
      requiredSkills,
      preferredSkills,
      minExperience,
      maxExperience,
      relevantExperience,
      qualification,
      preferredLocation,
      vacancies,
      salaryRange,
      employmentType,
    } = req.body;

    if (!title || !department || !jobDescription) {
      res.status(400).json({ success: false, message: 'Title, department, and job description are required' });
      return;
    }

    const count = await Requirement.countDocuments();
    const requirementId = `REQ-2026-${String(count + 1).padStart(4, '0')}`;

    const requirement = await Requirement.create({
      requirementId,
      title: title.trim(),
      department,
      jobDescription,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : (requiredSkills ? requiredSkills.split(',').map((s: string) => s.trim()) : []),
      preferredSkills: Array.isArray(preferredSkills) ? preferredSkills : (preferredSkills ? preferredSkills.split(',').map((s: string) => s.trim()) : []),
      minExperience: minExperience || 0,
      maxExperience: maxExperience || 10,
      relevantExperience: relevantExperience || 0,
      qualification: qualification || 'Bachelor',
      preferredLocation: preferredLocation || 'Any',
      vacancies: vacancies || 1,
      salaryRange,
      employmentType: employmentType || 'Full-time',
      status: 'Active',
      createdBy: req.user?._id,
    });

    await logActivity(req, 'REQUIREMENT_CREATED', 'Requirement', (requirement._id as any).toString(), {
      requirementId,
      title,
      department,
    });

    res.status(201).json({
      success: true,
      message: 'Job requirement created successfully',
      requirement,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRequirementById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requirement = await Requirement.findById(req.params.id).populate('createdBy', 'name email role');
    if (!requirement) {
      res.status(404).json({ success: false, message: 'Requirement not found' });
      return;
    }

    // Get live allocation stats for this requirement
    const assignments = await Assignment.find({ requirementId: requirement._id });
    const stats = {
      totalAssigned: assignments.length,
      underReview: assignments.filter((a) => a.assignmentStatus === 'Under Review' || a.assignmentStatus === 'Assigned').length,
      shortlisted: assignments.filter((a) => a.assignmentStatus === 'Shortlisted').length,
      rejected: assignments.filter((a) => a.assignmentStatus === 'Rejected').length,
      selected: assignments.filter((a) => a.assignmentStatus === 'Selected').length,
    };

    res.status(200).json({ success: true, requirement, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRequirement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requirement = await Requirement.findById(req.params.id);
    if (!requirement) {
      res.status(404).json({ success: false, message: 'Requirement not found' });
      return;
    }

    const prev = requirement.toObject();
    Object.assign(requirement, req.body);
    await requirement.save();

    await logActivity(
      req,
      'REQUIREMENT_UPDATED',
      'Requirement',
      (requirement._id as any).toString(),
      { updatedFields: req.body },
      prev,
      requirement.toObject()
    );

    res.status(200).json({
      success: true,
      message: 'Requirement updated successfully',
      requirement,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRequirementStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['Active', 'On Hold', 'Closed'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status. Must be Active, On Hold, or Closed.' });
      return;
    }

    const requirement = await Requirement.findById(req.params.id);
    if (!requirement) {
      res.status(404).json({ success: false, message: 'Requirement not found' });
      return;
    }

    const prevStatus = requirement.status;
    requirement.status = status;
    await requirement.save();

    await logActivity(req, 'REQUIREMENT_STATUS_CHANGED', 'Requirement', (requirement._id as any).toString(), {
      previousStatus: prevStatus,
      newStatus: status,
    });

    res.status(200).json({
      success: true,
      message: `Requirement status updated to ${status}`,
      requirement,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

