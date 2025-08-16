import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env, logger } from '@vync/config';
import authRoutes from './routes/auth.routes';
import otpRoutes from './routes/otp.routes';
import clientRoutes from './routes/client.routes';
import freelancerRoutes from './routes/freelancer.routes';
import oauthRoutes from './routes/oauth.routes';

const app = new Hono();

// Enable CORS for all routes
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.route('/auth', authRoutes);
app.route('/oauth', oauthRoutes);
app.route('/otp', otpRoutes);
app.route('/client', clientRoutes);
app.route('/freelancer', freelancerRoutes);

// Token verification endpoint for other services
app.post('/verify-token', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const { getUserFromToken } = await import('@vync/shared');
    const user = await getUserFromToken(token);
    return c.json(user, 200);
  } catch (error: any) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

export default {
    port: env.AUTH_SERVICE_PORT,
    fetch: app.fetch,
};
