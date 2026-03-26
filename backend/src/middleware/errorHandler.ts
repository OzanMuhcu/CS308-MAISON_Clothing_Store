/**
 * ERROR HANDLER — Sprint 1 (shared infrastructure)
 *
 * Centralized error handling for the Express app.
 * - AppError: custom error class with HTTP status codes
 * - ZodError: caught automatically from validation failures
 * - Unhandled errors: logged server-side, generic 500 to client
 *
 * Security note: never leak stack traces or internal details to the client.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Known application errors (e.g. 401 Invalid credentials)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Validation errors from zod
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Anything else — log internally, return generic message
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}
