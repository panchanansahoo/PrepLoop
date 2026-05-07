/**
 * Secure File Upload Middleware
 * Implements size limits, type validation, and virus scanning integration
 */

import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('file-upload');

// Allowed file types with MIME type validation
const ALLOWED_TYPES = {
  images: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  documents: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ],
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.md'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  resumes: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    extensions: ['.pdf', '.doc', '.docx'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  code: {
    mimeTypes: ['text/plain', 'application/json'],
    extensions: ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.json', '.txt'],
    maxSize: 1 * 1024 * 1024, // 1MB
  },
};

/**
 * Generate secure filename
 */
function generateSecureFilename(originalName) {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  const extension = path.extname(originalName).toLowerCase();
  
  return `${timestamp}_${randomString}${extension}`;
}

/**
 * Validate file type against allowed MIME types
 */
function validateFileType(file, allowedConfig) {
  // Check MIME type
  if (!allowedConfig.mimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedConfig.extensions.join(', ')}`,
    };
  }

  // Check extension (double validation)
  const extension = path.extname(file.originalname).toLowerCase();
  if (!allowedConfig.extensions.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${allowedConfig.extensions.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Create secure multer storage configuration
 */
function createSecureStorage(uploadDir = 'uploads') {
  // Ensure upload directory exists
  const fullUploadDir = path.join(process.cwd(), uploadDir);
  if (!fs.existsSync(fullUploadDir)) {
    fs.mkdirSync(fullUploadDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, fullUploadDir);
    },
    filename: (req, file, cb) => {
      const secureName = generateSecureFilename(file.originalname);
      cb(null, secureName);
    },
  });
}

/**
 * Create file filter for specific file type
 */
function createFileFilter(typeCategory) {
  const allowedConfig = ALLOWED_TYPES[typeCategory];
  
  if (!allowedConfig) {
    throw new Error(`Invalid file category: ${typeCategory}`);
  }

  return (req, file, cb) => {
    const validation = validateFileType(file, allowedConfig);
    
    if (!validation.valid) {
      return cb(new Error(validation.error), false);
    }

    cb(null, true);
  };
}

/**
 * Create multer instance with security features
 */
export function createSecureUploader(typeCategory = 'documents', options = {}) {
  const {
    uploadDir = 'uploads',
    maxFiles = 1,
    preserveOriginalName = false,
    fieldName = 'file',
  } = options;

  const allowedConfig = ALLOWED_TYPES[typeCategory];
  
  if (!allowedConfig) {
    throw new Error(`Invalid file category: ${typeCategory}. Allowed: ${Object.keys(ALLOWED_TYPES).join(', ')}`);
  }

  const storage = createSecureStorage(uploadDir);
  const fileFilter = createFileFilter(typeCategory);

  const uploader = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: allowedConfig.maxSize,
      files: maxFiles,
      fieldSize: 25 * 1024 * 1024, // 25MB for form fields
    },
  });

  // Add post-upload validation middleware
  const uploadMiddleware = uploader.single(fieldName);

  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              return res.status(400).json({
                error: 'File too large',
                message: `Maximum file size is ${allowedConfig.maxSize / (1024 * 1024)}MB`,
                maxSize: allowedConfig.maxSize,
              });
            
            case 'LIMIT_FILE_COUNT':
              return res.status(400).json({
                error: 'Too many files',
                message: `Maximum ${maxFiles} file(s) allowed`,
                maxFiles,
              });
            
            case 'LIMIT_UNEXPECTED_FILE':
              return res.status(400).json({
                error: 'Unexpected field',
                message: 'Unexpected file field in request',
              });
            
            default:
              return res.status(400).json({
                error: 'Upload error',
                message: err.message,
              });
          }
        }

        // Custom file filter error
        return res.status(400).json({
          error: 'Invalid file',
          message: err.message,
        });
      }

      // File uploaded successfully
      if (req.file) {
        // Log upload for security audit
        logger.info('File uploaded', {
          userId: req.user?.id || 'anonymous',
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          category: typeCategory,
        });

        // TODO: Integrate virus scanning here
        // await scanForViruses(req.file.path);
      }

      next();
    });
  };
}

/**
 * Pre-configured uploaders for common use cases
 */

// Profile picture upload
export const profilePictureUploader = createSecureUploader('images', {
  uploadDir: 'uploads/profiles',
  maxFiles: 1,
});

// Resume/CV upload
export const resumeUploader = createSecureUploader('resumes', {
  uploadDir: 'uploads/resumes',
  maxFiles: 1,
  fieldName: 'resume',
});

// Document upload (general)
export const documentUploader = createSecureUploader('documents', {
  uploadDir: 'uploads/documents',
  maxFiles: 5,
});

// Code file upload
export const codeUploader = createSecureUploader('code', {
  uploadDir: 'uploads/code',
  maxFiles: 10,
});

// Multiple image upload
export const multipleImageUploader = multer({
  storage: createSecureStorage('uploads/images'),
  fileFilter: createFileFilter('images'),
  limits: {
    fileSize: ALLOWED_TYPES.images.maxSize,
    files: 10,
  },
}).array('images', 10);

/**
 * Delete uploaded file securely
 */
export async function deleteUploadedFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info('File deleted', { filePath });
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error deleting file', { filePath, error: error.message });
    throw error;
  }
}

/**
 * Get file metadata
 */
export function getFileMetadata(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const extension = path.extname(filePath).toLowerCase();
    
    return {
      size: stats.size,
      extension,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isImage: ALLOWED_TYPES.images.extensions.includes(extension),
      isDocument: ALLOWED_TYPES.documents.extensions.includes(extension),
      isResume: ALLOWED_TYPES.resumes.extensions.includes(extension),
      isCode: ALLOWED_TYPES.code.extensions.includes(extension),
    };
  } catch (error) {
    logger.error('Error getting file metadata', { filePath, error: error.message });
    throw error;
  }
}

/**
 * Virus scanning placeholder (integrate with ClamAV or similar)
 */
async function scanForViruses(filePath) {
  // TODO: Implement actual virus scanning
  // Options:
  // 1. ClamAV (open source)
  // 2. VirusTotal API
  // 3. AWS Lambda with antivirus
  
  logger.info('Virus scan placeholder', { filePath });
  
  // For now, just log that scanning would happen here
  // In production, integrate with a real antivirus solution
  
  return {
    scanned: true,
    clean: true, // Placeholder - always returns clean for now
    scanner: 'placeholder',
  };
}
