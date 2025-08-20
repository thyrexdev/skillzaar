import type { UploadType, FileMetadata } from '../types/bindings';

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm'
];

export const getAllowedTypes = (uploadType: UploadType): string[] => {
  switch (uploadType) {
    case 'verification':
      return ALLOWED_IMAGE_TYPES; // Only images for ID verification
    case 'job':
      return [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]; // Images and documents for job posts
    case 'chat':
      return [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_VIDEO_TYPES]; // All types for chat
    case 'profile':
      return ALLOWED_IMAGE_TYPES; // Only images for profiles
    default:
      return ALLOWED_IMAGE_TYPES;
  }
};

export const getMaxFileSize = (uploadType: UploadType): number => {
  switch (uploadType) {
    case 'verification':
      return 10 * 1024 * 1024; // 10MB for ID documents
    case 'job':
      return 50 * 1024 * 1024; // 50MB for job assets
    case 'chat':
      return 100 * 1024 * 1024; // 100MB for chat files
    case 'profile':
      return 5 * 1024 * 1024; // 5MB for profile pics
    default:
      return 10 * 1024 * 1024;
  }
};

export const generateFileName = (
  originalName: string,
  userId: string,
  uploadType: UploadType,
  category?: string
): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  
  const prefix = category ? `${uploadType}/${category}` : uploadType;
  return `${prefix}/${userId}/${timestamp}_${random}.${extension}`;
};

export const validateFile = (
  file: File,
  uploadType: UploadType
): { valid: boolean; error?: string } => {
  const allowedTypes = getAllowedTypes(uploadType);
  const maxSize = getMaxFileSize(uploadType);

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed for ${uploadType} uploads. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size ${Math.round(file.size / (1024 * 1024))}MB exceeds maximum allowed size of ${maxSizeMB}MB for ${uploadType} uploads`
    };
  }

  return { valid: true };
};

export const createFileMetadata = (
  file: File,
  fileName: string,
  userId: string,
  uploadType: UploadType,
  category?: string,
  isPublic: boolean = false,
  additionalMetadata?: Record<string, any>
): FileMetadata => {
  return {
    id: crypto.randomUUID(),
    userId,
    fileName,
    originalName: file.name,
    fileType: file.type,
    fileSize: file.size,
    uploadType,
    category,
    uploadedAt: new Date().toISOString(),
    url: '', // Will be set after successful upload
    isPublic,
    metadata: {
      lastModified: file.lastModified,
      ...additionalMetadata
    }
  };
};

export const getFileUrl = (fileName: string, bucketUrl: string): string => {
  return `${bucketUrl}/${fileName}`;
};

export const isImageFile = (fileType: string): boolean => {
  return ALLOWED_IMAGE_TYPES.includes(fileType);
};

export const isVideoFile = (fileType: string): boolean => {
  return ALLOWED_VIDEO_TYPES.includes(fileType);
};

export const isDocumentFile = (fileType: string): boolean => {
  return ALLOWED_DOCUMENT_TYPES.includes(fileType);
};
