import multer from 'multer';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { config } from '../config/index.js';

const uploadDir = path.join(os.tmpdir(), 'bank-statement-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const statementUpload = multer({
  dest: uploadDir,
  limits: {
    fileSize: config.upload.maxFileSize
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (config.upload.allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only ${config.upload.allowedExtensions.join(' and ')} files are supported.`));
    }
  }
});

/**
 * Safely removes a temporary file from disk.
 */
export function removeTempFile(filePath?: string): void {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.warn(`[Cleanup] Failed to remove temporary file: ${filePath}`, err);
    }
  }
}
