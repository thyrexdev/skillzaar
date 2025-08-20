import { Hono } from 'hono';
import type { Bindings, ChatUploadRequest } from '../types/bindings';
import { validateFile, generateFileName, createFileMetadata, getFileUrl } from '../utils/fileUtils';

export const chatRoutes = new Hono<{ Bindings: Bindings }>();

// Upload chat attachments
chatRoutes.post('/upload', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    const formData = await c.req.formData();
    const files = formData.getAll('files') as File[];
    const chatId = formData.get('chatId') as string;
    const messageId = formData.get('messageId') as string;

    if (!files || files.length === 0) {
      return c.json({ error: 'No files provided' }, 400);
    }

    if (!chatId) {
      return c.json({ error: 'Chat ID required' }, 400);
    }

    // No limit on number of files for chat attachments

    // Verify user has access to this chat
    // This should be implemented based on your chat service logic
    // For now, we'll skip this validation

    const uploadedFiles = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Validate file
        const validation = validateFile(file, 'chat');
        if (!validation.valid) {
          errors.push({ file: file.name, error: validation.error });
          continue;
        }

        // Generate file name
        const fileName = generateFileName(file.name, user.id, 'chat', chatId);

        // Create metadata
        const metadata = createFileMetadata(
          file,
          fileName,
          user.id,
          'chat',
          'attachment',
          false, // Chat files are private by default
          { chatId, messageId, index: i }
        );

        // Upload to R2
        const arrayBuffer = await file.arrayBuffer();
        await c.env.MEDIA_BUCKET.put(fileName, arrayBuffer, {
          httpMetadata: {
            contentType: file.type,
            contentDisposition: `attachment; filename="${file.name}"`,
            cacheControl: 'private, max-age=86400', // 24 hours cache
          },
          customMetadata: {
            userId: user.id,
            chatId,
            messageId: messageId || '',
            uploadedAt: metadata.uploadedAt,
            originalName: file.name,
          },
        });

        // Set file URL (with authentication required)
        metadata.url = `/api/chat/files/${metadata.id}`;

        // Store metadata in database (if available)
        if (c.env.DB) {
          await c.env.DB.prepare(`
            INSERT INTO chat_attachments 
            (id, user_id, chat_id, message_id, file_name, original_name, file_type, file_size, url, uploaded_at, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            metadata.id,
            user.id,
            chatId,
            messageId || null,
            fileName,
            file.name,
            file.type,
            file.size,
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
    console.error('Chat upload error:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

// Get chat file (authenticated access)
chatRoutes.get('/files/:fileId', async (c) => {
  try {
    const fileId = c.req.param('fileId');
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    // Get file info from database
    let fileData: any = null;
    if (c.env.DB) {
      const result = await c.env.DB.prepare(`
        SELECT ca.*, c.participant_1, c.participant_2 
        FROM chat_attachments ca
        LEFT JOIN chats c ON ca.chat_id = c.id
        WHERE ca.id = ?
      `).bind(fileId).first();

      fileData = result;
    }

    if (!fileData) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Check if user has access to this chat
    const hasAccess = fileData.user_id === user.id || 
                     fileData.participant_1 === user.id || 
                     fileData.participant_2 === user.id;

    if (!hasAccess) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get file from R2
    const file = await c.env.MEDIA_BUCKET.get(fileData.file_name);
    if (!file) {
      return c.json({ error: 'File not found in storage' }, 404);
    }

    // Return file with appropriate headers
    return new Response(file.body, {
      headers: {
        'Content-Type': fileData.file_type,
        'Content-Disposition': `attachment; filename="${fileData.original_name}"`,
        'Content-Length': fileData.file_size.toString(),
        'Cache-Control': 'private, max-age=86400',
      },
    });

  } catch (error) {
    console.error('Get chat file error:', error);
    return c.json({ error: 'Failed to get file' }, 500);
  }
});

// Get chat attachments
chatRoutes.get('/:chatId/attachments', async (c) => {
  try {
    const chatId = c.req.param('chatId');
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    if (!chatId) {
      return c.json({ error: 'Chat ID required' }, 400);
    }

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    let attachments = [];
    let total = 0;

    if (c.env.DB) {
      // Verify user has access to this chat
      const chatAccess = await c.env.DB.prepare(`
        SELECT id FROM chats 
        WHERE id = ? AND (participant_1 = ? OR participant_2 = ?)
      `).bind(chatId, user.id, user.id).first();

      if (!chatAccess) {
        return c.json({ error: 'Chat not found or access denied' }, 403);
      }

      // Get total count
      const countResult = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM chat_attachments WHERE chat_id = ?
      `).bind(chatId).first();
      total = countResult?.count as number || 0;

      // Get attachments
      const result = await c.env.DB.prepare(`
        SELECT id, user_id, message_id, original_name, file_type, file_size, url, uploaded_at
        FROM chat_attachments 
        WHERE chat_id = ?
        ORDER BY uploaded_at DESC
        LIMIT ? OFFSET ?
      `).bind(chatId, limit, offset).all();

      attachments = result.results || [];
    }

    return c.json({
      attachments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get chat attachments error:', error);
    return c.json({ error: 'Failed to get chat attachments' }, 500);
  }
});

