import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import crypto from 'crypto';
import fs from 'fs';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { Resume } from '../models/Resume.js';
import { Candidate } from '../models/Candidate.js';
import { parserService } from '../services/resume/parserService.js';
import { aiService } from '../services/ai/aiService.js';
import { storageService } from '../services/storage/storageService.js';
import { notificationService } from '../services/notification/notificationService.js';

export interface ResumeJobData {
  resumeId: string;
  filePath: string;
  originalFileName: string;
  uploadedBy: string;
  batchId?: string;
  retryCount?: number;
}

class ResumeProcessingManager {
  private bullQueue: Queue | null = null;
  private inMemoryQueue: ResumeJobData[] = [];
  private isProcessingInMemory = false;
  private activeConcurrency = 0;
  private maxConcurrency = 3;

  constructor() {
    this.initQueue();
  }

  private initQueue() {
    if (config.redis.isConfigured && config.redis.url) {
      try {
        const connection = new Redis(config.redis.url, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        });

        connection.on('error', (err) => {
          logger.warn(`[Redis Queue] Connection error: ${err.message}. Using In-Memory Worker.`);
        });

        connection.on('connect', () => {
          logger.info('[Redis Queue] Connected to Redis successfully.');
        });

        this.bullQueue = new Queue('resume-processing-queue', { connection });

        new Worker(
          'resume-processing-queue',
          async (job: Job<ResumeJobData>) => {
            await this.processResumeJob(job.data);
          },
          { connection, concurrency: this.maxConcurrency }
        );

        logger.info('[Queue] BullMQ Redis Queue initialized.');
      } catch (err: any) {
        logger.warn(`[Queue] Failed to initialize BullMQ: ${err.message}. Defaulting to In-Memory Queue.`);
        this.bullQueue = null;
      }
    } else {
      logger.info('[Queue] Redis not configured. Running with high-performance In-Memory Background Worker.');
    }
  }

  /**
   * Add a resume to the processing queue
   */
  async addResumeJob(data: ResumeJobData): Promise<void> {
    // Mark as queued in database
    await Resume.findByIdAndUpdate(data.resumeId, {
      processingStatus: 'Queued',
    });

    this.emitProgress(data.resumeId, data.batchId, 'Queued', 10);

    if (this.bullQueue) {
      await this.bullQueue.add('process-resume', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
    } else {
      // In-Memory Queue processing
      this.inMemoryQueue.push(data);
      this.triggerInMemoryProcessor();
    }
  }

  private async triggerInMemoryProcessor() {
    if (this.isProcessingInMemory || this.inMemoryQueue.length === 0) return;
    this.isProcessingInMemory = true;

    try {
      while (this.inMemoryQueue.length > 0) {
        const job = this.inMemoryQueue.shift();
        if (!job) break;

        try {
          await this.processResumeJob(job);
        } catch (jobErr: any) {
          logger.error(`[Queue] Failed processing job for resume ${job.resumeId}: ${jobErr.message}`);
        }
      }
    } finally {
      this.isProcessingInMemory = false;
    }
  }

  /**
   * Helper to generate a collision-free sequential candidate ID
   */
  private async generateUniqueCandidateId(): Promise<string> {
    const count = await Candidate.countDocuments();
    let num = count + 1;
    while (true) {
      const id = `CAN-2026-${String(num).padStart(4, '0')}`;
      const exists = await Candidate.exists({ candidateId: id });
      if (!exists) return id;
      num++;
    }
  }

  /**
   * Core execution pipeline for single resume extraction and candidate generation
   */
  async processResumeJob(data: ResumeJobData): Promise<void> {
    const startTime = Date.now();
    const { resumeId, filePath, originalFileName, uploadedBy, batchId } = data;

    logger.info(`[Queue] Beginning processing for resume ${resumeId} (${originalFileName})`);

    try {
      // 1. Update status to Processing
      await Resume.findByIdAndUpdate(resumeId, {
        processingStatus: 'Processing',
      });
      this.emitProgress(resumeId, batchId, 'Processing', 30);

      // 2. Compute file hash
      let fileHash = '';
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      }

      // 3. Extract text from document
      this.emitProgress(resumeId, batchId, 'Extracting Text', 50);
      const parseResult = await parserService.extractText(filePath, originalFileName);

      // 4. Send extracted text to Extraction Service
      this.emitProgress(resumeId, batchId, 'Extracting Candidate Data', 75);
      const aiData = await aiService.extractCandidateData(parseResult.text, originalFileName);

      // 5. Check if Candidate already exists with a verified, REAL email (never merge on placeholder emails)
      let candidateRecord;
      const candidateEmail = aiData.personalInformation?.email?.trim().toLowerCase();
      const isRealEmail =
        candidateEmail &&
        candidateEmail.includes('@') &&
        !candidateEmail.includes('needs-verification') &&
        !candidateEmail.includes('unknown.email') &&
        !candidateEmail.endsWith('.local');

      if (isRealEmail) {
        const existingCandidate = await Candidate.findOne({
          'personalInformation.email': candidateEmail,
          isArchived: { $ne: true },
        });

        if (existingCandidate) {
          logger.info(`[Queue] Updating candidate profile for existing email: ${candidateEmail}`);
          existingCandidate.personalInformation = {
            ...existingCandidate.personalInformation,
            ...aiData.personalInformation,
          };
          existingCandidate.skills = aiData.skills;
          existingCandidate.professionalInformation = {
            ...existingCandidate.professionalInformation,
            ...aiData.professionalInformation,
          };
          existingCandidate.education = aiData.education as any;
          existingCandidate.resumeId = resumeId as any;
          existingCandidate.statusHistory.push({
            previousStatus: existingCandidate.recruitmentStatus,
            newStatus: 'Screened',
            updatedBy: uploadedBy as any,
            comments: 'Updated profile from newly uploaded resume version',
            timestamp: new Date(),
          });
          existingCandidate.recruitmentStatus = 'Screened';
          await existingCandidate.save();
          candidateRecord = existingCandidate;
        }
      }

      // If no candidate record merged, create a brand new distinct candidate
      if (!candidateRecord) {
        let created = false;
        let attempts = 0;
        while (!created && attempts < 10) {
          try {
            const nextCandidateId = await this.generateUniqueCandidateId();
            candidateRecord = await Candidate.create({
              candidateId: nextCandidateId,
              personalInformation: aiData.personalInformation,
              professionalInformation: aiData.professionalInformation,
              skills: aiData.skills,
              education: aiData.education,
              resumeId,
              recruitmentStatus: 'Screened',
              extractionConfidence: aiData.confidenceScore || 0.9,
              statusHistory: [
                {
                  newStatus: 'Screened',
                  updatedBy: uploadedBy,
                  comments: 'Extracted and verified by TalentFlow document parser',
                  timestamp: new Date(),
                },
              ],
            });
            created = true;
          } catch (createErr: any) {
            if (createErr.code === 11000) {
              attempts++;
            } else {
              throw createErr;
            }
          }
        }
      }

      // 6. Update Resume document
      const durationMs = Date.now() - startTime;
      await Resume.findByIdAndUpdate(resumeId, {
        candidateId: candidateRecord?._id,
        processingStatus: 'Extracted',
        rawExtractedText: parseResult.text.slice(0, 10000), // store preview of text
        fileHash,
        extractionMetadata: {
          durationMs,
          confidenceScore: aiData.confidenceScore || 0.9,
          provider: aiData.provider || 'RuleBasedParser',
          method: parseResult.method,
        },
      });

      this.emitProgress(resumeId, batchId, 'Extracted', 100);

      // 7. Send notification to user
      if (candidateRecord) {
        await notificationService.sendNotification({
          userId: uploadedBy,
          title: 'Resume Processed Successfully',
          message: `Candidate "${aiData.personalInformation.fullName}" extracted from ${originalFileName}. Ready for screening.`,
          notificationType: 'resume_processed',
          entityType: 'candidate',
          entityId: candidateRecord._id,
          metadata: {
            candidateId: candidateRecord.candidateId,
            fullName: aiData.personalInformation.fullName,
          },
        });
      }

      logger.info(`[Queue] Resume ${resumeId} processed successfully in ${durationMs}ms`);
    } catch (err: any) {
      logger.error(`[Queue Error] Failed processing resume ${resumeId}: ${err.message}`);

      await Resume.findByIdAndUpdate(resumeId, {
        processingStatus: 'Failed',
        errorMessage: err.message,
      });

      this.emitProgress(resumeId, batchId, 'Failed', 100, err.message);

      await notificationService.sendNotification({
        userId: uploadedBy,
        title: 'Resume Processing Failed',
        message: `Failed to extract information from ${originalFileName}: ${err.message}`,
        notificationType: 'resume_failed',
        entityType: 'resume',
        entityId: resumeId,
      });
    } finally {
      // Ephemeral storage policy: Delete temporary file immediately after processing
      if (filePath) {
        storageService.deleteTempFile(filePath);
      }
    }
  }

  private emitProgress(
    resumeId: string,
    batchId?: string,
    status: string = '',
    progress: number = 0,
    error?: string
  ) {
    logger.debug(
      `[Resume Progress] ${resumeId} (batch: ${batchId || 'single'}): ${status} ${progress}% ${
        error ? `(Error: ${error})` : ''
      }`
    );
  }
}

export const resumeProcessingManager = new ResumeProcessingManager();

