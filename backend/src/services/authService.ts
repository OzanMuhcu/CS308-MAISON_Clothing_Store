import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../config/db";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { JwtPayload } from "../types";
import { registerSchema, loginSchema } from "../validators/auth";

export { registerSchema, loginSchema };

// ---- Service functions ----

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function safeUser(user: { id: number; name: string; email: string; role: string; createdAt: Date }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
}

export async function registerUser(input: z.infer<typeof registerSchema>) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: "customer",
    },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { user: safeUser(user), token };
}

export async function loginUser(input: z.infer<typeof loginSchema>) {
  // Use generic error message to avoid leaking whether the email exists
  const genericError = "Invalid email or password";

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AppError(401, genericError);
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, genericError);
  }

  const token = signToken({ userId: user.id, role: user.role });
  return { user: safeUser(user), token };
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "User not found");
  }
  return safeUser(user);
}
