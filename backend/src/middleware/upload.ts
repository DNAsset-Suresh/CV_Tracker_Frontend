import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';

// Ensure temporary storage directory exists
if (!fs.existsSync(config.storage.tempDir)) {
  fs.mkdirSync(config.storage.tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.storage.tempDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedExt = path.extname(file.originalname).toLowerCase();
    cb(null, `resume-${uniqueSuffix}${sanitizedExt}`);
  },
});

const allowedMimes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/tiff',
];

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.tiff'];

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype} (${ext}). Only PDF, DOC, DOCX, and scanned document formats are accepted.`
      )
    );
  }
};

export const uploadSingle = multer({
  storage,
  limits: { fileSize: config.storage.maxFileSizeMb * 1024 * 1024 },
  fileFilter,
}).single('resume');

export const uploadBulk = multer({
  storage,
  limits: { fileSize: config.storage.maxFileSizeMb * 1024 * 1024 },
  fileFilter,
}).array('resumes', 50); // Accept up to 50 files in a single bulk batch
