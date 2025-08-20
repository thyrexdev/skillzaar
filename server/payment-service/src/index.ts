import { Hono } from 'hono';

const app = new Hono();

export default {
    port: process.env.PORT || 5003,
    fetch: app.fetch,
};