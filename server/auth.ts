import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "amax-dev-secret-change-before-production";
const JWT_EXPIRY = "24h";

export interface AuthPayload {
  userId: number;
  username: string;
  email: string;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  if (hashed.startsWith("$2")) {
    return bcrypt.compare(plain, hashed);
  }
  // Plaintext fallback for migration (demo_user in DB has unhashed password).
  // This branch only runs if the stored value is NOT a bcrypt hash.
  return plain === hashed;
}

export function requireAuth(req: Request): AuthPayload {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    const err = new Error("Unauthorized — no token provided");
    (err as any).status = 401;
    throw err;
  }
  const payload = verifyToken(token);
  if (!payload) {
    const err = new Error("Unauthorized — invalid or expired token");
    (err as any).status = 401;
    throw err;
  }
  return payload;
}

export function optionalAuth(req: Request): AuthPayload | null {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  return verifyToken(token);
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const payload = requireAuth(req);
    (req as any).user = payload;
    next();
  } catch (err: any) {
    res.status(err.status || 401).json({ error: err.message });
  }
}
