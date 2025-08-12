export interface Bindings {
  // R2 Storage buckets
  MEDIA_BUCKET: R2Bucket;
  VERIFICATION_BUCKET: R2Bucket;
  
  // Environment variables
  AUTH_SERVICE_URL: string;
  ALLOWED_FILE_TYPES: string;
  MAX_FILE_SIZE: string;
  JWT_SECRET: string;
  
  // Database (if using D1)
  DB?: D1Database;
}

export interface FileMetadata {
  id: string;
  userId: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadType: UploadType;
  category?: string;
  uploadedAt: string;
  url: string;
  isPublic: boolean;
  metadata?: Record<string, any>;
}

export type UploadType = 
  | 'verification'  // For ID verification (front, back, selfie)
  | 'job'          // For job posting assets
  | 'chat'         // For chat attachments
  | 'profile'      // For profile pictures
  | 'other';

export type VerificationDocType = 'front' | 'back' | 'selfie';

export interface UploadRequest {
  type: UploadType;
  category?: string;
  isPublic?: boolean;
  metadata?: Record<string, any>;
}

export interface ChatUploadRequest extends UploadRequest {
  chatId: string;
  messageId?: string;
}

export interface JobUploadRequest extends UploadRequest {
  jobId?: string; // Optional for draft jobs
}

export interface VerificationUploadRequest extends UploadRequest {
  docType: VerificationDocType;
}
