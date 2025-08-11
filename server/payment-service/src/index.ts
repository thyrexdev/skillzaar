import { Hono } from 'hono';
import { logger } from '@frevix/config/dist/logger';

const app = new Hono();


logger.info(`🚀 Payment service running on port`)

export default {
    port: process.env.PORT || 5005,
    fetch: app.fetch,
};