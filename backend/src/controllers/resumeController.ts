import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { Resume } from '../models/Resume.js';
import { storageService } from '../services/storage/storageService.js';
import { resumeProcessingManager } from '../queues/resumeQueue.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logActivity } from '../middleware/audit.js';

export const uploadSingleResume = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No resume file uploaded' });
      return;
    }

    const tempFilePath = file.path;

    const resume = await Resume.create({
      originalFileName: file.originalname,
      storageKey: 'ephemeral_deleted',
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedBy: req.user?._id,
      processingStatus: 'Uploaded',
    });

    // Add to background processing queue with temporary local path
    await resumeProcessingManager.addResumeJob({
      resumeId: (resume._id as any).toString(),
      filePath: tempFilePath,
      originalFileName: file.originalname,
      uploadedBy: (req.user?._id as any).toString(),
    });

    await logActivity(req, 'RESUME_UPLOADED', 'Resume', (resume._id as any).toString(), {
      fileName: file.originalname,
      size: file.size,
    });

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully and queued for extraction',
      resume,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadBulkResumes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No files provided for bulk upload' });
      return;
    }

    const batchId = `BATCH-${uuidv4().slice(0, 8).toUpperCase()}`;
    const queuedResumes = [];

    for (const file of files) {
      const tempFilePath = file.path;

      const resume = await Resume.create({
        originalFileName: file.originalname,
        storageKey: 'ephemeral_deleted',
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedBy: req.user?._id,
        uploadBatchId: batchId,
        processingStatus: 'Uploaded',
      });

      queuedResumes.push(resume);

      // Enqueue job asynchronously (non-blocking)
      resumeProcessingManager.addResumeJob({
        resumeId: (resume._id as any).toString(),
        filePath: tempFilePath,
        originalFileName: file.originalname,
        uploadedBy: (req.user?._id as any).toString(),
        batchId,
      });
    }

    await logActivity(req, 'BULK_RESUMES_UPLOADED', 'Resume', batchId, {
      batchId,
      totalFiles: files.length,
    });

    res.status(202).json({
      success: true,
      message: `Successfully uploaded ${files.length} resumes. Background processing initiated.`,
      batchId,
      totalCount: files.length,
      resumes: queuedResumes,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getResumes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const { status, batchId, search } = req.query;
    const filter: any = {};

    if (status) filter.processingStatus = status;
    if (batchId) filter.uploadBatchId = batchId;
    if (search) {
      filter.originalFileName = { $regex: search, $options: 'i' };
    }

    const total = await Resume.countDocuments(filter);
    const resumes = await Resume.find(filter)
      .populate('uploadedBy', 'name email')
      .populate('candidateId', 'candidateId personalInformation recruitmentStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      resumes,
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

export const getBatchStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;
    const resumes = await Resume.find({ uploadBatchId: batchId });

    const total = resumes.length;
    const uploaded = resumes.filter((r) => r.processingStatus === 'Uploaded').length;
    const queued = resumes.filter((r) => r.processingStatus === 'Queued').length;
    const processing = resumes.filter((r) => r.processingStatus === 'Processing').length;
    const extracted = resumes.filter((r) => r.processingStatus === 'Extracted').length;
    const failed = resumes.filter((r) => r.processingStatus === 'Failed').length;
    const duplicate = resumes.filter((r) => r.processingStatus === 'Duplicate').length;
    const remaining = uploaded + queued + processing;

    res.status(200).json({
      success: true,
      batchId,
      summary: {
        total,
        uploaded,
        queued,
        processing,
        extracted,
        failed,
        duplicate,
        remaining,
        isCompleted: remaining === 0,
      },
      resumes,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getResumeStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const resume = await Resume.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('candidateId');

    if (!resume) {
      res.status(404).json({ success: false, message: 'Resume not found' });
      return;
    }

    res.status(200).json({ success: true, resume });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const retryResumeProcessing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      res.status(404).json({ success: false, message: 'Resume not found' });
      return;
    }

    // Since original files are deleted after processing, if no file exists on disk, check if raw text is saved
    const tempPath = storageService.getTempFilePath(resume.originalFileName);
    const fileExists = fs.existsSync(tempPath);

    if (!fileExists && !resume.rawExtractedText) {
      res.status(400).json({
        success: false,
        message: 'Original document was purged under data retention policy. Please re-upload the resume file to retry processing.',
      });
      return;
    }

    resume.retryCount += 1;
    resume.processingStatus = 'Queued';
    resume.errorMessage = undefined;
    await resume.save();

    await resumeProcessingManager.addResumeJob({
      resumeId: (resume._id as any).toString(),
      filePath: fileExists ? tempPath : '',
      originalFileName: resume.originalFileName,
      uploadedBy: (req.user?._id as any).toString(),
      batchId: resume.uploadBatchId,
      retryCount: resume.retryCount,
    });

    res.status(200).json({
      success: true,
      message: 'Resume queued for retry processing',
      resume,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadResume = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const resume = await Resume.findOne({
      $or: [{ storageKey: key }, { _id: key.match(/^[0-9a-fA-F]{24}$/) ? key : null }],
    });

    if (!resume) {
      res.status(404).json({ success: false, message: 'Resume record not found' });
      return;
    }

    // If an ephemeral file is still present in the temp upload cache (e.g., immediate preview)
    const tempPath = storageService.getTempFilePath(resume.originalFileName);
    if (fs.existsSync(tempPath)) {
      res.setHeader('Content-Type', resume.mimeType || 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(resume.originalFileName)}"`
      );
      fs.createReadStream(tempPath).pipe(res);
      return;
    }

    // Ephemeral retention response
    const retentionNotice = storageService.getDataRetentionNotice();
    res.status(200).json({
      success: true,
      isRetained: false,
      message: retentionNotice.policy,
      fileName: resume.originalFileName,
      rawExtractedText: resume.rawExtractedText || null,
      recommendation: 'Original resume files are removed after ingestion for data privacy. HR may re-upload the document if further file inspection is needed.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
