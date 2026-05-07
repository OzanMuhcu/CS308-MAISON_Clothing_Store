import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
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

async function createEmailTransporter() {
  const usingRealSmtp = Boolean(env.smtp.host && env.smtp.user);

  if (usingRealSmtp) {
    return nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

async function sendPasswordChangeCodeEmail(email: string, name: string, code: string) {
  const transporter = await createEmailTransporter();
  const fromEmail = env.smtp.from || "noreply@maison.local";

  const info = await transporter.sendMail({
    from: fromEmail,
    to: email,
    subject: "MAISON — Verify password change",
    text: `Hello ${name},\n\nYour password change verification code is: ${code}\n\nEnter this code in the account page to complete the password update. This code expires in 15 minutes.\n\nIf you did not request a password change, please ignore this email.\n`,
    html: `<p>Hello ${name},</p><p>Your password change verification code is:</p><p><strong>${code}</strong></p><p>This code expires in 15 minutes.</p><p>If you did not request this change, ignore this email.</p>`,
  });

  if (!env.smtp.host || !env.smtp.user) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email] Password change verification preview: ${previewUrl}`);
    }
  }
}

export async function requestPasswordChange(userId: number, password: string) {
  const user = (await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      passwordChangeCode: true,
      passwordChangeCodeExpiresAt: true,
      passwordChangeNewHash: true,
    },
  })) as {
    id: number;
    name: string;
    email: string;
    passwordChangeCode: string | null;
    passwordChangeCodeExpiresAt: Date | null;
    passwordChangeNewHash: string | null;
  } | null;
  if (!user) {
    throw new AppError(404, "User not found");
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const newHash = await bcrypt.hash(password, 12);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordChangeCode: code,
      passwordChangeCodeExpiresAt: expiresAt,
      passwordChangeNewHash: newHash,
    },
  });

  try {
    await sendPasswordChangeCodeEmail(user.email, user.name, code);
  } catch (err) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordChangeCode: null,
        passwordChangeCodeExpiresAt: null,
        passwordChangeNewHash: null,
      },
    });
    throw new AppError(500, "Failed to send verification code email. Please try again later.");
  }

  return { message: "Verification code sent to your email." };
}

export async function verifyPasswordChange(userId: number, code: string) {
  const user = (await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true,
      passwordChangeCode: true,
      passwordChangeCodeExpiresAt: true,
      passwordChangeNewHash: true,
    },
  })) as {
    id: number;
    passwordHash: string;
    passwordChangeCode: string | null;
    passwordChangeCodeExpiresAt: Date | null;
    passwordChangeNewHash: string | null;
  } | null;
  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (!user.passwordChangeCode || !user.passwordChangeCodeExpiresAt || !user.passwordChangeNewHash) {
    throw new AppError(400, "No pending password change request found.");
  }

  if (user.passwordChangeCodeExpiresAt.getTime() < Date.now()) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordChangeCode: null,
        passwordChangeCodeExpiresAt: null,
        passwordChangeNewHash: null,
      },
    });
    throw new AppError(400, "The verification code has expired. Please request a new one.");
  }

  if (user.passwordChangeCode !== code) {
    throw new AppError(400, "The verification code is incorrect.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: user.passwordChangeNewHash,
      passwordChangeCode: null,
      passwordChangeCodeExpiresAt: null,
      passwordChangeNewHash: null,
    },
  });

  return { message: "Password updated successfully." };
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
