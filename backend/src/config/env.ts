/**
 * ENVIRONMENT CONFIG — Sprint 1 (shared infrastructure)
 *
 * Loads settings from environment variables.
 * Secrets (JWT keys) must NEVER be hardcoded — they come from .env
 * The defaults here are only for local development convenience.
 */

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),

  // JWT secrets — Auth Foundation (Task 6)
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_in_production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_production',
  jwtExpiry: '15m',
  jwtRefreshExpiry: '7d',

  // Frontend URL for CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
