/**
 * DATABASE CLIENT — Sprint 1 (shared infrastructure)
 *
 * Single Prisma client instance shared across the application.
 * Prisma handles connection pooling automatically.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
