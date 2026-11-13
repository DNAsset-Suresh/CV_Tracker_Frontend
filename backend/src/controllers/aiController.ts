import { Response } from 'express';
import { Candidate } from '../models/Candidate.js';
import { Requirement } from '../models/Requirement.js';
import { Resume } from '../models/Resume.js';
import { MatchResult } from '../models/MatchResult.js';
import { aiService } from '../services/ai/aiService.js';
import { parserService } from '../services/resume/parserService.js';
import { storageService } from '../services/storage/storageService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logActivity } from '../middleware/audit.js';

export const reExtractCandidateData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { resumeId } = req.params;
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      res.status(404).json({ success: false, message: 'Resume not found' });
      return;
    }

    let textToParse = resume.rawExtractedText;

    // If an updated file was sent in this request
    if (req.file) {
      const parsed = await parserService.extractText(req.file.path, req.file.originalname);
      textToParse = parsed.text;
      storageService.deleteTempFile(req.file.path);
    }

    if (!textToParse) {
      res.status(400).json({
        success: false,
        message: 'Original document was purged under ephemeral retention policy. Please upload the resume file again to re-extract.',
      });
      return;
    }

    const aiData = await aiService.extractCandidateData(textToParse, resume.originalFileName);

    let candidate = await Candidate.findOne({ resumeId: resume._id });
    if (candidate) {
      candidate.personalInformation = { ...candidate.personalInformation, ...aiData.personalInformation };
      candidate.professionalInformation = { ...candidate.professionalInformation, ...aiData.professionalInformation };
      candidate.skills = aiData.skills;
      candidate.education = aiData.education as any;
      candidate.extractionConfidence = aiData.confidenceScore || 0.95;
      await candidate.save();
    }

    resume.processingStatus = 'Extracted';
    resume.rawExtractedText = textToParse.slice(0, 10000);
    await resume.save();

    await logActivity(req, 'RESUME_RE_EXTRACTED', 'Resume', resumeId);

    res.status(200).json({
      success: true,
      message: 'Resume re-extracted successfully with rule-based engine',
      candidate,
      aiData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const matchCandidateWithRequirement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { candidateId, requirementId } = req.params;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Candidate not found' });
      return;
    }

    const requirement = await Requirement.findById(requirementId);
    if (!requirement) {
      res.status(404).json({ success: false, message: 'Requirement not found' });
      return;
    }

    // Run AI Evaluation
    const evaluation = await aiService.evaluateRequirementMatch(candidate, requirement);

    // Save or update MatchResult
    const matchResult = await MatchResult.findOneAndUpdate(
      { candidateId: candidate._id, requirementId: requirement._id },
      {
        candidateId: candidate._id,
        requirementId: requirement._id,
        overallScore: evaluation.overallScore,
        skillsMatch: evaluation.skillsMatch,
        experienceMatch: evaluation.experienceMatch,
        educationMatch: evaluation.educationMatch,
        strengths: evaluation.strengths,
        potentialGaps: evaluation.potentialGaps,
        explanation: evaluation.explanation,
        recommendation: evaluation.recommendation,
        computedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await logActivity(req, 'AI_REQUIREMENT_MATCH_COMPUTED', 'MatchResult', (matchResult._id as any).toString(), {
      candidateId: candidate.candidateId,
      requirementId: requirement.requirementId,
      overallScore: evaluation.overallScore,
      recommendation: evaluation.recommendation,
    });

    res.status(200).json({
      success: true,
      matchResult,
      candidate: {
        id: candidate._id,
        candidateId: candidate.candidateId,
        name: candidate.personalInformation.fullName,
      },
      requirement: {
        id: requirement._id,
        requirementId: requirement.requirementId,
        title: requirement.title,
        department: requirement.department,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMatchResult = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { candidateId, requirementId } = req.params;
    const matchResult = await MatchResult.findOne({
      candidateId,
      requirementId,
    })
      .populate('candidateId', 'candidateId personalInformation')
      .populate('requirementId', 'requirementId title department');

    if (!matchResult) {
      res.status(404).json({ success: false, message: 'No match evaluation found for this pair' });
      return;
    }

    res.status(200).json({ success: true, matchResult });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

