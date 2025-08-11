import { Hono } from "hono";
import jobRoutes from "./src/routes/job.route";
import proposalRoutes from "./src/routes/proposal.route";

const app = new Hono();

app.route('/job', jobRoutes);
app.route('/proposals', proposalRoutes);

export default {
    port: process.env.PORT || 5002,
    fetch: app.fetch,
};

