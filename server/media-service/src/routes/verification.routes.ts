import { Hono } from 'hono';
import type { Bindings, VerificationUploadRequest, VerificationDocType } from '../types/bindings';
import { validateFile, generateFileName, createFileMetadata } from '../utils/fileUtils';

export const verificationRoutes = new Hono<{ Bindings: Bindings }>();

// Upload ID verification documents (front, back, selfie)
verificationRoutes.post('/upload', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const docType = formData.get('docType') as VerificationDocType;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    if (!docType || !['front', 'back', 'selfie'].includes(docType)) {
      return c.json({ error: 'Invalid document type. Must be: front, back, or selfie' }, 400);
    }

    // Validate file
    const validation = validateFile(file, 'verification');
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    // Generate file name
    const fileName = generateFileName(file.name, user.id, 'verification', docType);

    // Create metadata
    const metadata = createFileMetadata(
      file,
      fileName,
      user.id,
      'verification',
      docType,
      false, // Verification docs are never public
      { docType, verificationStatus: 'pending' }
    );

    // Upload to R2 (verification bucket)
    const arrayBuffer = await file.arrayBuffer();
    await c.env.VERIFICATION_BUCKET.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: `attachment; filename="${file.name}"`,
      },
      customMetadata: {
        userId: user.id,
        docType,
        uploadedAt: metadata.uploadedAt,
        originalName: file.name,
      },
    });

    // Store metadata in database (if available)
    if (c.env.DB) {
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO verification_documents 
        (id, user_id, doc_type, file_name, original_name, file_type, file_size, status, uploaded_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        metadata.id,
        user.id,
        docType,
        fileName,
        file.name,
        file.type,
        file.size,
        'pending',
        metadata.uploadedAt,
        JSON.stringify(metadata.metadata)
      ).run();
    }

    return c.json({
      success: true,
      message: `${docType} document uploaded successfully`,
      file: {
        id: metadata.id,
        docType,
        fileName,
        originalName: file.name,
        fileSize: file.size,
        uploadedAt: metadata.uploadedAt,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Verification upload error:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

// Get verification status
verificationRoutes.get('/status', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    let documents = [];

    if (c.env.DB) {
      const result = await c.env.DB.prepare(`
        SELECT doc_type, file_name, original_name, file_size, status, uploaded_at
        FROM verification_documents 
        WHERE user_id = ?
        ORDER BY uploaded_at DESC
      `).bind(user.id).all();

      documents = result.results || [];
    }

    // Check if user has all required documents
    const requiredDocs = ['front', 'back', 'selfie'];
    const uploadedDocs = documents.map((doc: any) => doc.doc_type);
    const missingDocs = requiredDocs.filter(doc => !uploadedDocs.includes(doc));

    const overallStatus = missingDocs.length === 0 
      ? documents.every((doc: any) => doc.status === 'approved') 
        ? 'approved' 
        : documents.some((doc: any) => doc.status === 'rejected')
          ? 'rejected'
          : 'pending'
      : 'incomplete';

    return c.json({
      overallStatus,
      documents,
      missingDocs,
      requiredDocs
    });

  } catch (error) {
    console.error('Get verification status error:', error);
    return c.json({ error: 'Failed to get verification status' }, 500);
  }
});

// Delete verification document (allow re-upload)
verificationRoutes.delete('/:docType', async (c) => {
  try {
    const user = c.get('user');
    const docType = c.req.param('docType') as VerificationDocType;

    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    if (!['front', 'back', 'selfie'].includes(docType)) {
      return c.json({ error: 'Invalid document type' }, 400);
    }

    // Get file info from database
    let fileName: string | null = null;
    if (c.env.DB) {
      const result = await c.env.DB.prepare(`
        SELECT file_name FROM verification_documents 
        WHERE user_id = ? AND doc_type = ?
      `).bind(user.id, docType).first();

      if (result) {
        fileName = result.file_name as string;
      }
    }

    if (fileName) {
      // Delete from R2
      await c.env.VERIFICATION_BUCKET.delete(fileName);

      // Delete from database
      if (c.env.DB) {
        await c.env.DB.prepare(`
          DELETE FROM verification_documents 
          WHERE user_id = ? AND doc_type = ?
        `).bind(user.id, docType).run();
      }
    }

    return c.json({
      success: true,
      message: `${docType} document deleted successfully`
    });

  } catch (error) {
    console.error('Delete verification document error:', error);
    return c.json({ error: 'Failed to delete document' }, 500);
  }
});
