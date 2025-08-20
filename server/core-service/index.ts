import { Hono } from "hono";
import { cors } from "hono/cors";
import jobRoutes from "./src/routes/job.route";
import proposalRoutes from "./src/routes/proposal.route";
import { env } from "@vync/config";

const app = new Hono();

// Add CORS middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'Core service is running', timestamp: new Date().toISOString() });
});

app.route('/job', jobRoutes);
app.route('/proposals', proposalRoutes);

export default {
    port: env.CORE_SERVICE_PORT,
    fetch: app.fetch,
};

