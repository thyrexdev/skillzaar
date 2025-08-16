import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { uploadRoutes } from './routes/upload.routes';
import { fileRoutes } from './routes/file.routes';
import { verificationRoutes } from './routes/verification.routes';
import { chatRoutes } from './routes/chat.routes';
import { jobRoutes } from './routes/job.routes';
import type { Bindings } from './types/bindings';

const app = new Hono<{ Bindings: Bindings }>();

// CORS configuration
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Upload-Type'],
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'media-service', timestamp: new Date().toISOString() });
});

// Public upload config endpoint (no auth required)
app.get('/upload/config', (c) => {
  const uploadType = c.req.query('type') || 'other';
  
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

// Protected routes with JWT authentication
app.use('/api/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    // Verify JWT token with auth service
    const authResponse = await fetch(`${c.env.AUTH_SERVICE_URL}/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!authResponse.ok) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const user = await authResponse.json();
    c.set('user', user);
  } catch (error) {
    return c.json({ error: 'Token verification failed' }, 401);
  }

  await next();
});

// Route handlers
app.route('/api/upload', uploadRoutes);
app.route('/api/files', fileRoutes);
app.route('/api/verification', verificationRoutes);
app.route('/api/chat', chatRoutes);
app.route('/api/jobs', jobRoutes);

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Bindings>;
