/**
 * EXPRESS SERVER — Sprint 1
 *
 * Mounts only the routes needed for Sprint 1:
 *   - /api/auth   (login + register)
 *   - /api/products (basic listing — teammate)
 *   - /api/categories (list — teammate)
 *
 * Routes for orders, invoices, reviews, discounts, deliveries
 * will be added in later sprints.
 */

import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Sprint 1 routes
import authRoutes from './routes/auth';

const app = express();

// --- Middleware ---
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

// --- Routes ---
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Error handler (must be last) ---
app.use(errorHandler);

// --- Start ---
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

export default app;