// Delete chat attachment
chatRoutes.delete('/attachments/:attachmentId', async (c) => {
  try {
    const attachmentId = c.req.param('attachmentId');
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    // Get attachment info from database
    let attachmentData: any = null;
    if (c.env.DB) {
      const result = await c.env.DB.prepare(`
        SELECT file_name, user_id FROM chat_attachments 
        WHERE id = ?
      `).bind(attachmentId).first();

      attachmentData = result;
    }

    if (!attachmentData) {
      return c.json({ error: 'Attachment not found' }, 404);
    }

    // Only the uploader can delete the attachment
    if (attachmentData.user_id !== user.id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Delete from R2
    await c.env.MEDIA_BUCKET.delete(attachmentData.file_name);

    // Delete from database
    if (c.env.DB) {
      await c.env.DB.prepare(`
        DELETE FROM chat_attachments WHERE id = ?
      `).bind(attachmentId).run();
    }

    return c.json({
      success: true,
      message: 'Attachment deleted successfully'
    });

  } catch (error) {
    console.error('Delete chat attachment error:', error);
    return c.json({ error: 'Failed to delete attachment' }, 500);
  }
});

// Get attachment metadata
chatRoutes.get('/attachments/:attachmentId/info', async (c) => {
  try {
    const attachmentId = c.req.param('attachmentId');
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    let attachmentData: any = null;
    if (c.env.DB) {
      const result = await c.env.DB.prepare(`
        SELECT ca.id, ca.original_name, ca.file_type, ca.file_size, ca.uploaded_at, ca.user_id,
               c.participant_1, c.participant_2
        FROM chat_attachments ca
        LEFT JOIN chats c ON ca.chat_id = c.id
        WHERE ca.id = ?
      `).bind(attachmentId).first();

      attachmentData = result;
    }

    if (!attachmentData) {
      return c.json({ error: 'Attachment not found' }, 404);
    }

    // Check if user has access to this chat
    const hasAccess = attachmentData.user_id === user.id || 
                     attachmentData.participant_1 === user.id || 
                     attachmentData.participant_2 === user.id;

    if (!hasAccess) {
      return c.json({ error: 'Access denied' }, 403);
    }

    return c.json({
      id: attachmentData.id,
      originalName: attachmentData.original_name,
      fileType: attachmentData.file_type,
      fileSize: attachmentData.file_size,
      uploadedAt: attachmentData.uploaded_at,
      uploadedBy: attachmentData.user_id
    });

  } catch (error) {
    console.error('Get attachment info error:', error);
    return c.json({ error: 'Failed to get attachment info' }, 500);
  }
});
