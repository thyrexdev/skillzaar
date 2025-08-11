import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from '@frevix/config/dist/logger';
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

export default {
    port: process.env.PORT || 5001,
    fetch: app.fetch,
};
