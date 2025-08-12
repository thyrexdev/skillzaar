import { Hono } from 'hono';
import type { Bindings, JobUploadRequest } from '../types/bindings';
import { validateFile, generateFileName, createFileMetadata, getFileUrl } from '../utils/fileUtils';

export const jobRoutes = new Hono<{ Bindings: Bindings }>();

// Upload job assets
jobRoutes.post('/upload', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    const formData = await c.req.formData();
    const files = formData.getAll('files') as File[];
    const jobId = formData.get('jobId') as string;
    const category = formData.get('category') as string || 'general';
    const isPublic = formData.get('isPublic') === 'true';

    if (!files || files.length === 0) {
      return c.json({ error: 'No files provided' }, 400);
    }

    if (files.length > 10) {
      return c.json({ error: 'Maximum 10 files allowed per upload' }, 400);
    }

    const uploadedFiles = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Validate file
        const validation = validateFile(file, 'job');
        if (!validation.valid) {
          errors.push({ file: file.name, error: validation.error });
          continue;
        }

        // Generate file name
        const fileName = generateFileName(file.name, user.id, 'job', category);

        // Create metadata
        const metadata = createFileMetadata(
          file,
          fileName,
          user.id,
          'job',
          category,
          isPublic,
          { jobId, index: i }
        );

        // Upload to R2
        const arrayBuffer = await file.arrayBuffer();
        await c.env.MEDIA_BUCKET.put(fileName, arrayBuffer, {
          httpMetadata: {
            contentType: file.type,
            contentDisposition: isPublic ? 'inline' : `attachment; filename="${file.name}"`,
            cacheControl: isPublic ? 'public, max-age=31536000' : 'private, max-age=0',
          },
          customMetadata: {
            userId: user.id,
            jobId: jobId || '',
            category,
            uploadedAt: metadata.uploadedAt,
            originalName: file.name,
            isPublic: isPublic.toString(),
          },
        });

        // Set file URL
        metadata.url = getFileUrl(fileName, 'https://your-bucket-url.com'); // Replace with actual bucket URL

        // Store metadata in database (if available)
        if (c.env.DB) {
          await c.env.DB.prepare(`
            INSERT INTO job_assets 
            (id, user_id, job_id, file_name, original_name, file_type, file_size, category, is_public, url, uploaded_at, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            metadata.id,
            user.id,
            jobId || null,
            fileName,
            file.name,
            file.type,
            file.size,
            category,
            isPublic ? 1 : 0,
            metadata.url,
            metadata.uploadedAt,
            JSON.stringify(metadata.metadata)
          ).run();
        }

        uploadedFiles.push({
          id: metadata.id,
          fileName,
          originalName: file.name,
          fileSize: file.size,
          fileType: file.type,
          category,
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
    console.error('Job upload error:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

// Get job assets
jobRoutes.get('/:jobId/assets', async (c) => {
  try {
    const jobId = c.req.param('jobId');
    const user = c.get('user');

    if (!jobId) {
      return c.json({ error: 'Job ID required' }, 400);
    }

    let assets = [];

    if (c.env.DB) {
      const result = await c.env.DB.prepare(`
        SELECT id, file_name, original_name, file_type, file_size, category, url, uploaded_at
        FROM job_assets 
        WHERE job_id = ? AND (is_public = 1 OR user_id = ?)
        ORDER BY uploaded_at DESC
      `).bind(jobId, user?.id || '').all();

      assets = result.results || [];
    }

    return c.json({ assets });

  } catch (error) {
    console.error('Get job assets error:', error);
    return c.json({ error: 'Failed to get job assets' }, 500);
  }
});

// Get user's job assets
jobRoutes.get('/my-assets', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    let assets = [];
    let total = 0;

    if (c.env.DB) {
      // Get total count
      const countResult = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM job_assets WHERE user_id = ?
      `).bind(user.id).first();
      total = countResult?.count as number || 0;

      // Get assets
      const result = await c.env.DB.prepare(`
        SELECT id, job_id, file_name, original_name, file_type, file_size, category, is_public, url, uploaded_at
        FROM job_assets 
        WHERE user_id = ?
        ORDER BY uploaded_at DESC
        LIMIT ? OFFSET ?
      `).bind(user.id, limit, offset).all();

      assets = result.results || [];
    }

    return c.json({
      assets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get user job assets error:', error);
    return c.json({ error: 'Failed to get job assets' }, 500);
  }
});

// Delete job asset
jobRoutes.delete('/:assetId', async (c) => {
  try {
    const assetId = c.req.param('assetId');
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    // Get asset info from database
    let fileName: string | null = null;
    if (c.env.DB) {
      const result = await c.env.DB.prepare(`
        SELECT file_name FROM job_assets 
        WHERE id = ? AND user_id = ?
      `).bind(assetId, user.id).first();

      if (result) {
        fileName = result.file_name as string;
      }
    }

    if (!fileName) {
      return c.json({ error: 'Asset not found or access denied' }, 404);
    }

    // Delete from R2
    await c.env.MEDIA_BUCKET.delete(fileName);

    // Delete from database
    if (c.env.DB) {
      await c.env.DB.prepare(`
        DELETE FROM job_assets WHERE id = ? AND user_id = ?
      `).bind(assetId, user.id).run();
    }

    return c.json({
      success: true,
      message: 'Asset deleted successfully'
    });

  } catch (error) {
    console.error('Delete job asset error:', error);
    return c.json({ error: 'Failed to delete asset' }, 500);
  }
});

// Update job asset metadata
jobRoutes.put('/:assetId', async (c) => {
  try {
    const assetId = c.req.param('assetId');
    const user = c.get('user');
    const { category, isPublic } = await c.req.json();

    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    if (c.env.DB) {
      const result = await c.env.DB.prepare(`
        UPDATE job_assets 
        SET category = ?, is_public = ?
        WHERE id = ? AND user_id = ?
      `).bind(category, isPublic ? 1 : 0, assetId, user.id).run();

      if (result.changes === 0) {
        return c.json({ error: 'Asset not found or access denied' }, 404);
      }
    }

    return c.json({
      success: true,
      message: 'Asset updated successfully'
    });

  } catch (error) {
    console.error('Update job asset error:', error);
    return c.json({ error: 'Failed to update asset' }, 500);
  }
});
