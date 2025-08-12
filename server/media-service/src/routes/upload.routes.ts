import { Hono } from 'hono';
import type { Bindings, UploadType } from '../types/bindings';
import { validateFile, generateFileName, createFileMetadata, getFileUrl } from '../utils/fileUtils';

export const uploadRoutes = new Hono<{ Bindings: Bindings }>();

// Generic upload endpoint
uploadRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('type') as UploadType;
    const category = formData.get('category') as string;
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    if (!uploadType || !['verification', 'job', 'chat', 'profile', 'other'].includes(uploadType)) {
      return c.json({ error: 'Invalid upload type. Must be: verification, job, chat, profile, or other' }, 400);
    }

    // Validate file
    const validation = validateFile(file, uploadType);
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    // Generate file name
    const fileName = generateFileName(file.name, user.id, uploadType, category);

    // Create metadata
    const metadata = createFileMetadata(
      file,
      fileName,
      user.id,
      uploadType,
      category,
      isPublic
    );

    // Choose bucket based on upload type
    const bucket = uploadType === 'verification' ? c.env.VERIFICATION_BUCKET : c.env.MEDIA_BUCKET;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: isPublic ? 'inline' : `attachment; filename="${file.name}"`,
        cacheControl: isPublic ? 'public, max-age=31536000' : 'private, max-age=86400',
      },
      customMetadata: {
        userId: user.id,
        uploadType,
        category: category || '',
        uploadedAt: metadata.uploadedAt,
        originalName: file.name,
        isPublic: isPublic.toString(),
      },
    });

    // Set file URL
    metadata.url = isPublic 
      ? getFileUrl(fileName, 'https://your-public-bucket-url.com') 
      : `/api/files/${metadata.id}`;

    return c.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: metadata.id,
        fileName,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadType,
        category,
        url: metadata.url,
        isPublic,
        uploadedAt: metadata.uploadedAt
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

// Upload profile picture
uploadRoutes.post('/profile', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file for profile upload
    const validation = validateFile(file, 'profile');
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    // Generate file name
    const fileName = generateFileName(file.name, user.id, 'profile', 'avatar');

    // Create metadata
    const metadata = createFileMetadata(
      file,
      fileName,
      user.id,
      'profile',
      'avatar',
      true // Profile pictures are typically public
    );

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.MEDIA_BUCKET.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: 'inline',
        cacheControl: 'public, max-age=31536000',
      },
      customMetadata: {
        userId: user.id,
        uploadType: 'profile',
        category: 'avatar',
        uploadedAt: metadata.uploadedAt,
        originalName: file.name,
        isPublic: 'true',
      },
    });

    // Set file URL
    metadata.url = getFileUrl(fileName, 'https://your-public-bucket-url.com');

    // Store/update profile picture reference
    if (c.env.DB) {
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO user_profiles 
        (user_id, profile_picture_url, updated_at)
        VALUES (?, ?, ?)
      `).bind(user.id, metadata.url, metadata.uploadedAt).run();
    }

    return c.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePictureUrl: metadata.url
    });

  } catch (error) {
    console.error('Profile upload error:', error);
    return c.json({ error: 'Profile upload failed' }, 500);
  }
});

// Bulk upload endpoint
uploadRoutes.post('/bulk', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    const formData = await c.req.formData();
    const files = formData.getAll('files') as File[];
    const uploadType = formData.get('type') as UploadType;
    const category = formData.get('category') as string;
    const isPublic = formData.get('isPublic') === 'true';

    if (!files || files.length === 0) {
      return c.json({ error: 'No files provided' }, 400);
    }

    if (files.length > 20) {
      return c.json({ error: 'Maximum 20 files allowed per bulk upload' }, 400);
    }

    if (!uploadType || !['job', 'chat', 'other'].includes(uploadType)) {
      return c.json({ error: 'Invalid upload type for bulk upload. Must be: job, chat, or other' }, 400);
    }

    const uploadedFiles = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Validate file
        const validation = validateFile(file, uploadType);
        if (!validation.valid) {
          errors.push({ file: file.name, error: validation.error });
          continue;
        }

        // Generate file name
        const fileName = generateFileName(file.name, user.id, uploadType, category);

        // Create metadata
        const metadata = createFileMetadata(
          file,
          fileName,
          user.id,
          uploadType,
          category,
          isPublic,
          { bulkUpload: true, batchIndex: i }
        );

        // Upload to R2
        const arrayBuffer = await file.arrayBuffer();
        await c.env.MEDIA_BUCKET.put(fileName, arrayBuffer, {
          httpMetadata: {
            contentType: file.type,
            contentDisposition: isPublic ? 'inline' : `attachment; filename="${file.name}"`,
            cacheControl: isPublic ? 'public, max-age=31536000' : 'private, max-age=86400',
          },
          customMetadata: {
            userId: user.id,
            uploadType,
            category: category || '',
            uploadedAt: metadata.uploadedAt,
            originalName: file.name,
            isPublic: isPublic.toString(),
            bulkUpload: 'true',
          },
        });

        // Set file URL
        metadata.url = isPublic 
          ? getFileUrl(fileName, 'https://your-public-bucket-url.com') 
          : `/api/files/${metadata.id}`;

        uploadedFiles.push({
          id: metadata.id,
          fileName,
          originalName: file.name,
          fileSize: file.size,
          fileType: file.type,
          url: metadata.url,
          uploadedAt: metadata.uploadedAt
        });

      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        errors.push({ file: file.name, error: 'Upload failed' });
      }
    }

    return c.json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return c.json({ error: 'Bulk upload failed' }, 500);
  }
});

// Get upload limits and allowed types
uploadRoutes.get('/config', (c) => {
  const uploadType = c.req.query('type') as UploadType || 'other';
  
  return c.json({
    uploadType,
    maxFileSize: {
      verification: 10 * 1024 * 1024, // 10MB
      job: 50 * 1024 * 1024, // 50MB
      chat: 100 * 1024 * 1024, // 100MB
      profile: 5 * 1024 * 1024, // 5MB
      other: 10 * 1024 * 1024, // 10MB
    },
    allowedTypes: {
      verification: ['image/jpeg', 'image/png', 'image/webp'],
      job: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      chat: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'video/mp4', 'video/quicktime', 'video/webm'],
      profile: ['image/jpeg', 'image/png', 'image/webp'],
      other: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    },
    maxFiles: {
      verification: 3, // front, back, selfie with ID
      job: 10,
      chat: 0, // 0 means unlimited
      profile: 1,
      other: 5
    }
  });
});
