import type { NextFunction, Request, Response } from "express";
import { readDb } from "../storage/fileDb";
import { verifyToken } from "../utils/jwt";

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ error: { message: "Missing Authorization Bearer token" } });
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const jwtUser = verifyToken(token);
    const db = await readDb();
    const user = db.users.find((u) => u.id === jwtUser.id);
    if (!user) {
      return res.status(401).json({ error: { message: "Invalid token user" } });
    }
    if (user.status !== "active") {
      return res.status(403).json({ error: { message: "User is inactive" } });
    }
    req.user = { id: user.id, role: user.role };
    return next();
  } catch (e) {
    return res.status(401).json({ error: { message: "Invalid or expired token" } });
  }
}

