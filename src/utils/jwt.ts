import jwt from "jsonwebtoken";
import type { JwtUser, Role } from "../types/auth";
import { env } from "./env";

export function signToken(user: JwtUser): string {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): JwtUser {
  const decoded = jwt.verify(token, env.JWT_SECRET) as { sub?: string; role?: Role };
  if (!decoded.sub || !decoded.role) {
    throw new Error("Invalid token payload");
  }
  return { id: decoded.sub, role: decoded.role };
}

